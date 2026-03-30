const mongoose = require("mongoose");
const { sendMail } = require("../utils/mailer");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["task_assigned", "task_completed", "other"], default: "other" },
    taskTitle: String,
    groupName: String,
    actorName: String,
    taskId: mongoose.Schema.Types.ObjectId,
    groupId: mongoose.Schema.Types.ObjectId,
    message: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "notifications" }
);

NotificationSchema.post("save", async function (doc) {
  try {
    const User = mongoose.model("User");
    const targetUser = await User.findById(doc.user);
    if (!targetUser || !targetUser.email) return;

    // Build Email Context
    const receiverName = targetUser.name || "User";
    const taskTitle = doc.taskTitle || "N/A";
    const groupName = doc.groupName || "Cá nhân";
    const actorName = doc.actorName || "Hệ thống";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const taskLink = doc.groupId ? `${frontendUrl}/groups/${doc.groupId}` : `${frontendUrl}/`;

    let emailSubject = "🔔 Thông báo mới từ Todo SaaS";
    let statusLabel = "Thông báo";

    if (doc.type === "task_assigned") {
      emailSubject = "📌 Bạn được giao công việc mới - Todo SaaS";
      statusLabel = "You have been assigned a new task";
    } else if (doc.type === "task_completed") {
      emailSubject = "✅ Công việc đã hoàn thành - Todo SaaS";
      statusLabel = "A task has been marked as completed";
    }

    const htmlContent = `
<div style="background:#f5f6fa;padding:30px 0;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

    <!-- Header -->
    <div style="background:#4f46e5;color:#ffffff;padding:20px;text-align:center;">
      <h2 style="margin:0;">🚀 Todo SaaS</h2>
      <p style="margin:5px 0 0;font-size:14px;">Task Management System</p>
    </div>

    <!-- Body -->
    <div style="padding:25px; color: #333333;">
      <p style="font-size: 16px;">Hello <strong>${receiverName}</strong>,</p>

      <p style="font-size: 15px;">${statusLabel}:</p>

      <div style="background:#f9fafb;padding:15px;border-radius:6px;margin:15px 0;border: 1px solid #edf2f7;">
        <p style="margin:5px 0;"><strong>📌 Task:</strong> ${taskTitle}</p>
        <p style="margin:5px 0;"><strong>📁 Project:</strong> ${groupName}</p>
        <p style="margin:5px 0;"><strong>👤 Action by:</strong> ${actorName}</p>
      </div>

      <p style="font-size: 15px;">Please click below to view more details:</p>

      <!-- Button -->
      <div style="text-align:center;margin:25px 0;">
        <a href="${taskLink}" 
           style="background:#4f46e5;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">
          View Task
        </a>
      </div>

      <p style="font-size:13px;color:#718096;line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        If you did not expect this notification, you can ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px;text-align:center;font-size:12px;color:#94a3b8;border-top: 1px solid #f1f5f9;">
      <p style="margin:0; font-weight: 600;">© 2026 Todo SaaS. All rights reserved.</p>
      <p style="margin:5px 0;">This is an automated message, please do not reply.</p>
    </div>

  </div>
</div>
    `;

    // 🏆 NON-BLOCKING (No await here)
    sendMail(
      targetUser.email, 
      emailSubject, 
      doc.message, 
      htmlContent
    ).catch(err => console.error("📧 ASYNC EMAIL ERROR:", err));

  } catch (e) {
    console.error("User hook email parsing error:", e);
  }
});

module.exports = mongoose.model("Notification", NotificationSchema);