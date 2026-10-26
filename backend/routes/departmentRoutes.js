const express = require("express");
const router = express.Router();
const {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
} = require("../controllers/departmentController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// SECURITY (Phase 3.1): no longer public - doctor/nurse onboarding is now
// ADMIN-only, so there is no remaining pre-auth need to browse departments.
router.get("/", protect, listDepartments);
router.get("/:id", protect, getDepartment);

router.post("/", protect, roleMiddleware("ADMIN"), createDepartment);
router.put("/:id", protect, roleMiddleware("ADMIN"), updateDepartment);
router.patch("/:id", protect, roleMiddleware("ADMIN"), updateDepartment);

module.exports = router;
