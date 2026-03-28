const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../utils/authMiddleware");
const userRepo = require("../repositories/userRepo");
const taskRepo = require("../repositories/taskRepo");
const groupRepo = require("../repositories/groupRepo");

// Tất cả route admin cần đăng nhập + quyền admin
router.use(protect, adminOnly);

// Quản lý Users
router.get("/users", async (req, res) => {
  try {
    const users = await userRepo.findAll();
    res.json({ success: true, data: users });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await userRepo.deleteById(req.params.id);
    res.json({ success: true, message: "Đã xóa người dùng" });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Đổi role user
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const user = await userRepo.updateById(req.params.id, { role });
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Xem tất cả Tasks
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await taskRepo.findAll();
    res.json({ success: true, data: tasks });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Xem tất cả Groups
router.get("/groups", async (req, res) => {
  try {
    const groups = await groupRepo.findAll();
    res.json({ success: true, data: groups });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Thống kê tổng quan
router.get("/stats", async (req, res) => {
  try {
    const [users, tasks, groups] = await Promise.all([
      userRepo.findAll(),
      taskRepo.findAll(),
      groupRepo.findAll(),
    ]);
    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        totalTasks: tasks.length,
        doneTasks: tasks.filter((t) => t.status === "done").length,
        totalGroups: groups.length,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
