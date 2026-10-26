const Patient = require("../models/Patient");
const Admission = require("../models/Admission");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const admissionService = require("../services/admissionService");
const scopeService = require("../services/scopeService");

/**
 * POST /api/patients  (ADMIN or DOCTOR - intake)
 * Patients are created by hospital staff during intake, not via open
 * self-registration (Section 22 of the Phase 1 journey) - a patientId is
 * generated server-side so it can never collide with one a user types in.
 */
const createPatient = asyncHandler(async (req, res) => {
  const { name, dateOfBirth, gender, bloodGroup, phone, address, emergencyContact } = req.body;
  if (!name) throw ApiError.badRequest("name is required");

  const patientId = `PT-${Date.now().toString(36).toUpperCase()}`;

  const patient = await Patient.create({
    patientId,
    name,
    dateOfBirth,
    gender,
    bloodGroup,
    phone,
    address,
    emergencyContact,
  });

  return sendSuccess(res, { statusCode: 201, message: "Patient created successfully", data: patient });
});

/**
 * GET /api/patients/lookup/:patientId  (PUBLIC, minimal fields only)
 * Backing endpoint for the "Patient Access" landing flow (Section 22): the
 * visitor types a Patient ID and sees just enough to confirm it's them
 * before any authenticated dashboard access is granted.
 *
 * SECURITY: this route is PUBLIC by design (reachable before login), so it
 * must never return hospital, department, doctor, ward, bed, or any other
 * admission detail - only the minimum needed to confirm identity, plus a
 * boolean flag (not the admission itself) so a caller can tell "there is
 * an active stay" without learning anything about it.
 */
const lookupPatientForAccess = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.patientId.toUpperCase() }).select(
    "patientId name status"
  );
  if (!patient) throw ApiError.notFound("We couldn't find that Patient ID");

  const admission = await admissionService.getActiveAdmissionForPatient(patient._id);

  return sendSuccess(res, {
    message: "Patient found",
    data: {
      patient: { patientId: patient.patientId, name: patient.name, status: patient.status },
      hasActiveAdmission: Boolean(admission),
    },
  });
});

