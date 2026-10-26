const Observation = require("../models/Observation");
const Admission = require("../models/Admission");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

/** POST /api/observations  (NURSE only) */
const createObservation = asyncHandler(async (req, res) => {
  if (req.user.role !== "NURSE") {
    throw ApiError.forbidden("Only a nurse can record an observation");
  }
  const { patientId, admissionId, type, value, notes, observedAt } = req.body;
  if (!patientId || !admissionId || !type || !value) {
    throw ApiError.badRequest("patientId, admissionId, type and value are required");
  }

  const nurse = await scopeService.getNurseProfileByUserId(req.user._id);
  const admission = await Admission.findById(admissionId);
  if (!admission) throw ApiError.badRequest("admissionId does not reference an existing admission");
  scopeService.assertNurseBelongsToHospital(nurse, admission.hospitalId);
  if (String(admission.patientId) !== String(patientId)) {
    throw ApiError.badRequest("patientId does not match the patient on this admission");
  }

  const observation = await Observation.create({
    patientId,
    admissionId,
    nurseId: nurse._id,
    type,
    value,
    notes,
    observedAt: observedAt || new Date(),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Observation recorded successfully",
    data: observation,
  });
});

/** GET /api/observations - scoped by role */
const listObservations = asyncHandler(async (req, res) => {
  const { admissionId, page = 1, limit = 50 } = req.query;
  if (!admissionId) throw ApiError.badRequest("admissionId query parameter is required");

  const admission = await Admission.findById(admissionId);
  if (!admission) throw ApiError.notFound("Admission not found");

  if (req.user.role === "NURSE") {
    const nurse = await scopeService.getNurseProfileByUserId(req.user._id);
    scopeService.assertNurseBelongsToHospital(nurse, admission.hospitalId);
  } else if (req.user.role === "PATIENT") {
    const patient = await scopeService.getPatientProfileByUserId(req.user._id);
    if (String(patient._id) !== String(admission.patientId)) {
      throw ApiError.forbidden("You can only view your own observations");
    }
  } else if (req.user.role === "RELATIVE") {
    await scopeService.verifyRelativeAccess(req.user._id, admission.patientId);
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    if (String(doctor._id) !== String(admission.doctorId)) {
      throw ApiError.forbidden("You are not the treating doctor for this admission");
    }
  } else if (req.user.role === "ADMIN") {
    // SECURITY: previously ADMIN matched none of the branches above and
    // fell through with zero restriction - any admin could read any
    // hospital's observations by supplying its admissionId.
    if (String(admission.hospitalId) !== String(req.user.hospitalId)) {
      throw ApiError.forbidden("This admission does not belong to your hospital");
    }
  } else {
    throw ApiError.forbidden("You are not authorized to view observations");
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [observations, total] = await Promise.all([
    Observation.find({ admissionId }).sort({ observedAt: -1 }).skip(skip).limit(Number(limit)),
    Observation.countDocuments({ admissionId }),
  ]);

  return sendSuccess(res, {
    message: "Observations retrieved successfully",
    data: observations,
    pagination: buildPagination({ page, limit, total }),
  });
});

module.exports = { createObservation, listObservations };
