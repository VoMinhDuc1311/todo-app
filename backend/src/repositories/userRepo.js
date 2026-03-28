const User = require("../models/User");

const userRepo = {
  findByEmail: (email) => User.findOne({ email }),

  findById: (id) => User.findById(id).select("-password"),

  create: (data) => User.create(data),

  findAll: () => User.find().select("-password").sort({ createdAt: -1 }),

  updateById: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true }).select("-password"),

  deleteById: (id) => User.findByIdAndDelete(id),
};

module.exports = userRepo;
