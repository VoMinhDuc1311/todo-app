const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date, default: null },

    // Ai tạo task này
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Task thuộc cá nhân hay nhóm
    type: { type: String, enum: ["personal", "group"], default: "personal" },

    // Nếu là task nhóm
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    // Người được giao task (có thể là nhiều người trong nhóm)
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, collection: "tasks" }
);

module.exports = mongoose.model("Task", TaskSchema);
