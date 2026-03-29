const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../utils/authMiddleware");

// Tất cả route đều cần đăng nhập
router.use(protect);

// Task cá nhân
router.post("/personal", taskController.createPersonal);
router.get("/my", taskController.getMyTasks);

// Task nhóm
router.post("/group/:groupId", taskController.createGroupTask);
router.get("/group/:groupId", taskController.getGroupTasks);

// Thao tác theo id
router.put("/:id", taskController.update);
router.patch("/:id/toggle", taskController.toggleDone);
router.patch("/:id/status", taskController.updateStatus);
router.patch("/:id/assign", taskController.assignTask);
router.delete("/:id", taskController.delete);

module.exports = router;
