/**
 * Small helpers to keep every controller returning the exact same
 * response shape, as required by Section 46 of the spec.
 */

function sendSuccess(res, { statusCode = 200, message = "Success", data = null, pagination = null }) {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

function buildPagination({ page = 1, limit = 20, total = 0 }) {
  page = Number(page) || 1;
  limit = Number(limit) || 20;
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = { sendSuccess, buildPagination };
