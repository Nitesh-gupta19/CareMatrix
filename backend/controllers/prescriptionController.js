const Prescription = require("../models/Prescription");
const Admission = require("../models/Admission");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

const POPULATE_FIELDS = [
  { path: "patientId", select: "patientId name" },
  { path: "doctorId", populate: { path: "userId", select: "name" } },
  { path: "admissionId", select: "hospitalId status admissionDate" },
];

/** POST /api/prescriptions  (DOCTOR only) */
const createPrescription = asyncHandler(async (req, res) => {
  if (req.user.role !== "DOCTOR") {
    throw ApiError.forbidden("Only a doctor can create a prescription");
  }
  const { patientId, admissionId, diagnosis, medicines, instructions } = req.body;
  if (!patientId || !admissionId) throw ApiError.badRequest("patientId and admissionId are required");

  const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);

  const admission = await Admission.findById(admissionId);
  if (!admission) throw ApiError.badRequest("admissionId does not reference an existing admission");
  if (String(admission.patientId) !== String(patientId)) {
    throw ApiError.badRequest("patientId does not match the patient on this admission");
  }
  if (String(admission.doctorId) !== String(doctor._id)) {
    throw ApiError.forbidden("You are not the treating doctor for this admission");
  }

  const prescription = await Prescription.create({
    patientId,
    doctorId: doctor._id,
    admissionId,
    diagnosis,
    medicines,
    instructions,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Prescription created successfully",
    data: prescription,
  });
});

/** GET /api/prescriptions - scoped by role */
const listPrescriptions = asyncHandler(async (req, res) => {
  const { admissionId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (admissionId) filter.admissionId = admissionId;

  if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    filter.doctorId = doctor._id;
  } else if (req.user.role === "PATIENT") {
    const patient = await scopeService.getPatientProfileByUserId(req.user._id);
    filter.patientId = patient._id;
  } else if (req.user.role === "RELATIVE") {
    if (!req.query.patientId) throw ApiError.badRequest("patientId query parameter is required");
    await scopeService.verifyRelativeAccess(req.user._id, req.query.patientId);
    filter.patientId = req.query.patientId;
  } else if (req.user.role === "ADMIN") {
    // SECURITY: previously an ADMIN saw every prescription in the system.
    // Prescription has no hospitalId directly - scope via admissions that
    // belong to this admin's hospital.
    if (filter.admissionId) {
      const admission = await Admission.findById(filter.admissionId).select("hospitalId");
      if (!admission || String(admission.hospitalId) !== String(req.user.hospitalId)) {
        throw ApiError.forbidden("This admission does not belong to your hospital");
      }
    } else {
      const admissionIds = await scopeService.getAdmissionIdsForHospital(req.user.hospitalId);
      filter.admissionId = { $in: admissionIds };
    }
  } else {
    throw ApiError.forbidden("You are not authorized to view prescriptions");
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Prescription.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Prescriptions retrieved successfully",
    data: prescriptions,
    pagination: buildPagination({ page, limit, total }),
  });
});

const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!prescription) throw ApiError.notFound("Prescription not found");

  // SECURITY: previously only PATIENT/RELATIVE were checked here - any
  // DOCTOR (not just the prescriber) or any NURSE could view any
  // prescription by ID, and ADMIN had no hospital scoping at all.
  if (req.user.role === "PATIENT") {
    const patient = await scopeService.getPatientProfileByUserId(req.user._id);
    if (String(patient._id) !== String(prescription.patientId._id || prescription.patientId)) {
      throw ApiError.forbidden("You can only view your own prescriptions");
    }
  } else if (req.user.role === "RELATIVE") {
    await scopeService.verifyRelativeAccess(
      req.user._id,
      prescription.patientId._id || prescription.patientId
    );
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    if (String(doctor._id) !== String(prescription.doctorId._id || prescription.doctorId)) {
      throw ApiError.forbidden("You did not create this prescription");
    }
  } else if (req.user.role === "ADMIN") {
    const admission = await Admission.findById(prescription.admissionId._id || prescription.admissionId).select(
      "hospitalId"
    );
    if (!admission || String(admission.hospitalId) !== String(req.user.hospitalId)) {
      throw ApiError.forbidden("This prescription does not belong to your hospital");
    }
  } else {
    // NURSE: not granted prescription visibility by the Authorization
    // Matrix (they see tasks/observations, not prescriptions) - deny.
    throw ApiError.forbidden("You are not authorized to view this prescription");
  }

  return sendSuccess(res, { message: "Prescription retrieved successfully", data: prescription });
});

/** PATCH /api/prescriptions/:id  (prescribing doctor only; status/instructions edits, never hard-deleted) */
const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) throw ApiError.notFound("Prescription not found");

  if (req.user.role !== "DOCTOR") {
    throw ApiError.forbidden("Only the prescribing doctor can update this prescription");
  }
  const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
  if (String(doctor._id) !== String(prescription.doctorId)) {
    throw ApiError.forbidden("You did not create this prescription");
  }

  const editable = ["diagnosis", "medicines", "instructions", "status"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) prescription[field] = req.body[field];
  });
  await prescription.save();

  return sendSuccess(res, { message: "Prescription updated successfully", data: prescription });
});

module.exports = { createPrescription, listPrescriptions, getPrescription, updatePrescription };
