const User = require("../models/User");
const Group = require("../models/Group");

const userController = {
  // GET /api/users/search?query=&groupId=
  searchUsers: async (req, res) => {
    try {
      const { query, groupId } = req.query;
      if (!query) return res.json({ success: true, data: [] });

      // Build the exclusion list starting with the currently logged-in user
      let excludeIds = [req.user._id];
      
      // If groupId is provided, exclude existing members of that group
      if (groupId) {
        const group = await Group.findById(groupId);
        if (group) {
          excludeIds = [
            ...excludeIds,
            ...group.members.map((m) => m.user.toString()),
          ];
        }
      }

      // Regex for case-insensitive partial match
      const regex = new RegExp(query, "i");
      
      const users = await User.find({
        _id: { $nin: excludeIds },
        $or: [{ name: regex }, { email: regex }],
      })
        .select("-password") // Don't return passwords
        .limit(5);

      res.json({ success: true, data: users });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // POST /api/users/avatar
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }

      user.avatar = avatarUrl;
      await user.save();

      res.json({ success: true, avatar: avatarUrl, message: "Cập nhật ảnh đại diện thành công" });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },
};

module.exports = userController;
