const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

// Xác thực token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ" });
  }
};

// Chỉ cho Admin truy cập
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Không có quyền Admin" });
  }
  next();
};

module.exports = { protect, adminOnly };
