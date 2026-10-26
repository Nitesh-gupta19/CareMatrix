const Admission = require("../models/Admission");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const admissionService = require("../services/admissionService");
const scopeService = require("../services/scopeService");

const POPULATE_FIELDS = [
  { path: "patientId", select: "patientId name" },
  { path: "hospitalId", select: "name city" },
  { path: "departmentId", select: "name" },
  { path: "doctorId", populate: { path: "userId", select: "name" } },
  { path: "wardId", select: "name type" },
  { path: "bedId", select: "bedNumber" },
];

/**
 * POST /api/admissions  (ADMIN or DOCTOR)
 * All the cross-reference and bed-availability validation lives in
 * admissionService, so it is identical no matter which controller calls
 * it and can never drift out of sync with the model-level checks.
 */
const createAdmission = asyncHandler(async (req, res) => {
  if (!["ADMIN", "DOCTOR"].includes(req.user.role)) {
    throw ApiError.forbidden("Only hospital admin or a doctor can create an admission");
  }

  if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    scopeService.assertDoctorAffiliatedWithHospital(doctor, req.body.hospitalId);
  } else if (req.user.role === "ADMIN") {
    if (String(req.user.hospitalId) !== String(req.body.hospitalId)) {
      throw ApiError.forbidden("You can only admit patients to your own hospital");
    }
  }

  const admission = await admissionService.createAdmission(req.body);
  return sendSuccess(res, { statusCode: 201, message: "Admission created successfully", data: admission });
});

/**
 * GET /api/admissions  - scoped by role:
 * ADMIN -> own hospital, DOCTOR -> own admissions, NURSE -> own hospital,
 * PATIENT -> own admissions, RELATIVE -> authorized patient's admissions.
 */
const listAdmissions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === "ADMIN") {
    filter.hospitalId = req.user.hospitalId;
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    filter.doctorId = doctor._id;
  } else if (req.user.role === "NURSE") {
    const nurse = await scopeService.getNurseProfileByUserId(req.user._id);
    filter.hospitalId = nurse.hospitalId;
  } else if (req.user.role === "PATIENT") {
    const patient = await scopeService.getPatientProfileByUserId(req.user._id);
    filter.patientId = patient._id;
  } else if (req.user.role === "RELATIVE") {
    if (!req.query.patientId) throw ApiError.badRequest("patientId query parameter is required");
    await scopeService.verifyRelativeAccess(req.user._id, req.query.patientId);
    filter.patientId = req.query.patientId;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [admissions, total] = await Promise.all([
    Admission.find(filter)
      .populate(POPULATE_FIELDS)
      .sort({ admissionDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Admission.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Admissions retrieved successfully",
    data: admissions,
    pagination: buildPagination({ page, limit, total }),
  });
});

/** GET /api/admissions/:id */
const getAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!admission) throw ApiError.notFound("Admission not found");

  if (req.user.role === "RELATIVE") {
    await scopeService.verifyRelativeAccess(req.user._id, admission.patientId._id || admission.patientId);
  } else if (req.user.role === "PATIENT") {
    const patient = await scopeService.getPatientProfileByUserId(req.user._id);
    if (String(patient._id) !== String(admission.patientId._id || admission.patientId)) {
      throw ApiError.forbidden("You can only view your own admission");
    }
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    if (String(doctor._id) !== String(admission.doctorId._id || admission.doctorId)) {
      throw ApiError.forbidden("You are not the treating doctor for this admission");
    }
  } else if (req.user.role === "NURSE") {
    const nurse = await scopeService.getNurseProfileByUserId(req.user._id);
    scopeService.assertNurseBelongsToHospital(nurse, admission.hospitalId._id || admission.hospitalId);
  } else if (req.user.role === "ADMIN") {
    if (String(req.user.hospitalId) !== String(admission.hospitalId._id || admission.hospitalId)) {
      throw ApiError.forbidden("This admission does not belong to your hospital");
    }
  }

  return sendSuccess(res, { message: "Admission retrieved successfully", data: admission });
});

/** PATCH /api/admissions/:id  (limited field edits, e.g. reason) */
const updateAdmission = asyncHandler(async (req, res) => {
  if (!["ADMIN", "DOCTOR"].includes(req.user.role)) {
    throw ApiError.forbidden("Only hospital admin or a doctor can update an admission");
  }
  const admission = await Admission.findById(req.params.id);
  if (!admission) throw ApiError.notFound("Admission not found");

  // SECURITY: previously this had no ownership check at all - any admin
  // or doctor, from any hospital, could edit any admission by ID.
  await scopeService.assertCanManageAdmission(req.user, admission);

  if (req.body.reason !== undefined) admission.reason = req.body.reason;
  await admission.save();

  return sendSuccess(res, { message: "Admission updated successfully", data: admission });
});

/** POST /api/admissions/:id/discharge */
const dischargeAdmission = asyncHandler(async (req, res) => {
  if (!["ADMIN", "DOCTOR"].includes(req.user.role)) {
    throw ApiError.forbidden("Only hospital admin or a doctor can discharge a patient");
  }
  // SECURITY: previously any admin/doctor could discharge ANY admission
  // (and free its bed) regardless of hospital - a mutating action, worse
  // than a read leak. Load the admission first to check ownership before
  // calling the service that actually performs the discharge.
  const existing = await Admission.findById(req.params.id);
  if (!existing) throw ApiError.notFound("Admission not found");
  await scopeService.assertCanManageAdmission(req.user, existing);

  const admission = await admissionService.dischargePatient(req.params.id);
  return sendSuccess(res, { message: "Patient discharged successfully", data: admission });
});

/** PATCH /api/admissions/:id/transfer  (ward/bed change within the same stay) */
const transferAdmission = asyncHandler(async (req, res) => {
  if (!["ADMIN", "DOCTOR"].includes(req.user.role)) {
    throw ApiError.forbidden("Only hospital admin or a doctor can transfer a patient");
  }
  const { wardId, bedId } = req.body;
  if (!wardId || !bedId) throw ApiError.badRequest("wardId and bedId are required");

  // SECURITY: previously any admin/doctor could transfer ANY admission to
  // ANY ward/bed regardless of hospital ownership.
  const existing = await Admission.findById(req.params.id);
  if (!existing) throw ApiError.notFound("Admission not found");
  await scopeService.assertCanManageAdmission(req.user, existing);

  const admission = await admissionService.transferBed(req.params.id, { wardId, bedId });
  return sendSuccess(res, { message: "Patient transferred successfully", data: admission });
});

module.exports = {
  createAdmission,
  listAdmissions,
  getAdmission,
  updateAdmission,
  dischargeAdmission,
  transferAdmission,
};
