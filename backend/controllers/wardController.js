const Ward = require("../models/Ward");
const Hospital = require("../models/Hospital");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

function assertOwnHospital(req, hospitalId) {
  if (String(req.user.hospitalId) !== String(hospitalId)) {
    throw ApiError.forbidden("You can only manage wards within your own hospital");
  }
}

const createWard = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, name, type, floor } = req.body;
  if (!hospitalId || !name) throw ApiError.badRequest("hospitalId and name are required");
  assertOwnHospital(req, hospitalId);

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) throw ApiError.badRequest("hospitalId does not reference an existing hospital");

  const ward = await Ward.create({ hospitalId, departmentId, name, type, floor });
  return sendSuccess(res, { statusCode: 201, message: "Ward created successfully", data: ward });
});

const listWards = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, page = 1, limit = 20 } = req.query;
  if (!hospitalId) throw ApiError.badRequest("hospitalId query parameter is required");

  // SECURITY: previously any authenticated user could list any hospital's
  // wards by supplying its hospitalId with no ownership check.
  await scopeService.assertUserCanAccessHospital(req.user, hospitalId);

  const filter = { hospitalId };
  if (departmentId) filter.departmentId = departmentId;

  const skip = (Number(page) - 1) * Number(limit);
  const [wards, total] = await Promise.all([
    Ward.find(filter).skip(skip).limit(Number(limit)),
    Ward.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Wards retrieved successfully",
    data: wards,
    pagination: buildPagination({ page, limit, total }),
  });
});

const getWard = asyncHandler(async (req, res) => {
  const ward = await Ward.findById(req.params.id);
  if (!ward) throw ApiError.notFound("Ward not found");

  // SECURITY: previously any authenticated user of any role could view
  // any hospital's ward by ID with no ownership check at all.
  await scopeService.assertUserCanAccessHospital(req.user, ward.hospitalId);

  return sendSuccess(res, { message: "Ward retrieved successfully", data: ward });
});

const updateWard = asyncHandler(async (req, res) => {
  const ward = await Ward.findById(req.params.id);
  if (!ward) throw ApiError.notFound("Ward not found");
  assertOwnHospital(req, ward.hospitalId);

  const editable = ["name", "type", "floor", "status", "departmentId"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) ward[field] = req.body[field];
  });
  await ward.save();

  return sendSuccess(res, { message: "Ward updated successfully", data: ward });
});

module.exports = { createWard, listWards, getWard, updateWard };
