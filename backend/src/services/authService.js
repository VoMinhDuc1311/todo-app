const userRepo = require("../repositories/userRepo");
const { generateToken } = require("../utils/jwt");

const authService = {
  register: async ({ name, email, password }) => {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new Error("Email đã được sử dụng");

    const user = await userRepo.create({ name, email, password });
    const token = generateToken({ id: user._id, role: user.role });

    return {
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    };
  },

  login: async ({ email, password }) => {
    // Cần lấy cả password để so sánh
    const user = await require("../models/User").findOne({ email });
    if (!user) throw new Error("Email hoặc mật khẩu không đúng");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error("Email hoặc mật khẩu không đúng");

    const token = generateToken({ id: user._id, role: user.role });

    return {
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    };
  },

  getMe: async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("Người dùng không tồn tại");
    return user;
  },
};

module.exports = authService;
