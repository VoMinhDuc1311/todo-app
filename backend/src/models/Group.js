const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // Người tạo nhóm = leader
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Danh sách thành viên (bao gồm cả owner)
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["leader", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, collection: "groups" }
);

module.exports = mongoose.model("Group", GroupSchema);
