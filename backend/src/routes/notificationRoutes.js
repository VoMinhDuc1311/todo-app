const express = require("express");
const router = express.Router();
const { protect } = require("../utils/authMiddleware");
const Notification = require("../models/Notification");

router.use(protect);

// Lấy notification
router.get("/", async (req, res) => {
  const notis = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: notis });
});

// Mark read
router.patch("/:id/read", async (req, res) => {
  const noti = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  res.json({ success: true, data: noti });
});

module.exports = router;