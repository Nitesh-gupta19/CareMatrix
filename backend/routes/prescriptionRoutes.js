const express = require("express");
const router = express.Router();
const {
  createPrescription,
  listPrescriptions,
  getPrescription,
  updatePrescription,
} = require("../controllers/prescriptionController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/", roleMiddleware("DOCTOR"), createPrescription);
router.get("/", listPrescriptions);
router.get("/:id", getPrescription);
router.put("/:id", roleMiddleware("DOCTOR"), updatePrescription);
router.patch("/:id", roleMiddleware("DOCTOR"), updatePrescription);

module.exports = router;
