const express = require("express");
const router = express.Router();
const {
  createAdmission,
  listAdmissions,
  getAdmission,
  updateAdmission,
  dischargeAdmission,
  transferAdmission,
} = require("../controllers/admissionController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(protect); // every admission route requires authentication

router.post("/", roleMiddleware("ADMIN", "DOCTOR"), createAdmission);
router.get("/", listAdmissions);
router.get("/:id", getAdmission);
router.put("/:id", roleMiddleware("ADMIN", "DOCTOR"), updateAdmission);
router.patch("/:id", roleMiddleware("ADMIN", "DOCTOR"), updateAdmission);
router.post("/:id/discharge", roleMiddleware("ADMIN", "DOCTOR"), dischargeAdmission);
router.patch("/:id/transfer", roleMiddleware("ADMIN", "DOCTOR"), transferAdmission);

module.exports = router;
