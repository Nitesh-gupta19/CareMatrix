const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Department = require("../models/Department");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

/**
 * POST /api/doctors  (ADMIN only, own hospital)
 *
 * SECURITY (Phase 3.1): previously PUBLIC - any anonymous visitor could
 * create a DOCTOR account (a privileged role with patient-data access)
 * simply by knowing/guessing a hospitalId+departmentId. Doctor creation
 * must now be performed by an authenticated ADMIN, and only for their own
 * hospital - it is no longer a self-service onboarding form. This does
 * NOT weaken the multi-hospital architecture: a doctor can still gain a
 * second (or third) hospital affiliation afterward via the existing
 * POST /api/doctors/:id/affiliations endpoint, which already requires
 * either the doctor themself or an admin of THAT hospital.
 */
const registerDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    doctorCode,
    specialization,
    qualification,
    licenseNumber,
    experience,
    hospitalId,
    departmentId,
  } = req.body;

  if (!name || !email || !password || !doctorCode || !licenseNumber || !hospitalId || !departmentId) {
    throw ApiError.badRequest(
      "name, email, password, doctorCode, licenseNumber, hospitalId and departmentId are all required"
    );
  }

  if (String(req.user.hospitalId) !== String(hospitalId)) {
    throw ApiError.forbidden("You can only onboard doctors into your own hospital");
  }

  const department = await Department.findById(departmentId);
  if (!department) throw ApiError.badRequest("departmentId does not exist");
  if (String(department.hospitalId) !== String(hospitalId)) {
    throw ApiError.badRequest("departmentId does not belong to the given hospitalId");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, password, phone, role: "DOCTOR" });

  let doctor;
  try {
    doctor = await Doctor.create({
      userId: user._id,
      doctorCode,
      specialization,
      qualification,
      licenseNumber,
      experience,
      hospitalAffiliations: [{ hospitalId, departmentId, status: "active" }],
    });
  } catch (err) {
    // Roll back the User if the Doctor profile could not be created
    // (e.g. duplicate doctorCode/licenseNumber) so we never leave an
    // orphaned login-only account behind.
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  const token = generateToken({ userId: user._id, role: user.role });
  return sendSuccess(res, {
    statusCode: 201,
    message: "Doctor registered successfully",
    data: { user, doctor, token },
  });
});

/**
 * POST /api/doctors/:id/affiliations  (self or ADMIN)
 * Adds an additional hospital affiliation to an existing doctor -
 * this is how "a doctor works at multiple hospitals" actually happens
 * after their initial registration.
 */
const addAffiliation = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId } = req.body;
  if (!hospitalId || !departmentId) {
    throw ApiError.badRequest("hospitalId and departmentId are required");
  }

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound("Doctor not found");

  if (req.user.role === "DOCTOR" && String(doctor.userId) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only add affiliations to your own profile");
  }
  if (req.user.role === "ADMIN" && String(req.user.hospitalId) !== String(hospitalId)) {
    // SECURITY: previously an ADMIN could grant a doctor an affiliation
    // with ANY hospital, not just their own.
    throw ApiError.forbidden("You can only add affiliations to your own hospital");
  }

  const department = await Department.findById(departmentId);
  if (!department) throw ApiError.badRequest("departmentId does not exist");
  if (String(department.hospitalId) !== String(hospitalId)) {
    throw ApiError.badRequest("departmentId does not belong to the given hospitalId");
  }

  const alreadyAffiliated = doctor.hospitalAffiliations.some(
    (a) => String(a.hospitalId) === String(hospitalId)
  );
  if (alreadyAffiliated) {
    throw ApiError.conflict("This doctor already has an affiliation with that hospital");
  }

  doctor.hospitalAffiliations.push({ hospitalId, departmentId, status: "active" });
  await doctor.save();

  return sendSuccess(res, { message: "Affiliation added successfully", data: doctor });
});

