const Group = require("../models/Group");

const groupRepo = {
  // Lấy nhóm mà user tham gia
  findByMember: (userId) =>
    Group.find({ "members.user": userId })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort({ createdAt: -1 }),

  findById: (id) =>
    Group.findById(id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar"),

  create: (data) => Group.create(data),

  updateById: (id, data) =>
    Group.findByIdAndUpdate(id, data, { new: true })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar"),

  deleteById: (id) => Group.findByIdAndDelete(id),

  findAll: () =>
    Group.find()
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort({ createdAt: -1 }),
};

module.exports = groupRepo;
