const Hospital = require("../models/Hospital");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");

/**
 * POST /api/hospitals/register  (PUBLIC)
 * Creates a Hospital AND its first ADMIN user in one call - this is the
 * only way a hospital enters the system, and the only way an ADMIN
 * account is created (Section 19 of the Phase 1 journey).
 */
const registerHospital = asyncHandler(async (req, res) => {
  const {
    name,
    registrationNumber,
    address,
    city,
    state,
    pincode,
    phone,
    email,
    website,
    admin, // { name, email, password, phone }
  } = req.body;

  if (!name || !registrationNumber) {
    throw ApiError.badRequest("Hospital name and registrationNumber are required");
  }
  if (!admin || !admin.name || !admin.email || !admin.password) {
    throw ApiError.badRequest("admin.name, admin.email and admin.password are required");
  }

  const existingHospital = await Hospital.findOne({ registrationNumber });
  if (existingHospital) {
    throw ApiError.conflict("A hospital with this registration number already exists");
  }
  const existingUser = await User.findOne({ email: admin.email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict("An account with this admin email already exists");
  }

  const hospital = await Hospital.create({
    name,
    registrationNumber,
    address,
    city,
    state,
    pincode,
    phone,
    email,
    website,
  });

  const adminUser = await User.create({
    name: admin.name,
    email: admin.email,
    password: admin.password,
    phone: admin.phone,
    role: "ADMIN",
    hospitalId: hospital._id,
  });

  const token = generateToken({ userId: adminUser._id, role: adminUser.role });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Hospital registered successfully",
    data: { hospital, admin: adminUser, token },
  });
});

/**
 * GET /api/hospitals  (PUBLIC - limited fields, used by "find your hospital"
 * search during doctor/nurse onboarding, per Section 20/21)
 */
const listHospitals = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { status: "active" };
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [hospitals, total] = await Promise.all([
    Hospital.find(filter).select("name city state").skip(skip).limit(Number(limit)),
    Hospital.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Hospitals retrieved successfully",
    data: hospitals,
    pagination: buildPagination({ page, limit, total }),
  });
});

/**
 * GET /api/hospitals/:id
 */
const getHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) throw ApiError.notFound("Hospital not found");
  return sendSuccess(res, { message: "Hospital retrieved successfully", data: hospital });
});

/**
 * PUT/PATCH /api/hospitals/:id  (ADMIN of that hospital only)
 */
const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) throw ApiError.notFound("Hospital not found");

  if (String(req.user.hospitalId) !== String(hospital._id)) {
    throw ApiError.forbidden("You can only manage your own hospital");
  }

  const editable = ["name", "address", "city", "state", "pincode", "phone", "email", "website", "logo"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) hospital[field] = req.body[field];
  });
  await hospital.save();

  return sendSuccess(res, { message: "Hospital updated successfully", data: hospital });
});

/**
 * DELETE is intentionally NOT exposed for Hospital - deactivating via
 * status ('inactive') is the safe equivalent (Section 33: medical/org
 * records are not hard-deleted).
 */
const deactivateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) throw ApiError.notFound("Hospital not found");
  if (String(req.user.hospitalId) !== String(hospital._id)) {
    throw ApiError.forbidden("You can only manage your own hospital");
  }
  hospital.status = "inactive";
  await hospital.save();
  return sendSuccess(res, { message: "Hospital deactivated successfully", data: hospital });
});

module.exports = {
  registerHospital,
  listHospitals,
  getHospital,
  updateHospital,
  deactivateHospital,
};
