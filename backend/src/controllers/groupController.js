const groupService = require("../services/groupService");

const groupController = {
  // POST /api/groups
  create: async (req, res) => {
    try {
      let avatar = "";
      if (req.file) {
        avatar = `/uploads/groups/${req.file.filename}`;
      }
      const data = { ...req.body, avatar };
      const group = await groupService.create(req.user._id, data);
      res.status(201).json({ success: true, data: group });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // GET /api/groups
  getMyGroups: async (req, res) => {
    try {
      const groups = await groupService.getMyGroups(req.user._id);
      res.json({ success: true, data: groups });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // GET /api/groups/:id
  getById: async (req, res) => {
    try {
      const group = await groupService.getById(req.user._id, req.params.id);
      res.json({ success: true, data: group });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // POST /api/groups/:id/members
  addMember: async (req, res) => {
    try {
      const group = await groupService.addMember(
        req.user._id,
        req.params.id,
        req.body.email
      );
      res.json({ success: true, data: group });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // DELETE /api/groups/:id/members/:memberId
  removeMember: async (req, res) => {
    try {
      const group = await groupService.removeMember(
        req.user._id,
        req.params.id,
        req.params.memberId
      );
      res.json({ success: true, data: group });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  update: async (req, res) => {
    try {
      const group = await groupService.update(req.user._id, req.params.id, req.body);
      res.json({ success: true, data: group });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // PUT /api/groups/:id/avatar
  updateAvatar: async (req, res) => {
    try {
      if (!req.file) throw new Error("Vui lòng chọn ảnh!");
      const avatarPath = `/uploads/groups/${req.file.filename}`;
      const group = await groupService.updateAvatar(req.user._id, req.params.id, avatarPath);
      res.json({ success: true, data: group });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // DELETE /api/groups/:id
  delete: async (req, res) => {
    try {
      await groupService.delete(req.user._id, req.params.id);
      res.json({ success: true, message: "Đã xóa nhóm" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};

module.exports = groupController;
