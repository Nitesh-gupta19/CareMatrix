const express = require("express");
const router = express.Router();
const { createTask, listTasks, getTask, updateTaskStatus } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/", roleMiddleware("DOCTOR"), createTask);
router.get("/", listTasks);
router.get("/:id", getTask);
router.patch("/:id/status", roleMiddleware("NURSE", "DOCTOR"), updateTaskStatus);

module.exports = router;
