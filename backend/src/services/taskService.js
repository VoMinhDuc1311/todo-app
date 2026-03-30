const mongoose = require("mongoose");
const taskRepo = require("../repositories/taskRepo");
const groupRepo = require("../repositories/groupRepo");
const Notification = require("../models/Notification");

const ensureCanReopen = (task, newStatus, userId, group) => {
    if (task.status === "done" && newStatus !== "done") {
        let canReopen = false;
        if (task.type === "group" && group) {
            if (group.owner && group.owner._id.toString() === userId.toString()) canReopen = true;
            const mr = group.members.find(m => m.user && m.user._id.toString() === userId.toString());
            if (mr && (mr.role === "leader" || mr.role === "admin")) canReopen = true;
        } else {
            if (task.createdBy && task.createdBy._id.toString() === userId.toString()) canReopen = true;
        }
        if (!canReopen) {
            throw new Error("Bạn không có quyền mở lại task đã hoàn thành. Vui lòng nhờ Leader!");
        }
    }
};

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

    const taskData = {
      ...data,
      createdBy: userId,
      group: groupId,
      type: "group",
    };

    const task = await taskRepo.create(taskData);

    // 🏆 FEATURE 2 (CREATE) - Non-blocking with Rich Metadata
    if (data.assignedTo && Array.isArray(data.assignedTo) && data.assignedTo.length > 0) {
      const groupName = group.name;
      const actor = await mongoose.model("User").findById(userId);
      const actorName = actor ? actor.name : "Hệ thống";
      
      data.assignedTo.forEach(uid => {
         if (uid === userId.toString()) return;
         Notification.create({
            user: uid,
            type: "task_assigned",
            taskTitle: data.title,
            groupName: groupName,
            actorName: actorName,
            taskId: task._id,
            groupId: group._id,
            message: `📌 Bạn vừa được ${actorName} phân công tác vụ mới: "${data.title}" (Nhóm: ${groupName}).`
         }).catch(err => console.error("Notification Error:", err));
      });
    }

    return task;
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

    if (data.status && data.status !== task.status) {
       let group = null;
       if (task.type === "group" && task.group) {
          group = await groupRepo.findById(task.group._id || task.group);
       }
       ensureCanReopen(task, data.status, userId, group);
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
         const actor = await mongoose.model("User").findById(userId);
         const actorName = actor ? actor.name : "Hệ thống";
         const notifyList = leaders.filter(id => id !== userId.toString());
         for (const lId of notifyList) {
            Notification.create({
               user: lId,
               type: "task_completed",
               taskTitle: task.title,
               groupName: group.name,
               actorName: actorName,
               taskId: task._id,
               groupId: group._id,
               message: `✅ Task "${task.title}" (Nhóm: ${group.name}) đã được chuyển thành Hoàn thành!`,
            }).catch(err => console.error("Notification Error:", err));
         }
      }
    }

    // 🏆 FEATURE 2: ASSIGN TASK NOTIFICATIONS (Diff Checker)
    if (data.assignedTo && Array.isArray(data.assignedTo)) {
      const existingAssignees = task.assignedTo.map(u => u._id ? u._id.toString() : u.toString());
      const newAssignees = data.assignedTo.filter(id => !existingAssignees.includes(id));
      
      if (newAssignees.length > 0) {
        let groupName = "Cá nhân";
        if (task.type === "group" && task.group) {
           const group = await groupRepo.findById(task.group._id || task.group);
           if (group) groupName = group.name;
        }
        const actor = await mongoose.model("User").findById(userId);
        const actorName = actor ? actor.name : "Hệ thống";
        for (const uid of newAssignees) {
           if (uid === userId.toString()) continue; // Skip self
           Notification.create({
              user: uid,
              type: "task_assigned",
              taskTitle: task.title,
              groupName: groupName,
              actorName: actorName,
              taskId: task._id,
              groupId: task.group?._id || task.group,
              message: `📌 Bạn vừa được phân công một tác vụ mới: "${task.title}" (Nhóm: ${groupName}). Hãy kiểm tra ngay!`
           }).catch(err => console.error("Notification Error:", err));
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

    let group = null;
    if (task.type === "group" && task.group) {
        group = await groupRepo.findById(task.group._id || task.group);
    }

    ensureCanReopen(task, newStatus, userId, group);

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
         const actor = await mongoose.model("User").findById(userId);
         const actorName = actor ? actor.name : "Hệ thống";
         const notifyList = leaders.filter(id => id !== userId.toString());
         for (const lId of notifyList) {
            Notification.create({
               user: lId,
               type: "task_completed",
               taskTitle: task.title,
               groupName: group.name,
               actorName: actorName,
               taskId: task._id,
               groupId: group._id,
               message: `✅ Task "${task.title}" (Nhóm: ${group.name}) vừa được đánh dấu Hoàn thành!`,
            }).catch(err => console.error("Notification Error:", err));
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

    Notification.create({
      user: assignedTo,
      type: "task_assigned",
      taskTitle: task.title,
      groupName: group.name,
      actorName: actorName,
      taskId: task._id,
      groupId: group._id,
      message: `📌 Bạn được giao task: "${task.title}" (Nhóm: ${group.name})`,
    }).catch(err => console.error("Notification Error:", err));

    return updated;
  },

  updateStatus: async (userId, taskId, newStatus) => {
    const validStatuses = ["todo", "in_progress", "done"];
    if (!validStatuses.includes(newStatus)) throw new Error("Status không hợp lệ");

    const task = await taskRepo.findById(taskId);
    if (!task) throw new Error("Task không tồn tại");

    let hasPermission = false;
    
    // Creator is allowed
    if (task.createdBy._id.toString() === userId.toString()) hasPermission = true;

    // Assigned is allowed
    if (task.assignedTo.some(u => u._id.toString() === userId.toString())) hasPermission = true;

    // Group leader/admin is allowed
    let group = null;
    if (task.type === "group" && task.group) {
       group = await groupRepo.findById(task.group._id ? task.group._id : task.group);
       if (group) {
          if (group.owner._id.toString() === userId.toString()) hasPermission = true;
          const mr = group.members.find(m => m.user && m.user._id.toString() === userId.toString());
          if (mr && (mr.role === "leader" || mr.role === "admin")) hasPermission = true;
       }
    }

    if (!hasPermission) throw new Error("Bạn không có quyền chuyển cột task này!");

    ensureCanReopen(task, newStatus, userId, group);

    // Update database first to ensure status changed successfully
    const updatedTask = await taskRepo.updateById(taskId, { status: newStatus });

    if (newStatus === "done" && task.status !== "done" && task.type === "group" && group) {
       const leaders = [];
       if (group.owner) leaders.push(group.owner._id.toString());
       group.members.forEach(m => {
          if (m.role === "leader" || m.role === "admin") {
             const uid = m.user ? m.user._id.toString() : null;
             if (uid && !leaders.includes(uid)) leaders.push(uid);
          }
       });
       const actor = await mongoose.model("User").findById(userId);
       const actorName = actor ? actor.name : "Hệ thống";
       const notifyList = leaders.filter(id => id !== userId.toString());
       for (const lId of notifyList) {
          // Send notification asynchronously
          Notification.create({
             user: lId,
             type: "task_completed",
             taskTitle: task.title,
             groupName: group.name,
             actorName: actorName,
             taskId: task._id,
             groupId: group._id,
             message: `✅ Task "${task.title}" (Nhóm: ${group.name}) đã được kéo sang cột Hoàn thành!`,
          }).catch(err => console.error("Notification failed", err));
       }
    }

    return updatedTask;
  },
};

module.exports = taskService;