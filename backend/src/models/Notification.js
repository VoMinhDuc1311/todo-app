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

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const appLogo = "🚀"; // Simplified logo icon

    const htmlContent = `
      <div style="background-color: #f5f6fa; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3436;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header (Brand Indigo) -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 10px;">${appLogo}</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Todo SaaS</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 5px; font-size: 14px;">Hệ thống quản lý tác vụ thông minh</p>
          </div>

          <!-- Content Section -->
          <div style="padding: 40px 30px;">
            <h2 style="font-size: 20px; color: #1e293b; margin-top: 0; margin-bottom: 20px;">Xin chào, ${targetUser.name}! 👋</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #64748b; margin-bottom: 30px;">
              Chúng tôi muốn gửi đến bạn một thông báo mới quan trọng từ dự án của bạn trên Todo SaaS:
            </p>
            
            <div style="background-color: #f8fafc; border-left: 5px solid #4f46e5; padding: 20px; border-radius: 8px; margin-bottom: 35px;">
              <p style="margin: 0; font-size: 16px; font-style: italic; color: #1e293b; line-height: 1.5;">
                "${doc.message}"
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${frontendURL}" target="_blank" 
                 style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: background-color 0.3s ease; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">
                 Truy cập ứng dụng ngay
              </a>
            </div>
            
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.5; margin-top: 40px; text-align: center;">
              Bạn nhận được email này vì bạn là thành viên của hệ thống Todo SaaS. 
              Nếu có bất kỳ thắc mắc nào, đừng ngần ngại liên hệ với chúng tôi.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              &copy; 2026 Todo SaaS System. Powered by Advanced Agentic Coding.
            </p>
            <div style="margin-top: 10px;">
              <a href="#" style="color: #4f46e5; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
              <a href="#" style="color: #4f46e5; text-decoration: none; font-size: 12px; margin: 0 10px;">Support</a>
            </div>
          </div>
        </div>
      </div>
    `;

    await sendMail(
      targetUser.email, 
      "🔔 Thông báo mới từ Todo SaaS", 
      doc.message, 
      htmlContent
    );
  } catch (e) {
    console.error("User hook email parsing error:", e);
  }
});

module.exports = mongoose.model("Notification", NotificationSchema);