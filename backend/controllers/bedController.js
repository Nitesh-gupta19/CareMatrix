const Bed = require("../models/Bed");
const Ward = require("../models/Ward");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

async function assertOwnHospitalViaWard(req, wardId) {
  const ward = await Ward.findById(wardId);
  if (!ward) throw ApiError.badRequest("wardId does not reference an existing ward");
  if (String(req.user.hospitalId) !== String(ward.hospitalId)) {
    throw ApiError.forbidden("You can only manage beds within your own hospital");
  }
  return ward;
}

const createBed = asyncHandler(async (req, res) => {
  const { wardId, bedNumber } = req.body;
  if (!wardId || !bedNumber) throw ApiError.badRequest("wardId and bedNumber are required");

  await assertOwnHospitalViaWard(req, wardId);

  const bed = await Bed.create({ wardId, bedNumber });
  return sendSuccess(res, { statusCode: 201, message: "Bed created successfully", data: bed });
});

/** GET /api/beds?wardId=&status=available */
const listBeds = asyncHandler(async (req, res) => {
  const { wardId, status, page = 1, limit = 50 } = req.query;
  if (!wardId) throw ApiError.badRequest("wardId query parameter is required");

  // SECURITY: previously any authenticated user could list any ward's
  // beds by supplying its wardId with no ownership check.
  const ward = await Ward.findById(wardId);
  if (!ward) throw ApiError.badRequest("wardId does not reference an existing ward");
  await scopeService.assertUserCanAccessHospital(req.user, ward.hospitalId);

  const filter = { wardId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [beds, total] = await Promise.all([
    Bed.find(filter).skip(skip).limit(Number(limit)),
    Bed.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Beds retrieved successfully",
    data: beds,
    pagination: buildPagination({ page, limit, total }),
  });
});

const getBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed) throw ApiError.notFound("Bed not found");

  // SECURITY: previously any authenticated user could view any bed by ID.
  const ward = await Ward.findById(bed.wardId);
  if (ward) await scopeService.assertUserCanAccessHospital(req.user, ward.hospitalId);

  return sendSuccess(res, { message: "Bed retrieved successfully", data: bed });
});

/**
 * PATCH /api/beds/:id  - status changes only (e.g. into/out of maintenance).
 * Occupied/available transitions caused by admission/discharge are NOT
 * made here - they go exclusively through admissionService, so this
 * endpoint intentionally refuses to set status directly to 'occupied'
 * (that would let staff mark a bed occupied without a real Admission
 * behind it, breaking the bed/admission consistency guarantee).
 */
const updateBedStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["available", "maintenance", "reserved"].includes(status)) {
    throw ApiError.badRequest(
      "status must be 'available', 'maintenance' or 'reserved' here - 'occupied' is only set by creating an admission"
    );
  }

  const bed = await Bed.findById(req.params.id);
  if (!bed) throw ApiError.notFound("Bed not found");
  await assertOwnHospitalViaWard(req, bed.wardId);

  if (bed.status === "occupied") {
    throw ApiError.conflict("Cannot change status of an occupied bed - discharge the patient first");
  }

  bed.status = status;
  await bed.save();

  return sendSuccess(res, { message: "Bed status updated successfully", data: bed });
});

module.exports = { createBed, listBeds, getBed, updateBedStatus };