/** GET /api/doctors?hospitalId=...  (hospital-scoped listing) */
const listDoctors = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, page = 1, limit = 20 } = req.query;

  // SECURITY: previously any authenticated user of any role could pass
  // any hospitalId and receive that hospital's full doctor roster
  // (including email/phone) with zero ownership check. Directory-style
  // browsing across hospitals has no legitimate use case here - patients
  // and relatives see their treating doctor's details through the
  // (already-authorized) Admission population instead.
  if (!hospitalId) throw ApiError.badRequest("hospitalId query parameter is required");
  await scopeService.assertUserCanAccessHospital(req.user, hospitalId);

  const filter = { "hospitalAffiliations.hospitalId": hospitalId };
  if (departmentId) filter["hospitalAffiliations.departmentId"] = departmentId;

  const skip = (Number(page) - 1) * Number(limit);
  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .populate("userId", "name email phone status")
      .skip(skip)
      .limit(Number(limit)),
    Doctor.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Doctors retrieved successfully",
    data: doctors,
    pagination: buildPagination({ page, limit, total }),
  });
});

const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate("userId", "name email phone status");
  if (!doctor) throw ApiError.notFound("Doctor not found");

  // SECURITY: previously this had zero authorization - any authenticated
  // user could view any doctor's email/phone by ID. Allow it only for
  // staff who share a hospital with this doctor (or the doctor
  // themselves), matching the scoping used everywhere else.
  if (req.user.role === "DOCTOR") {
    if (String(doctor.userId?._id || doctor.userId) !== String(req.user._id)) {
      const requestingDoctor = await scopeService.getDoctorProfileByUserId(req.user._id);
      const sharesHospital = doctor.hospitalAffiliations.some((a) =>
        requestingDoctor.hospitalAffiliations.some(
          (b) => String(a.hospitalId) === String(b.hospitalId) && b.status === "active"
        )
      );
      if (!sharesHospital) throw ApiError.forbidden("You do not share a hospital with this doctor");
    }
  } else if (req.user.role === "ADMIN") {
    const sharesHospital = doctor.hospitalAffiliations.some(
      (a) => String(a.hospitalId) === String(req.user.hospitalId) && a.status === "active"
    );
    if (!sharesHospital) throw ApiError.forbidden("This doctor is not affiliated with your hospital");
  } else if (req.user.role === "NURSE") {
    const nurse = await scopeService.getNurseProfileByUserId(req.user._id);
    const sharesHospital = doctor.hospitalAffiliations.some(
      (a) => String(a.hospitalId) === String(nurse.hospitalId) && a.status === "active"
    );
    if (!sharesHospital) throw ApiError.forbidden("This doctor is not affiliated with your hospital");
  } else {
    // PATIENT/RELATIVE see their treating doctor's info via the
    // already-authorized Admission population, not this directory route.
    throw ApiError.forbidden("You are not authorized to view this doctor's profile");
  }

  return sendSuccess(res, { message: "Doctor retrieved successfully", data: doctor });
});

/**
 * GET /api/doctors/me  (DOCTOR only)
 *
 * PHASE 3 ADDITION: Phase 2 only exposed GET /api/doctors/:id (lookup by
 * Doctor document _id). A logged-in doctor's JWT only contains their
 * User _id, not their Doctor _id, so the frontend had no way to resolve
 * "my own profile" (needed for the hospital-affiliation selector on the
 * doctor dashboard) without this. This mirrors the existing
 * scopeService.getDoctorProfileByUserId pattern already used elsewhere -
 * no architecture change, just the missing self-lookup.
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id })
    .populate("userId", "name email phone status")
    .populate("hospitalAffiliations.hospitalId", "name city")
    .populate("hospitalAffiliations.departmentId", "name");
  if (!doctor) throw ApiError.notFound("No doctor profile is associated with this account");
  return sendSuccess(res, { message: "Doctor profile retrieved successfully", data: doctor });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound("Doctor not found");

  if (req.user.role === "DOCTOR" && String(doctor.userId) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only update your own profile");
  }
  if (req.user.role === "ADMIN") {
    // SECURITY: previously ADMIN had no scoping here at all - any admin
    // could edit any doctor's specialization/status system-wide.
    const sharesHospital = doctor.hospitalAffiliations.some(
      (a) => String(a.hospitalId) === String(req.user.hospitalId) && a.status === "active"
    );
    if (!sharesHospital) throw ApiError.forbidden("This doctor is not affiliated with your hospital");
  }

  const editable = ["specialization", "qualification", "experience", "status"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) doctor[field] = req.body[field];
  });
  await doctor.save();

  return sendSuccess(res, { message: "Doctor updated successfully", data: doctor });
});

module.exports = { registerDoctor, addAffiliation, listDoctors, getDoctor, getMyProfile, updateDoctor };
