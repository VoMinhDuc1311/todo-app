const groupRepo = require("../repositories/groupRepo");
const userRepo = require("../repositories/userRepo");

const groupService = {
  create: async (ownerId, { name, description }) => {
    const group = await groupRepo.create({
      name,
      description,
      owner: ownerId,
      members: [{ user: ownerId, role: "leader" }],
    });
    return groupRepo.findById(group._id);
  },

  getMyGroups: (userId) => groupRepo.findByMember(userId),

  // 🔥 FIX NULL MEMBER
  getById: async (userId, groupId) => {
    const group = await groupRepo.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    const isMember = group.members.some(
      (m) => m.user && m.user._id.toString() === userId.toString()
    );

    if (!isMember) throw new Error("Bạn không phải thành viên");

    return group;
  },

  addMember: async (ownerId, groupId, email) => {
    const group = await groupRepo.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    if (group.owner._id.toString() !== ownerId.toString()) {
      throw new Error("Chỉ leader mới được thêm");
    }

    const user = await userRepo.findByEmail(email);
    if (!user) throw new Error("Không tìm thấy user");

    const exists = group.members.some(
      (m) => m.user && m.user._id.toString() === user._id.toString()
    );

    if (exists) throw new Error("User đã trong nhóm");

    group.members.push({ user: user._id, role: "member" });
    await group.save();

    return groupRepo.findById(groupId);
  },

  removeMember: async (ownerId, groupId, memberId) => {
    const group = await groupRepo.findById(groupId);

    if (group.owner._id.toString() !== ownerId.toString()) {
      throw new Error("Không có quyền");
    }

    group.members = group.members.filter(
      (m) => m.user && m.user._id.toString() !== memberId
    );

    await group.save();

    return groupRepo.findById(groupId);
  },

  update: async (ownerId, groupId, data) => {
    const group = await groupRepo.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    if (group.owner._id.toString() !== ownerId.toString()) {
      throw new Error("Chỉ leader mới được sửa nhóm");
    }

    return groupRepo.updateById(groupId, data);
  },

  delete: async (ownerId, groupId) => {
    const group = await groupRepo.findById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    if (group.owner._id.toString() !== ownerId.toString()) {
      throw new Error("Chỉ leader mới được xóa nhóm");
    }

    return groupRepo.deleteById(groupId);
  },
};

module.exports = groupService;