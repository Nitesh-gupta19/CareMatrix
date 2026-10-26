const express = require("express");
const router = express.Router();
const {
  registerDoctor,
  addAffiliation,
  listDoctors,
  getDoctor,
  getMyProfile,
  updateDoctor,
} = require("../controllers/doctorController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// SECURITY (Phase 3.1): doctor accounts are privileged and must be
// created by an authorized ADMIN of the target hospital, not anonymously.
router.post("/", protect, roleMiddleware("ADMIN"), registerDoctor);

router.get("/", protect, listDoctors);
// IMPORTANT: /me must be registered BEFORE /:id, or Express would match
// "me" as an :id parameter and route it into getDoctor instead.
router.get("/me", protect, roleMiddleware("DOCTOR"), getMyProfile); // PHASE 3 ADDITION
router.get("/:id", protect, getDoctor);
router.put("/:id", protect, roleMiddleware("DOCTOR", "ADMIN"), updateDoctor);
router.patch("/:id", protect, roleMiddleware("DOCTOR", "ADMIN"), updateDoctor);
router.post("/:id/affiliations", protect, roleMiddleware("DOCTOR", "ADMIN"), addAffiliation);

module.exports = router;
