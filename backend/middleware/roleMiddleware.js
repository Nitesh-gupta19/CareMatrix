const ApiError = require("../utils/ApiError");

/**
 * Usage: router.post('/', protect, roleMiddleware('ADMIN', 'DOCTOR'), handler)
 * Must run AFTER authMiddleware.protect, which sets req.user.
 * This is the real security boundary - the frontend hiding a button is
 * only ever a UX convenience, never a substitute for this check.
 */
function roleMiddleware(...allowedRoles) {
  return function (req, _res, next) {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not authorized for this action`)
      );
    }
    next();
  };
}

module.exports = roleMiddleware;
