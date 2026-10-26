/**
 * Standard application error. Controllers/services throw this for any
 * expected failure (validation, not found, forbidden, conflict, etc.)
 * so errorMiddleware can turn it into a consistent API response with the
 * correct HTTP status code, instead of leaking raw Mongoose/Mongo errors.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isApiError = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) {
    return new ApiError(400, message);
  }
  static unauthorized(message = "Not authenticated") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Not authorized to perform this action") {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }
  static conflict(message) {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;
