const express = require("express");
const router = express.Router();
const {
  registerHospital,
  listHospitals,
  getHospital,
  updateHospital,
  deactivateHospital,
} = require("../controllers/hospitalController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/register", registerHospital); // PUBLIC
router.get("/", listHospitals); // PUBLIC (find-your-hospital search)
router.get("/:id", getHospital); // PUBLIC (basic detail during onboarding)
router.put("/:id", protect, roleMiddleware("ADMIN"), updateHospital);
router.patch("/:id", protect, roleMiddleware("ADMIN"), updateHospital);
router.delete("/:id", protect, roleMiddleware("ADMIN"), deactivateHospital); // soft delete only

module.exports = router;
