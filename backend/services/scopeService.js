const Doctor = require("../models/Doctor");
const Nurse = require("../models/Nurse");
const Patient = require("../models/Patient");
const PatientRelative = require("../models/PatientRelative");
const ApiError = require("../utils/ApiError");

/**
 * Centralized hospital/patient/relative scoping checks. These are called
 * from controllers so the same authorization logic is never re-implemented
 * ad hoc per endpoint (Section 28/54 - this is what prevents a doctor from
 * Hospital A reaching Hospital B's data, and what prevents a relative from
 * reaching an unauthorized patient's data).
 */

async function getDoctorProfileByUserId(userId) {
  const doctor = await Doctor.findOne({ userId });
  if (!doctor) throw ApiError.forbidden("No doctor profile is associated with this account");
  return doctor;
}

async function getNurseProfileByUserId(userId) {
  const nurse = await Nurse.findOne({ userId });
  if (!nurse) throw ApiError.forbidden("No nurse profile is associated with this account");
  return nurse;
}

async function getPatientProfileByUserId(userId) {
  const patient = await Patient.findOne({ userId });
  if (!patient) throw ApiError.forbidden("No patient profile is associated with this account");
  return patient;
}

/** Throws 403 unless the doctor has an ACTIVE affiliation with hospitalId. */
function assertDoctorAffiliatedWithHospital(doctorDoc, hospitalId) {
  const ok = (doctorDoc.hospitalAffiliations || []).some(
    (a) => String(a.hospitalId) === String(hospitalId) && a.status === "active"
  );
  if (!ok) {
    throw ApiError.forbidden("You are not affiliated with this hospital");
  }
}

/** Throws 403 unless the nurse belongs to hospitalId. */
function assertNurseBelongsToHospital(nurseDoc, hospitalId) {
  if (String(nurseDoc.hospitalId) !== String(hospitalId)) {
    throw ApiError.forbidden("You do not belong to this hospital");
  }
}

/**
 * Throws 403 unless relativeUserId has an APPROVED PatientRelative record
 * for patientId. Every relative-facing controller calls this before
 * returning any patient data.
 */
async function verifyRelativeAccess(relativeUserId, patientId) {
  const link = await PatientRelative.findOne({
    relativeUserId,
    patientId,
    accessStatus: "approved",
  });
  if (!link) {
    throw ApiError.forbidden("You are not authorized to access this patient's information");
  }
  return link;
}

/**
 * Throws 403 unless `user` (any role) is legitimately associated with
 * `hospitalId`: ADMIN must own it, DOCTOR must have an active affiliation
 * with it, NURSE must belong to it. Any other role is denied outright.
 * This is the single check used everywhere a query parameter or a
 * resource's hospitalId needs to be validated against the caller,
 * instead of every controller re-implementing its own version (which is
 * exactly how several cross-hospital leaks slipped through previously -
 * see Phase 3 rebuild report).
 */
async function assertUserCanAccessHospital(user, hospitalId) {
  if (!hospitalId) throw ApiError.badRequest("hospitalId is required");

  if (user.role === "ADMIN") {
    if (String(user.hospitalId) !== String(hospitalId)) {
      throw ApiError.forbidden("You are not authorized for this hospital");
    }
    return;
  }
  if (user.role === "DOCTOR") {
    const doctor = await getDoctorProfileByUserId(user._id);
    assertDoctorAffiliatedWithHospital(doctor, hospitalId);
    return;
  }
  if (user.role === "NURSE") {
    const nurse = await getNurseProfileByUserId(user._id);
    assertNurseBelongsToHospital(nurse, hospitalId);
    return;
  }
  throw ApiError.forbidden("You are not authorized for this hospital");
}

/**
 * Throws 403 unless `user` is allowed to MODIFY the given admission
 * (update/discharge/transfer): ADMIN must own its hospital, DOCTOR must
 * be its treating doctor. No other role reaches these mutating endpoints
 * at the route level, but this is checked explicitly regardless so the
 * function is safe to call on its own.
 */
async function assertCanManageAdmission(user, admission) {
  if (user.role === "ADMIN") {
    if (String(user.hospitalId) !== String(admission.hospitalId)) {
      throw ApiError.forbidden("This admission does not belong to your hospital");
    }
    return;
  }
  if (user.role === "DOCTOR") {
    const doctor = await getDoctorProfileByUserId(user._id);
    if (String(doctor._id) !== String(admission.doctorId)) {
      throw ApiError.forbidden("You are not the treating doctor for this admission");
    }
    return;
  }
  throw ApiError.forbidden("You are not authorized to manage this admission");
}

/**
 * Resolves the set of Admission _ids that belong to a given hospital.
 * Used to hospital-scope list endpoints (tasks, prescriptions) for ADMIN,
 * since Task/Prescription don't carry hospitalId directly - only their
 * parent Admission does.
 */
async function getAdmissionIdsForHospital(hospitalId) {
  const Admission = require("../models/Admission");
  const admissions = await Admission.find({ hospitalId }).select("_id");
  return admissions.map((a) => a._id);
}

/**
 * A patient has no hospitalId of their own (by design), so "does this
 * patient belong to my hospital" for an ADMIN is answered by checking
 * whether they have ANY admission - past or present - at that hospital.
 * Shared by patientController (get/update) and relativeController
 * (access-request management) so this rule lives in exactly one place.
 */
async function assertPatientHasHistoryAtHospital(patientId, hospitalId) {
  const Admission = require("../models/Admission");
  const exists = await Admission.exists({ patientId, hospitalId });
  if (!exists) {
    throw ApiError.forbidden("This patient has no history at your hospital");
  }
}

/** Throws 403 unless this doctor has ever actually treated this patient (via any admission). */
async function assertDoctorTreatsPatient(doctorId, patientId) {
  const Admission = require("../models/Admission");
  const exists = await Admission.exists({ patientId, doctorId });
  if (!exists) {
    throw ApiError.forbidden("You are not treating this patient");
  }
}

module.exports = {
  getDoctorProfileByUserId,
  getNurseProfileByUserId,
  getPatientProfileByUserId,
  assertDoctorAffiliatedWithHospital,
  assertNurseBelongsToHospital,
  verifyRelativeAccess,
  assertUserCanAccessHospital,
  assertCanManageAdmission,
  getAdmissionIdsForHospital,
  assertPatientHasHistoryAtHospital,
  assertDoctorTreatsPatient,
};
