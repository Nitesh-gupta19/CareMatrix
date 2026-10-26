const express = require("express");
const router = express.Router();
const {
  createPatient,
  lookupPatientForAccess,
  listPatients,
  getPatient,
  getMyProfile,
  updatePatient,
} = require("../controllers/patientController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/lookup/:patientId", lookupPatientForAccess); // PUBLIC - Patient Access flow

router.post("/", protect, roleMiddleware("ADMIN", "DOCTOR"), createPatient);
router.get("/", protect, listPatients);
router.get("/me", protect, roleMiddleware("PATIENT"), getMyProfile); // PHASE 3 ADDITION
router.get("/:id", protect, getPatient);
router.put("/:id", protect, updatePatient);
router.patch("/:id", protect, updatePatient);

module.exports = router;
