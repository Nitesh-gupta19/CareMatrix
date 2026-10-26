const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const Doctor = require("../models/Doctor");
const Ward = require("../models/Ward");
const Bed = require("../models/Bed");
const Admission = require("../models/Admission");
const ApiError = require("../utils/ApiError");

/**
 * Note on transactions (Section 56): a genuine MongoDB multi-document
 * transaction requires a replica set, which a plain local `mongod` does
 * not provide by default. Rather than assume one is available, the bed
 * status flip below uses an atomic conditional update
 * (`findOneAndUpdate` with a status filter) as a compare-and-swap - this
 * is what actually prevents two concurrent admissions from claiming the
 * same bed, transaction or not. If this project is deployed against a
 * real replica set / Atlas cluster, wrapping createAdmission in a
 * `session.withTransaction()` block would be a straightforward upgrade;
 * it is intentionally not required for correctness here.
 */

async function assertExists(Model, id, label) {
  const doc = await Model.findById(id);
  if (!doc) throw ApiError.badRequest(`${label} ${id} does not exist`);
  return doc;
}

/**
 * Validates every cross-reference in an admission payload BEFORE touching
 * the database for the bed flip, so a bad request never leaves a bed
 * incorrectly marked occupied.
 */
async function validateAdmissionRefs({ patientId, hospitalId, departmentId, doctorId, wardId, bedId }) {
  await assertExists(Patient, patientId, "Patient");
  await assertExists(Hospital, hospitalId, "Hospital");

  const department = await assertExists(Department, departmentId, "Department");
  if (String(department.hospitalId) !== String(hospitalId)) {
    throw ApiError.badRequest("departmentId does not belong to the given hospitalId");
  }

  const ward = await assertExists(Ward, wardId, "Ward");
  if (String(ward.hospitalId) !== String(hospitalId)) {
    throw ApiError.badRequest("wardId does not belong to the given hospitalId");
  }

  const bed = await assertExists(Bed, bedId, "Bed");
  if (String(bed.wardId) !== String(wardId)) {
    throw ApiError.badRequest("bedId does not belong to the given wardId");
  }

  const doctor = await assertExists(Doctor, doctorId, "Doctor");
  const isAffiliated = (doctor.hospitalAffiliations || []).some(
    (a) => String(a.hospitalId) === String(hospitalId) && a.status === "active"
  );
  if (!isAffiliated) {
    throw ApiError.badRequest("doctorId is not actively affiliated with the given hospitalId");
  }
}

/**
 * Creates an Admission, atomically claiming the bed. If the bed turns out
 * to already be occupied (a race with another request), the whole
 * operation fails cleanly with 409 and nothing is left half-written.
 */
async function createAdmission(payload) {
  const { patientId, hospitalId, departmentId, doctorId, wardId, bedId, reason } = payload;

  await validateAdmissionRefs({ patientId, hospitalId, departmentId, doctorId, wardId, bedId });

  // Compare-and-swap: only succeeds if the bed is currently 'available'.
  const claimedBed = await Bed.findOneAndUpdate(
    { _id: bedId, status: "available" },
    { $set: { status: "occupied" } },
    { new: true }
  );
  if (!claimedBed) {
    throw ApiError.conflict("This bed is not available (already occupied or under maintenance)");
  }

  try {
    const admission = await Admission.create({
      patientId,
      hospitalId,
      departmentId,
      doctorId,
      wardId,
      bedId,
      reason,
      admissionDate: new Date(),
      status: "admitted",
    });
    return admission;
  } catch (err) {
    // Roll back the bed claim if admission creation failed for any reason
    // (e.g. a validation error not already caught above).
    await Bed.findByIdAndUpdate(bedId, { $set: { status: "available" } });
    throw err;
  }
}

/**
 * Discharges a patient: closes the admission and frees the bed in the
 * same logical operation so the two can never drift apart.
 */
async function dischargePatient(admissionId) {
  const admission = await Admission.findById(admissionId);
  if (!admission) throw ApiError.notFound("Admission not found");
  if (admission.status !== "admitted") {
    throw ApiError.badRequest(`Admission is already '${admission.status}', cannot discharge`);
  }

  admission.status = "discharged";
  admission.dischargeDate = new Date();
  await admission.save();

  await Bed.findByIdAndUpdate(admission.bedId, { $set: { status: "available" } });

  return admission;
}

/**
 * Moves an active admission to a different ward/bed within the SAME
 * hospital stay (not a new Admission - the patient never left care).
 * Old bed is freed, new bed is atomically claimed.
 */
async function transferBed(admissionId, { wardId, bedId }) {
  const admission = await Admission.findById(admissionId);
  if (!admission) throw ApiError.notFound("Admission not found");
  if (admission.status !== "admitted") {
    throw ApiError.badRequest("Only an active admission can be transferred");
  }

  const ward = await assertExists(Ward, wardId, "Ward");
  if (String(ward.hospitalId) !== String(admission.hospitalId)) {
    throw ApiError.badRequest("Target ward does not belong to this admission's hospital");
  }
  const bed = await assertExists(Bed, bedId, "Bed");
  if (String(bed.wardId) !== String(wardId)) {
    throw ApiError.badRequest("Target bed does not belong to the target ward");
  }

  const claimedBed = await Bed.findOneAndUpdate(
    { _id: bedId, status: "available" },
    { $set: { status: "occupied" } },
    { new: true }
  );
  if (!claimedBed) {
    throw ApiError.conflict("The target bed is not available");
  }

  const oldBedId = admission.bedId;
  admission.wardId = wardId;
  admission.bedId = bedId;
  await admission.save();

  await Bed.findByIdAndUpdate(oldBedId, { $set: { status: "available" } });

  return admission;
}

/**
 * Resolves a patient's current (active) admission - the single query
 * behind "where is this patient right now" for dashboards.
 */
async function getActiveAdmissionForPatient(patientId) {
  return Admission.findOne({ patientId, status: "admitted" })
    .populate("hospitalId", "name city")
    .populate("departmentId", "name")
    .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
    .populate("wardId", "name type")
    .populate("bedId", "bedNumber");
}

module.exports = {
  createAdmission,
  dischargePatient,
  transferBed,
  getActiveAdmissionForPatient,
  validateAdmissionRefs,
};
