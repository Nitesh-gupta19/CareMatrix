const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

/**
 * Reads the Authorization header, verifies the JWT, loads the referenced
 * User, and attaches it to req.user. Never trusts a userId/role sent
 * directly by the client in the request body - only what's inside a
 * validly-signed token counts.
 */
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("No authentication token provided");
  }

  const token = header.slice("Bearer ".length).trim();

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Session expired, please log in again");
    }
    throw ApiError.unauthorized("Invalid authentication token");
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw ApiError.unauthorized("The user for this token no longer exists");
  }
  if (user.status !== "active") {
    throw ApiError.forbidden("This account is not active");
  }

  req.user = user; // full Mongoose doc, password already excluded by `select: false`
  next();
});

/**
 * Like `protect`, but does not reject the request if no/invalid token is
 * present - it just leaves req.user undefined. Used only for the relative
 * access-request endpoint, which is reachable both by a brand-new visitor
 * (no token yet) and an already-logged-in relative adding a second
 * patient link.
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();

  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (user && user.status === "active") req.user = user;
  } catch (_err) {
    // invalid/expired token on an optional-auth route: proceed unauthenticated
  }
  next();
});

module.exports = { protect, optionalAuth };
