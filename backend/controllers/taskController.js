const Task = require("../models/Task");
const Admission = require("../models/Admission");
const Nurse = require("../models/Nurse");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

const POPULATE_FIELDS = [
  { path: "assignedBy", select: "name role" },
  { path: "assignedTo", select: "name role" },
  { path: "patientId", select: "patientId name" },
];

/** POST /api/tasks  (DOCTOR only, per Authorization Matrix) */
const createTask = asyncHandler(async (req, res) => {
  if (req.user.role !== "DOCTOR") {
    throw ApiError.forbidden("Only a doctor can create a task");
  }
  const { title, description, assignedTo, patientId, admissionId, priority, dueDate } = req.body;
  if (!title || !assignedTo || !patientId || !admissionId) {
    throw ApiError.badRequest("title, assignedTo, patientId and admissionId are required");
  }

  const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
  const admission = await Admission.findById(admissionId);
  if (!admission) throw ApiError.badRequest("admissionId does not reference an existing admission");
  if (String(admission.doctorId) !== String(doctor._id)) {
    throw ApiError.forbidden("You are not the treating doctor for this admission");
  }

  const assigneeNurse = await Nurse.findOne({ userId: assignedTo });
  if (!assigneeNurse) throw ApiError.badRequest("assignedTo does not reference a valid nurse account");
  if (String(assigneeNurse.hospitalId) !== String(admission.hospitalId)) {
    throw ApiError.badRequest("The assigned nurse does not belong to this admission's hospital");
  }

  const task = await Task.create({
    title,
    description,
    assignedBy: req.user._id,
    assignedTo,
    patientId,
    admissionId,
    priority,
    dueDate,
  });

  return sendSuccess(res, { statusCode: 201, message: "Task created successfully", data: task });
});

/** GET /api/tasks - scoped by role */
const listTasks = asyncHandler(async (req, res) => {
  const { status, admissionId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === "NURSE") {
    filter.assignedTo = req.user._id;
    if (admissionId) filter.admissionId = admissionId;
  } else if (req.user.role === "DOCTOR") {
    filter.assignedBy = req.user._id;
    if (admissionId) filter.admissionId = admissionId;
  } else if (req.user.role === "ADMIN") {
    // SECURITY: previously an ADMIN saw every task in the system with no
    // hospital filter at all. Tasks don't carry hospitalId directly, so
    // scope via the set of admissions that belong to this admin's hospital.
    if (admissionId) {
      const admission = await Admission.findById(admissionId).select("hospitalId");
      if (!admission || String(admission.hospitalId) !== String(req.user.hospitalId)) {
        throw ApiError.forbidden("This admission does not belong to your hospital");
      }
      filter.admissionId = admissionId;
    } else {
      const admissionIds = await scopeService.getAdmissionIdsForHospital(req.user.hospitalId);
      filter.admissionId = { $in: admissionIds };
    }
  } else {
    throw ApiError.forbidden("You are not authorized to view tasks");
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter).populate(POPULATE_FIELDS).sort({ dueDate: 1 }).skip(skip).limit(Number(limit)),
    Task.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Tasks retrieved successfully",
    data: tasks,
    pagination: buildPagination({ page, limit, total }),
  });
});

// Legal task-status transitions - the backend, not the frontend, is what
// actually prevents skipping straight from 'pending' to 'completed' or
// resurrecting a 'cancelled'/'completed' task.
const TASK_TRANSITIONS = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!task) throw ApiError.notFound("Task not found");

  // SECURITY: previously this endpoint had NO authorization check at all -
  // any authenticated user of any role could view any task just by
  // guessing/incrementing its ID. Scope it the same way listTasks is
  // scoped, but for a single object.
  if (req.user.role === "NURSE") {
    if (String(task.assignedTo?._id || task.assignedTo) !== String(req.user._id)) {
      throw ApiError.forbidden("This task is not assigned to you");
    }
  } else if (req.user.role === "DOCTOR") {
    if (String(task.assignedBy?._id || task.assignedBy) !== String(req.user._id)) {
      throw ApiError.forbidden("You did not assign this task");
    }
  } else if (req.user.role === "ADMIN") {
    const admission = await Admission.findById(task.admissionId).select("hospitalId");
    if (!admission || String(admission.hospitalId) !== String(req.user.hospitalId)) {
      throw ApiError.forbidden("This task does not belong to your hospital");
    }
  } else {
    // PATIENT/RELATIVE: tasks are an internal staff workflow, never
    // patient-facing in the Authorization Matrix - deny outright.
    throw ApiError.forbidden("You are not authorized to view this task");
  }

  return sendSuccess(res, { message: "Task retrieved successfully", data: task });
});

/** PATCH /api/tasks/:id/status  (assigned nurse only, or the assigning doctor to cancel) */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Task.TASK_STATUSES.includes(status)) {
    throw ApiError.badRequest(`status must be one of: ${Task.TASK_STATUSES.join(", ")}`);
  }

  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound("Task not found");

  const isAssignee = String(task.assignedTo) === String(req.user._id);
  const isAssigner = String(task.assignedBy) === String(req.user._id);
  if (!isAssignee && !isAssigner) {
    throw ApiError.forbidden("Only the assigned nurse or the assigning doctor can update this task");
  }
  if (status === "cancelled" && !isAssigner) {
    throw ApiError.forbidden("Only the assigning doctor can cancel a task");
  }

  // SECURITY/CORRECTNESS: being the right person is not enough - the
  // transition itself must be legal (no jumping pending -> completed,
  // no reviving a completed/cancelled task). Enum membership alone
  // (checked above) does not enforce this.
  const legalNextStatuses = TASK_TRANSITIONS[task.status] || [];
  if (!legalNextStatuses.includes(status)) {
    throw ApiError.badRequest(`Cannot change status from '${task.status}' to '${status}'`);
  }

  task.status = status;
  if (status === "completed") task.completedAt = new Date();
  await task.save();

  return sendSuccess(res, { message: "Task status updated successfully", data: task });
});

module.exports = { createTask, listTasks, getTask, updateTaskStatus };
