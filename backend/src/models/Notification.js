const mongoose = require("mongoose");
const { sendMail } = require("../utils/mailer");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
         <h2 style="color: #4f46e5;">Xin chào ${targetUser.name},</h2>
         <p style="font-size: 16px; line-height: 1.5;">Hệ thống Todo SaaS vừa gửi cho bạn một thông báo mới:</p>
         <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0; font-weight: bold;">
            ${doc.message}
         </div>
         <p>Vui lòng đăng nhập vào ứng dụng để kiểm tra chi tiết!</p>
      </div>
    `;

    await sendMail(
      targetUser.email, 
      "🔔 Thông báo Dòng việc mới - Todo SaaS", 
      doc.message, 
      htmlContent
    );
  } catch (e) {
    console.error("User hook email parsing error:", e);
  }
});

module.exports = mongoose.model("Notification", NotificationSchema);