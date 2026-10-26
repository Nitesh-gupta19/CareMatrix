const PatientRelative = require("../models/PatientRelative");
const Patient = require("../models/Patient");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

/**
 * POST /api/relatives  (PUBLIC)
 * Relative Access flow (Section 23 of Phase 1 journey): creates the
 * relative's User account (if new) plus a `pending` PatientRelative
 * request. The relative gets a token immediately so they can see a
 * "pending authorization" state, but every relative-facing endpoint
 * still requires accessStatus: 'approved' before returning patient data.
 */
const requestAccess = asyncHandler(async (req, res) => {
  const { name, email, password, phone, patientId, relationship } = req.body;
  if (!patientId || !relationship) {
    throw ApiError.badRequest("patientId and relationship are required");
  }

  const patient = await Patient.findOne({ patientId: String(patientId).toUpperCase() });
  if (!patient) throw ApiError.badRequest("patientId does not reference an existing patient");

  let user = req.user; // if already authenticated as a relative, reuse the session
  if (!user) {
    if (!name || !email || !password) {
      throw ApiError.badRequest("name, email and password are required for a new relative account");
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict("An account with this email already exists");
    user = await User.create({ name, email, password, phone, role: "RELATIVE" });
  } else if (user.role !== "RELATIVE") {
    throw ApiError.forbidden("Only a relative account can request patient access");
  }

  const existingLink = await PatientRelative.findOne({ patientId: patient._id, relativeUserId: user._id });
  if (existingLink) {
    throw ApiError.conflict("An access request for this patient already exists");
  }

  const link = await PatientRelative.create({
    patientId: patient._id,
    relativeUserId: user._id,
    relationship,
    accessStatus: "pending",
  });

  const token = generateToken({ userId: user._id, role: user.role });
  return sendSuccess(res, {
    statusCode: 201,
    message: "Access request submitted - awaiting hospital approval",
    data: { user, link, token },
  });
});

/**
 * GET /api/relatives
 *   RELATIVE -> their own links (unchanged)
 *   ADMIN + ?patientId= -> that patient's links, scoped to admin's hospital (unchanged)
 *   ADMIN, no patientId -> PHASE 3 REBUILD ADDITION: every relative-access
 *     request for any patient who has history at this admin's hospital -
 *     this is what actually powers a real "pending/approved/revoked
 *     requests" management screen (Section 10 requires this explicitly;
 *     the original Phase 2 design only supported looking up one known
 *     patient's links at a time, which isn't enough to build that screen).
 */
const listRelativeLinks = asyncHandler(async (req, res) => {
  if (req.user.role === "RELATIVE") {
    // A relative can see their own links across all patients.
    const links = await PatientRelative.find({ relativeUserId: req.user._id }).populate(
      "patientId",
      "patientId name"
    );
    return sendSuccess(res, { message: "Your access requests retrieved successfully", data: links });
  }

  if (req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Only hospital admin can view relative access requests");
  }
  const { patientId, accessStatus, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  let filter;
  if (patientId) {
    await scopeService.assertPatientHasHistoryAtHospital(patientId, req.user.hospitalId);
    filter = { patientId };
  } else {
    const Admission = require("../models/Admission");
    const patientIds = await Admission.find({ hospitalId: req.user.hospitalId }).distinct("patientId");
    filter = { patientId: { $in: patientIds } };
  }
  if (accessStatus) filter.accessStatus = accessStatus;

  const [links, total] = await Promise.all([
    PatientRelative.find(filter)
      .populate("relativeUserId", "name email phone")
      .populate("patientId", "patientId name")
      .skip(skip)
      .limit(Number(limit)),
    PatientRelative.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Relative access requests retrieved successfully",
    data: links,
    pagination: buildPagination({ page, limit, total }),
  });
});

const getRelativeLink = asyncHandler(async (req, res) => {
  const link = await PatientRelative.findById(req.params.id).populate("patientId", "patientId name");
  if (!link) throw ApiError.notFound("Access request not found");

  // SECURITY: previously any authenticated role (including an unrelated
  // DOCTOR/NURSE/PATIENT) could read any access request by guessing its
  // ID. Only the relative it belongs to, or an ADMIN whose hospital the
  // patient actually has history at, may view it - everyone else denied.
  if (req.user.role === "RELATIVE") {
    if (String(link.relativeUserId) !== String(req.user._id)) {
      throw ApiError.forbidden("You can only view your own access requests");
    }
  } else if (req.user.role === "ADMIN") {
    const patientId = link.patientId?._id || link.patientId;
    await scopeService.assertPatientHasHistoryAtHospital(patientId, req.user.hospitalId);
  } else {
    throw ApiError.forbidden("You are not authorized to view this access request");
  }

  return sendSuccess(res, { message: "Access request retrieved successfully", data: link });
});

/** PATCH /api/relatives/:id  (ADMIN approves/revokes access, own hospital's patients only) */
const updateAccessStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Only hospital admin can approve or revoke relative access");
  }
  const { accessStatus, isPrimaryContact } = req.body;
  if (accessStatus && !["pending", "approved", "revoked"].includes(accessStatus)) {
    throw ApiError.badRequest("Invalid accessStatus value");
  }

  const link = await PatientRelative.findById(req.params.id);
  if (!link) throw ApiError.notFound("Access request not found");

  // SECURITY: previously ANY admin (from any hospital) could approve or
  // revoke ANY relative's access to ANY patient. This is the most severe
  // gap found in this audit - it directly controls who can see private
  // medical data. Verify the patient has history at this admin's hospital
  // before allowing the mutation.
  await scopeService.assertPatientHasHistoryAtHospital(link.patientId, req.user.hospitalId);

  if (accessStatus) link.accessStatus = accessStatus;
  if (isPrimaryContact !== undefined) link.isPrimaryContact = isPrimaryContact;
  await link.save();

  return sendSuccess(res, { message: "Access request updated successfully", data: link });
});

module.exports = { requestAccess, listRelativeLinks, getRelativeLink, updateAccessStatus };
