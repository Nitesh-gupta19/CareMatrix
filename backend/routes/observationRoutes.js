const express = require("express");
const router = express.Router();
const { createObservation, listObservations } = require("../controllers/observationController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/", roleMiddleware("NURSE"), createObservation);
router.get("/", listObservations);
// No PATCH/DELETE - observations are append-only clinical records (Section 33).

module.exports = router;
