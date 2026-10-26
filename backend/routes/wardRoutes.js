const express = require("express");
const router = express.Router();
const { createWard, listWards, getWard, updateWard } = require("../controllers/wardController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/", roleMiddleware("ADMIN"), createWard);
router.get("/", listWards);
router.get("/:id", getWard);
router.put("/:id", roleMiddleware("ADMIN"), updateWard);
router.patch("/:id", roleMiddleware("ADMIN"), updateWard);

module.exports = router;
