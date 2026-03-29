require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket"); // 👈

const authRoutes = require("./src/routes/authRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const userRoutes = require("./src/routes/userRoutes");
const inviteRoutes = require("./src/routes/inviteRoutes");
const morgan = require('morgan');
const app = express();

const server = http.createServer(app); 
initSocket(server);                   

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invites", inviteRoutes);

app.get("/", (req, res) => res.json({ message: "Todo API is running!" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {           // 👈 Dùng server.listen thay vì app.listen
  console.log(`✅ Server running on port ${PORT}`);
});