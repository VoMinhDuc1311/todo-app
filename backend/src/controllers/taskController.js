const taskService = require("../services/taskService");

const taskController = {
  // CREATE PERSONAL
  createPersonal: async (req, res) => {
    try {
      const task = await taskService.createPersonal(req.user._id, req.body);
      res.status(201).json({ success: true, data: task });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // CREATE GROUP TASK
  createGroupTask: async (req, res) => {
    try {
      const task = await taskService.createGroupTask(
        req.user._id,
        req.params.groupId,
        req.body
      );
      res.status(201).json({ success: true, data: task });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // 🔥 FIX: có query filter + search
  getMyTasks: async (req, res) => {
    try {
      const tasks = await taskService.getMyTasks(
        req.user._id,
        req.query
      );
      res.json({ success: true, data: tasks });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // GROUP TASK
  getGroupTasks: async (req, res) => {
    try {
      const tasks = await taskService.getGroupTasks(
        req.user._id,
        req.params.groupId
      );
      res.json({ success: true, data: tasks });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // UPDATE
  update: async (req, res) => {
    try {
      const task = await taskService.update(
        req.user._id,
        req.params.id,
        req.body
      );
      res.json({ success: true, data: task });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // TOGGLE
  toggleDone: async (req, res) => {
    try {
      const task = await taskService.toggleDone(
        req.user._id,
        req.params.id
      );
      res.json({ success: true, data: task });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // DELETE
  delete: async (req, res) => {
    try {
      await taskService.delete(req.user._id, req.params.id);
      res.json({ success: true, message: "Đã xóa task" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // ASSIGN
  assignTask: async (req, res) => {
    try {
      const task = await taskService.assignTask(
        req.user._id,
        req.params.id,
        req.body.assignedTo
      );
      res.json({ success: true, data: task });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // UPDATE STATUS FOR DND KANBAN
  updateStatus: async (req, res) => {
    try {
      const task = await taskService.updateStatus(
        req.user._id,
        req.params.id,
        req.body.status
      );
      res.json({ success: true, data: task });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};

module.exports = taskController;