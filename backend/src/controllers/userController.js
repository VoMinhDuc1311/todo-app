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
};

module.exports = userController;
