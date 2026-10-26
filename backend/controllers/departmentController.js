const Department = require("../models/Department");
const Hospital = require("../models/Hospital");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess, buildPagination } = require("../utils/apiResponse");
const scopeService = require("../services/scopeService");

/** Admin can only manage departments of their own hospital. */
function assertOwnHospital(req, hospitalId) {
  if (String(req.user.hospitalId) !== String(hospitalId)) {
    throw ApiError.forbidden("You can only manage departments within your own hospital");
  }
}

const createDepartment = asyncHandler(async (req, res) => {
  const { hospitalId, name, code, description, floor, phone } = req.body;
  if (!hospitalId || !name) throw ApiError.badRequest("hospitalId and name are required");

  assertOwnHospital(req, hospitalId);

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) throw ApiError.badRequest("hospitalId does not reference an existing hospital");

  const department = await Department.create({ hospitalId, name, code, description, floor, phone });
  return sendSuccess(res, { statusCode: 201, message: "Department created successfully", data: department });
});

/**
 * GET /api/departments?hospitalId=... (auth required)
 *
 * SECURITY (Phase 3.1): this was PUBLIC, originally to support a
 * prospective doctor/nurse browsing a hospital's departments before
 * having an account. That flow no longer exists - doctor/nurse creation
 * is now ADMIN-only (see doctorController/nurseController) - so there is
 * no remaining legitimate reason for anyone to browse another hospital's
 * department list without being staff there.
 */
const listDepartments = asyncHandler(async (req, res) => {
  const { hospitalId, status, page = 1, limit = 20 } = req.query;
  if (!hospitalId) throw ApiError.badRequest("hospitalId query parameter is required");

  await scopeService.assertUserCanAccessHospital(req.user, hospitalId);

  const filter = { hospitalId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [departments, total] = await Promise.all([
    Department.find(filter).skip(skip).limit(Number(limit)),
    Department.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Departments retrieved successfully",
    data: departments,
    pagination: buildPagination({ page, limit, total }),
  });
});

const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound("Department not found");

  // SECURITY (Phase 3.1): previously public/unscoped - any user (or no
  // user at all) could view any hospital's department by ID.
  await scopeService.assertUserCanAccessHospital(req.user, department.hospitalId);

  return sendSuccess(res, { message: "Department retrieved successfully", data: department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound("Department not found");
  assertOwnHospital(req, department.hospitalId);

  const editable = ["name", "code", "description", "floor", "phone", "status"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) department[field] = req.body[field];
  });
  await department.save();

  return sendSuccess(res, { message: "Department updated successfully", data: department });
});

module.exports = { createDepartment, listDepartments, getDepartment, updateDepartment };
