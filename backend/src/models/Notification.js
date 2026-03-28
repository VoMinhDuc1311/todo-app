const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "notifications" }
);

module.exports = mongoose.model("Notification", NotificationSchema);