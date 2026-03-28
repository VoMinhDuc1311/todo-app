require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

// 🔥 NEW
const notificationRoutes = require("./src/routes/notificationRoutes");

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/admin", adminRoutes);

// 🔥 NEW
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Todo API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});