const express = require("express");
const router = express.Router();
const { registerNurse, listNurses, getNurse, getMyProfile, updateNurse } = require("../controllers/nurseController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// SECURITY (Phase 3.1): nurse accounts are privileged and must be
// created by an authorized ADMIN of the target hospital, not anonymously.
router.post("/", protect, roleMiddleware("ADMIN"), registerNurse);

router.get("/", protect, listNurses);
router.get("/me", protect, roleMiddleware("NURSE"), getMyProfile); // PHASE 3 ADDITION
router.get("/:id", protect, getNurse);
router.put("/:id", protect, roleMiddleware("NURSE", "ADMIN"), updateNurse);
router.patch("/:id", protect, roleMiddleware("NURSE", "ADMIN"), updateNurse);

module.exports = router;
