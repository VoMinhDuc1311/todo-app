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

    const memberRecord = group.members.find(
      (m) => m.user && m.user._id.toString() === userId.toString()
    );
    const isLeader = group.owner._id.toString() === userId.toString() || memberRecord?.role === "leader" || memberRecord?.role === "admin";

    if (isLeader) {
      return taskRepo.findGroupTasks(groupId);
    } else {
      return taskRepo.findGroupTasksForMember(groupId, userId);
    }
  },

  // ⭐ FINAL VERSION
  getMyTasks: async (userId) => {
    const userGroups = await groupRepo.findByMember(userId);
    
    // Mảng chỉ chứa các Group ID mà user làm cấu trúc LEADER
    const leaderGroupIds = userGroups.filter((g) => {
       const mId = g.owner._id ? g.owner._id.toString() : g.owner.toString();
       if (mId === userId.toString()) return true;
       const record = g.members.find(mem => mem.user && mem.user._id.toString() === userId.toString());
       return record?.role === "leader" || record?.role === "admin";
    }).map((g) => g._id);

    const allTasks = await taskRepo.findMyAllTasks(userId, leaderGroupIds);

    return allTasks.map((t) => ({
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

    if (data.status === "done" && task.status !== "done" && task.type === "group" && task.group) {
      const group = await groupRepo.findById(task.group._id);
      if (group) {
         const leaders = [];
         if (group.owner) leaders.push(group.owner._id ? group.owner._id.toString() : group.owner.toString());
         group.members.forEach(m => {
            if (m.role === "leader" || m.role === "admin") {
               const uid = m.user ? (m.user._id ? m.user._id.toString() : m.user.toString()) : null;
               if (uid && !leaders.includes(uid)) leaders.push(uid);
            }
         });
         const notifyList = leaders.filter(id => id !== userId.toString());
         for (const lId of notifyList) {
            await Notification.create({
               user: lId,
               message: `✅ Task "${task.title}" (Nhóm: ${group.name}) đã được chuyển thành Hoàn thành!`,
            });
         }
      }
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

    if (newStatus === "done" && task.type === "group" && task.group) {
      const group = await groupRepo.findById(task.group._id);
      if (group) {
         const leaders = [];
         if (group.owner) leaders.push(group.owner._id ? group.owner._id.toString() : group.owner.toString());
         group.members.forEach(m => {
            if (m.role === "leader" || m.role === "admin") {
               const uid = m.user ? (m.user._id ? m.user._id.toString() : m.user.toString()) : null;
               if (uid && !leaders.includes(uid)) leaders.push(uid);
            }
         });
         const notifyList = leaders.filter(id => id !== userId.toString());
         for (const lId of notifyList) {
            await Notification.create({
               user: lId,
               message: `✅ Task "${task.title}" (Nhóm: ${group.name}) vừa được đánh dấu Hoàn thành!`,
            });
         }
      }
    }

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