/** GET /api/patients?hospitalId=&status=active  (staff, scoped via active admissions) */
const listPatients = asyncHandler(async (req, res) => {
  if (!["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)) {
    throw ApiError.forbidden("Only hospital staff can list patients");
  }

  const { hospitalId, page = 1, limit = 20 } = req.query;
  let effectiveHospitalId;

  // IMPORTANT: hospitalId must never be trusted directly from the query
  // string - it is only ever used as a REQUEST for which of the caller's
  // own hospitals to filter to. The caller's actual hospital/affiliation
  // is what determines whether that request is allowed.
  if (req.user.role === "ADMIN") {
    if (hospitalId && String(hospitalId) !== String(req.user.hospitalId)) {
      throw ApiError.forbidden("You can only list patients for your own hospital");
    }
    effectiveHospitalId = req.user.hospitalId;
  } else if (req.user.role === "NURSE") {
    const nurse = await scopeService.getNurseProfileByUserId(req.user._id);
    if (hospitalId && String(hospitalId) !== String(nurse.hospitalId)) {
      throw ApiError.forbidden("You can only list patients for your own hospital");
    }
    effectiveHospitalId = nurse.hospitalId;
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    if (hospitalId) {
      scopeService.assertDoctorAffiliatedWithHospital(doctor, hospitalId);
      effectiveHospitalId = hospitalId;
    } else if (doctor.hospitalAffiliations.length === 1) {
      effectiveHospitalId = doctor.hospitalAffiliations[0].hospitalId;
    } else {
      throw ApiError.badRequest(
        "hospitalId is required (you are affiliated with multiple hospitals - specify which one)"
      );
    }
  }

  if (!effectiveHospitalId) {
    throw ApiError.badRequest("hospitalId is required");
  }

  // Patients don't carry hospitalId themselves - scope via active admissions.
  const admissions = await Admission.find({ hospitalId: effectiveHospitalId, status: "admitted" }).select(
    "patientId"
  );
  const patientIds = admissions.map((a) => a.patientId);

  const skip = (Number(page) - 1) * Number(limit);
  const [patients, total] = await Promise.all([
    Patient.find({ _id: { $in: patientIds } }).skip(skip).limit(Number(limit)),
    Patient.countDocuments({ _id: { $in: patientIds } }),
  ]);

  return sendSuccess(res, {
    message: "Patients retrieved successfully",
    data: patients,
    pagination: buildPagination({ page, limit, total }),
  });
});

/**
 * GET /api/patients/me  (PATIENT only) - PHASE 3 ADDITION, same reasoning:
 * a patient's JWT has their User _id, not their Patient _id, and no
 * Phase 2 route resolved "my own patient profile" directly.
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await scopeService.getPatientProfileByUserId(req.user._id);
  return sendSuccess(res, { message: "Patient profile retrieved successfully", data: patient });
});

/** GET /api/patients/:id  (role-scoped: self, authorized relative, or treating staff) */
const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw ApiError.notFound("Patient not found");

  if (req.user.role === "PATIENT") {
    const self = await scopeService.getPatientProfileByUserId(req.user._id);
    if (String(self._id) !== String(patient._id)) {
      throw ApiError.forbidden("You can only view your own record");
    }
  } else if (req.user.role === "RELATIVE") {
    await scopeService.verifyRelativeAccess(req.user._id, patient._id);
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    await scopeService.assertDoctorTreatsPatient(doctor._id, patient._id);
  } else if (req.user.role === "NURSE") {
    const nurse = await scopeService.getNurseProfileByUserId(req.user._id);
    const inHospital = await Admission.exists({
      patientId: patient._id,
      hospitalId: nurse.hospitalId,
      status: "admitted",
    });
    if (!inHospital) throw ApiError.forbidden("This patient is not in your hospital");
  } else if (req.user.role === "ADMIN") {
    // SECURITY (Phase 3.1): previously ADMIN had NO scoping here at all -
    // "hospital-wide oversight" actually meant any admin, from any
    // hospital, could view any patient by ID. Patient has no hospitalId,
    // so ownership is determined via admission history at this hospital.
    await scopeService.assertPatientHasHistoryAtHospital(patient._id, req.user.hospitalId);
  } else {
    throw ApiError.forbidden("You are not authorized to view this patient");
  }

  return sendSuccess(res, { message: "Patient retrieved successfully", data: patient });
});

/**
 * PUT/PATCH /api/patients/:id
 *
 * Authorization (Phase 3.1 fix - previously ADMIN and DOCTOR could edit
 * ANY patient system-wide with no scoping at all):
 *   PATIENT -> only their own profile
 *   DOCTOR  -> only a patient they are actually treating (real Admission)
 *   ADMIN   -> only a patient with admission history at the admin's hospital
 *   NURSE   -> denied (not part of the Authorization Matrix's write access)
 *   RELATIVE -> denied
 */
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw ApiError.notFound("Patient not found");

  if (req.user.role === "PATIENT") {
    const self = await scopeService.getPatientProfileByUserId(req.user._id);
    if (String(self._id) !== String(patient._id)) {
      throw ApiError.forbidden("You can only update your own record");
    }
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    await scopeService.assertDoctorTreatsPatient(doctor._id, patient._id);
  } else if (req.user.role === "ADMIN") {
    // Patient intentionally has no hospitalId - ownership is proven only
    // through admission history at this admin's hospital.
    await scopeService.assertPatientHasHistoryAtHospital(patient._id, req.user.hospitalId);
  } else {
    // NURSE and RELATIVE: explicitly denied - neither is granted patient
    // write access by the Authorization Matrix.
    throw ApiError.forbidden("You are not authorized to update patient records");
  }

  const editable = ["name", "dateOfBirth", "gender", "bloodGroup", "phone", "address", "emergencyContact", "status"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) patient[field] = req.body[field];
  });
  await patient.save();

  return sendSuccess(res, { message: "Patient updated successfully", data: patient });
});

module.exports = {
  createPatient,
  lookupPatientForAccess,
  listPatients,
  getPatient,
  getMyProfile,
  updatePatient,
};
