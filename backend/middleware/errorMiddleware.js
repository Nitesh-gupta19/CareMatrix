/**
 * 404 handler for unmatched routes - must be mounted AFTER all real routes.
 */
function notFound(req, _res, next) {
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Every thrown error - whether an intentional
 * ApiError, a Mongoose ValidationError, a duplicate-key error, a CastError
 * (bad ObjectId), or anything unexpected - funnels through here and comes
 * out as the same { success, message, error } shape. Raw stack traces are
 * never sent to the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose validation error (required fields, enum mismatches, etc.)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
  }

  // Invalid ObjectId passed to a query (e.g. GET /api/patients/not-an-id)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}: ${err.value}`;
  }

  // Duplicate key (unique index violation) - e.g. duplicate email,
  // registrationNumber, doctorCode, licenseNumber, patientId, etc.
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists`;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "production" ? undefined : err.name,
  });
}

module.exports = { notFound, errorHandler };
