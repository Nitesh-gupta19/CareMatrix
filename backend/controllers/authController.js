const User = require("../models/User");
const Patient = require("../models/Patient");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * POST /api/auth/register
 *
 * SECURITY: this is the one endpoint a fully anonymous client can call to
 * create an account with a role of their choosing in the request body -
 * so it must never honor an arbitrary `role`. Only RELATIVE is a safe
 * self-service role here: ADMIN comes only from hospital registration
 * (which creates the hospital in the same transaction), DOCTOR/NURSE
 * come only from their onboarding endpoints (which require a real
 * hospital+department and create the profile atomically), and PATIENT
 * records are created by hospital staff during intake, never by open
 * self-registration. A request with role=ADMIN (or anything else) here
 * is rejected outright, regardless of what the client sends.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, patientId, dateOfBirth } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest("name, email and password are required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters");
  }
  const requestedRole = role || "RELATIVE";
  if (!["PATIENT", "RELATIVE"].includes(requestedRole)) {
    throw ApiError.forbidden("Public registration is only available for patients and relatives");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.findOne({ email: normalizedEmail })) {
    throw ApiError.conflict("An account with this email already exists");
  }

  let patient = null;
  if (requestedRole === "PATIENT") {
    if (!patientId || !dateOfBirth) {
      throw ApiError.badRequest("Patient ID and date of birth are required to link your patient record");
    }
    const suppliedDate = new Date(dateOfBirth);
    if (Number.isNaN(suppliedDate.getTime())) {
      throw ApiError.badRequest("Please provide a valid date of birth");
    }
    patient = await Patient.findOne({
      patientId: String(patientId).trim().toUpperCase(),
      dateOfBirth: { $gte: new Date(suppliedDate.toISOString().slice(0, 10)), $lt: new Date(new Date(suppliedDate.toISOString().slice(0, 10)).getTime() + 86400000) },
      userId: null,
    });
    if (!patient) {
      throw ApiError.badRequest("We could not verify that Patient ID and date of birth, or the patient account is already linked. Please contact hospital staff.");
    }
  }

  const user = await User.create({ name, email: normalizedEmail, password, role: requestedRole, phone });
  if (requestedRole === "PATIENT") {
    // Atomic linking prevents two accounts from claiming the same patient record.
    const linked = await Patient.findOneAndUpdate(
      { _id: patient._id, userId: null },
      { $set: { userId: user._id } },
      { new: true }
    );
    if (!linked) {
      await User.deleteOne({ _id: user._id });
      throw ApiError.conflict("This patient record has already been linked to an account. Please contact hospital staff.");
    }
  }

  const token = generateToken({ userId: user._id, role: user.role });
  return sendSuccess(res, {
    statusCode: 201,
    message: "Account created successfully",
    data: { token, user },
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw ApiError.badRequest("email and password are required");
  }

  // password has `select: false` in the schema, so it must be explicitly
  // requested here in order to compare it.
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.status !== "active") {
    throw ApiError.forbidden(`This account is ${user.status}. Contact your administrator.`);
  }

  const token = generateToken({ userId: user._id, role: user.role });
  user.password = undefined;

  return sendSuccess(res, {
    message: "Login successful",
    data: { token, user },
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (from the verified token).
 */
const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "Current user retrieved",
    data: req.user,
  });
});

module.exports = { register, login, me };
