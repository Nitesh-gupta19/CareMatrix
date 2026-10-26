const express = require("express");
const router = express.Router();
const {
  requestAccess,
  listRelativeLinks,
  getRelativeLink,
  updateAccessStatus,
} = require("../controllers/relativeController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", optionalAuth, requestAccess); // reachable unauthenticated OR by an existing relative
router.get("/", protect, listRelativeLinks);
router.get("/:id", protect, getRelativeLink);
router.patch("/:id", protect, roleMiddleware("ADMIN"), updateAccessStatus);

module.exports = router;
