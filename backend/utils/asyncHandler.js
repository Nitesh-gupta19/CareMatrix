/**
 * Wraps an async controller function so any thrown/rejected error is
 * forwarded to Express's error-handling middleware instead of requiring
 * a try/catch block in every single controller.
 *
 * Usage:
 *   exports.getPatients = asyncHandler(async (req, res) => { ... });
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
