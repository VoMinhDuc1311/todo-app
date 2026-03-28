const taskRepo = require("../repositories/taskRepo");
const groupRepo = require("../repositories/groupRepo");
const Notification = require("../models/Notification");

const taskService = {
  createPersonal: async (userId, data) => {
    return taskRepo.create({
      ...data,
      createdBy: userId,
      type: "personal",
    });
  },

  createGroupTask: async (userId, groupId, data) => {
    const group = await groupRepo.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    const member = group.members.find(
      (m) => m.user && m.user._id.toString() === userId.toString()
    );

    if (!member) throw new Error("Bạn không phải thành viên");
    if (member.role !== "leader")
      throw new Error("Chỉ leader mới được tạo task");

    return taskRepo.create({
      ...data,
      createdBy: userId,
      type: "group",
      group: groupId,
    });
  },

  getGroupTasks: async (userId, groupId) => {
    // Kiểm tra user có thuộc nhóm không
    const group = await groupRepo.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    const isMember = group.members.some(
      (m) => m.user && m.user._id.toString() === userId.toString()
    );
    if (!isMember) throw new Error("Bạn không phải thành viên nhóm");

    return taskRepo.findGroupTasks(groupId);
  },

  // ⭐ FINAL VERSION
  getMyTasks: async (userId) => {
    const personal = await taskRepo.findPersonalTasks(userId);
    const assigned = await taskRepo.findAssignedTasks(userId);

    const map = new Map();
    [...personal, ...assigned].forEach((t) =>
      map.set(t._id.toString(), t)
    );

    return Array.from(map.values()).map((t) => ({
      ...t._doc,
      isOverdue:
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "done",
    }));
  },

  update: async (userId, taskId, data) => {
    const task = await taskRepo.findById(taskId);
    if (!task) throw new Error("Task không tồn tại");

    if (task.createdBy._id.toString() !== userId.toString()) {
      throw new Error("Không có quyền");
    }

    return taskRepo.updateById(taskId, data);
  },

  // 🔥 WORKFLOW JIRA
  toggleDone: async (userId, taskId) => {
    const task = await taskRepo.findById(taskId);

    const isOwner = task.createdBy._id.toString() === userId.toString();
    const isAssigned = task.assignedTo.some(
      (u) => u._id.toString() === userId.toString()
    );

    if (!isOwner && !isAssigned) throw new Error("Không có quyền");

    let newStatus;
    if (task.status === "todo") newStatus = "in_progress";
    else if (task.status === "in_progress") newStatus = "done";
    else newStatus = "todo";

    return taskRepo.updateById(taskId, { status: newStatus });
  },

  delete: async (userId, taskId) => {
    const task = await taskRepo.findById(taskId);

    if (task.createdBy._id.toString() !== userId.toString()) {
      throw new Error("Không có quyền");
    }

    return taskRepo.deleteById(taskId);
  },

  assignTask: async (userId, taskId, assignedTo) => {
    const task = await taskRepo.findById(taskId);

    const group = await groupRepo.findById(task.group);

    const valid = group.members.some(
      (m) => m.user._id.toString() === assignedTo
    );

    if (!valid) throw new Error("User không thuộc group");

    const updated = await taskRepo.updateById(taskId, {
      $addToSet: { assignedTo },
    });

    await Notification.create({
      user: assignedTo,
      message: `📌 Bạn được giao task: "${task.title}"`,
    });

    return updated;
  },
};

module.exports = taskService;