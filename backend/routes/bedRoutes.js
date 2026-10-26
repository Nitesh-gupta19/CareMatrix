const express = require("express");
const router = express.Router();
const { createBed, listBeds, getBed, updateBedStatus } = require("../controllers/bedController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/", roleMiddleware("ADMIN"), createBed);
router.get("/", listBeds);
router.get("/:id", getBed);
router.patch("/:id", roleMiddleware("ADMIN"), updateBedStatus);

module.exports = router;
