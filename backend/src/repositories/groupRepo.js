const Group = require("../models/Group");

const groupRepo = {
  // Lấy nhóm mà user tham gia
  findByMember: (userId) =>
    Group.find({ "members.user": userId })
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .sort({ createdAt: -1 }),

  findById: (id) =>
    Group.findById(id)
      .populate("owner", "name email")
      .populate("members.user", "name email"),

  create: (data) => Group.create(data),

  updateById: (id, data) =>
    Group.findByIdAndUpdate(id, data, { new: true })
      .populate("owner", "name email")
      .populate("members.user", "name email"),

  deleteById: (id) => Group.findByIdAndDelete(id),

  findAll: () =>
    Group.find()
      .populate("owner", "name email")
      .populate("members.user", "name email")
      .sort({ createdAt: -1 }),
};

module.exports = groupRepo;
