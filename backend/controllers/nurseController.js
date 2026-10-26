const Nurse = require("../models/Nurse");
const User = require("../models/User");
const Department = require("../models/Department");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

/**
 * POST /api/nurses  (ADMIN only, own hospital)
 *
 * SECURITY (Phase 3.1): previously PUBLIC - any anonymous visitor could
 * create a NURSE account (a privileged role with patient-data access) by
 * knowing/guessing a hospitalId+departmentId. Nurse creation must now be
 * performed by an authenticated ADMIN, only for their own hospital.
 */
const registerNurse = asyncHandler(async (req, res) => {
  const { name, email, password, phone, employeeId, hospitalId, departmentId, qualification, shift } =
    req.body;

  if (!name || !email || !password || !employeeId || !hospitalId || !departmentId) {
    throw ApiError.badRequest(
      "name, email, password, employeeId, hospitalId and departmentId are all required"
    );
  }

  if (String(req.user.hospitalId) !== String(hospitalId)) {
    throw ApiError.forbidden("You can only onboard nurses into your own hospital");
  }

  const department = await Department.findById(departmentId);
  if (!department) throw ApiError.badRequest("departmentId does not exist");
  if (String(department.hospitalId) !== String(hospitalId)) {
    throw ApiError.badRequest("departmentId does not belong to the given hospitalId");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, password, phone, role: "NURSE" });

  let nurse;
  try {
    nurse = await Nurse.create({
      userId: user._id,
      employeeId,
      hospitalId,
      departmentId,
      qualification,
      shift,
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  const token = generateToken({ userId: user._id, role: user.role });
  return sendSuccess(res, {
    statusCode: 201,
    message: "Nurse registered successfully",
    data: { user, nurse, token },
  });
});

/** GET /api/nurses?hospitalId=...  (hospital-scoped listing) */
const listNurses = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, page = 1, limit = 20 } = req.query;

  // SECURITY: previously any authenticated user of any role could pass
  // any hospitalId and receive that hospital's full nurse roster
  // (including email/phone) with zero ownership check.
  if (!hospitalId) throw ApiError.badRequest("hospitalId query parameter is required");
  await scopeService.assertUserCanAccessHospital(req.user, hospitalId);

  const filter = { hospitalId };
  if (departmentId) filter.departmentId = departmentId;

  const skip = (Number(page) - 1) * Number(limit);
  const [nurses, total] = await Promise.all([
    Nurse.find(filter).populate("userId", "name email phone status").skip(skip).limit(Number(limit)),
    Nurse.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Nurses retrieved successfully",
    data: nurses,
    pagination: buildPagination({ page, limit, total }),
  });
});

const getNurse = asyncHandler(async (req, res) => {
  const nurse = await Nurse.findById(req.params.id).populate("userId", "name email phone status");
  if (!nurse) throw ApiError.notFound("Nurse not found");

  // SECURITY: previously this had zero authorization - any authenticated
  // user could view any nurse's email/phone by ID.
  if (req.user.role === "NURSE") {
    if (String(nurse.userId?._id || nurse.userId) !== String(req.user._id)) {
      const requestingNurse = await scopeService.getNurseProfileByUserId(req.user._id);
      if (String(requestingNurse.hospitalId) !== String(nurse.hospitalId)) {
        throw ApiError.forbidden("You do not share a hospital with this nurse");
      }
    }
  } else if (req.user.role === "ADMIN") {
    if (String(req.user.hospitalId) !== String(nurse.hospitalId)) {
      throw ApiError.forbidden("This nurse is not at your hospital");
    }
  } else if (req.user.role === "DOCTOR") {
    const doctor = await scopeService.getDoctorProfileByUserId(req.user._id);
    const sharesHospital = doctor.hospitalAffiliations.some(
      (a) => String(a.hospitalId) === String(nurse.hospitalId) && a.status === "active"
    );
    if (!sharesHospital) throw ApiError.forbidden("This nurse is not at a hospital you're affiliated with");
  } else {
    throw ApiError.forbidden("You are not authorized to view this nurse's profile");
  }

  return sendSuccess(res, { message: "Nurse retrieved successfully", data: nurse });
});

/**
 * GET /api/nurses/me  (NURSE only) - PHASE 3 ADDITION, same reasoning as
 * doctorController.getMyProfile: a nurse's JWT has their User _id, not
 * their Nurse _id, so a self-lookup route was missing from Phase 2.
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const nurse = await Nurse.findOne({ userId: req.user._id })
    .populate("userId", "name email phone status")
    .populate("hospitalId", "name city")
    .populate("departmentId", "name");
  if (!nurse) throw ApiError.notFound("No nurse profile is associated with this account");
  return sendSuccess(res, { message: "Nurse profile retrieved successfully", data: nurse });
});

const updateNurse = asyncHandler(async (req, res) => {
  const nurse = await Nurse.findById(req.params.id);
  if (!nurse) throw ApiError.notFound("Nurse not found");

  if (req.user.role === "NURSE" && String(nurse.userId) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only update your own profile");
  }
  if (req.user.role === "ADMIN" && String(req.user.hospitalId) !== String(nurse.hospitalId)) {
    // SECURITY: previously ADMIN had no scoping here - any admin could
    // edit any nurse's shift/status system-wide.
    throw ApiError.forbidden("This nurse is not at your hospital");
  }

  const editable = ["qualification", "shift", "status"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) nurse[field] = req.body[field];
  });
  await nurse.save();

  return sendSuccess(res, { message: "Nurse updated successfully", data: nurse });
});

module.exports = { registerNurse, listNurses, getNurse, getMyProfile, updateNurse };
