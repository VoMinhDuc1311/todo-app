const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendMail = async (to, subject, text, html) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log("⚠️ KHÔNG gửi được Email (Thiếu cấu hình GMAIL_USER hoặc GMAIL_PASS trong .env) | Subject:", subject);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"SaaS Quản Lý CV" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("📧 Đã gửi Email tới: %s", to);
    return info;
  } catch (error) {
    console.error("❌ Lỗi cấu hình gửi Email:", error);
  }
};

module.exports = { sendMail };
