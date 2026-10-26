const jwt = require("jsonwebtoken");

/**
 * Signs a JWT containing only what authorization needs: the user's id and
 * role. Never embed the password hash or other sensitive fields here -
 * the token is decodable (not just verifiable) by anyone holding it.
 */
function generateToken({ userId, role }) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in the environment.");
  }
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

module.exports = generateToken;
