const GroupInvite = require("../models/GroupInvite");
const Group = require("../models/Group");
const Notification = require("../models/Notification");

const inviteController = {
  // POST /api/invites
  createInvite: async (req, res) => {
    try {
      const { groupId, receiverId } = req.body;
      const senderId = req.user._id;

      if (senderId.toString() === receiverId.toString()) {
        return res.status(400).json({ success: false, message: "Không thể mời chính mình" });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nhóm" });
      }

      // Check if already a member
      const isMember = group.members.some((m) => m.user.toString() === receiverId.toString());
      if (isMember) {
        return res.status(400).json({ success: false, message: "Người này đã là thành viên" });
      }

      // Check if a pending invite already exists
      const existingInvite = await GroupInvite.findOne({
        groupId,
        receiverId,
        status: "pending",
      });

      if (existingInvite) {
        return res.status(400).json({ success: false, message: "Đã gửi lời mời trước đó rồi" });
      }

      // Create invite
      const invite = new GroupInvite({
        groupId,
        senderId,
        receiverId,
        status: "pending",
      });
      await invite.save();

      res.status(201).json({ success: true, data: invite });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // GET /api/invites
  getMyInvites: async (req, res) => {
    try {
      const invites = await GroupInvite.find({
        receiverId: req.user._id,
        status: "pending",
      })
        .populate("groupId", "name")
        .populate("senderId", "name email avatar")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: invites });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // POST /api/invites/:id/accept
  acceptInvite: async (req, res) => {
    try {
      const invite = await GroupInvite.findById(req.params.id);
      if (!invite || invite.status !== "pending") {
        return res.status(400).json({ success: false, message: "Lời mời không hợp lệ hoặc đã được xử lý" });
      }

      // Ensure that only the receiver can accept
      if (invite.receiverId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Không có quyền xử lý lời mời này" });
      }

      const group = await Group.findById(invite.groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: "Nhóm không còn tồn tại" });
      }

      // Add user to group
      const alreadyIn = group.members.some((m) => m.user.toString() === invite.receiverId.toString());
      if (!alreadyIn) {
        group.members.push({ user: invite.receiverId, role: "member" });
        await group.save();
      }

      invite.status = "accepted";
      await invite.save();

      res.json({ success: true, message: "Đã tham gia nhóm thành công" });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // POST /api/invites/:id/reject
  rejectInvite: async (req, res) => {
    try {
      const invite = await GroupInvite.findById(req.params.id);
      if (!invite || invite.status !== "pending") {
        return res.status(400).json({ success: false, message: "Lời mời không hợp lệ" });
      }

      // Ensure that only the receiver can reject
      if (invite.receiverId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Không có quyền xử lý lời mời này" });
      }

      invite.status = "rejected";
      await invite.save();

      res.json({ success: true, message: "Đã từ chối lời mời" });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },
};

module.exports = inviteController;
