const Task = require("../models/Task");

const taskRepo = {
  // Lấy task cá nhân
  findPersonalTasks: (userId) =>
    Task.find({ createdBy: userId, type: "personal" })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 }),

  // Lấy task nhóm
  findGroupTasks: (groupId) =>
    Task.find({ group: groupId, type: "group" })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 }),

  // Lấy task được giao cho user trong nhóm
  findAssignedTasks: (userId) =>
    Task.find({ assignedTo: userId })
      .populate("createdBy", "name email")
      .populate("group", "name")
      .sort({ createdAt: -1 }),

  // Lấy tất cả task liên quan đến user (cá nhân + được giao + thuộc nhóm)
  findMyAllTasks: (userId, groupIds) =>
    Task.find({
      $or: [
        { createdBy: userId },
        { assignedTo: userId },
        { group: { $in: groupIds } }
      ]
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("group", "name")
      .sort({ createdAt: -1 }),

  findById: (id) =>
    Task.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("group", "name"),

  create: (data) => Task.create(data),

  updateById: (id, data) =>
    Task.findByIdAndUpdate(id, data, { new: true })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email"),

  deleteById: (id) => Task.findByIdAndDelete(id),

  // Admin: lấy tất cả task
  findAll: () =>
    Task.find()
      .populate("createdBy", "name email")
      .populate("group", "name")
      .sort({ createdAt: -1 }),
};

module.exports = taskRepo;
