const socketIo = require("socket.io");

let io;

function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });
    socket.on("task:statusChanged", ({ taskId, newStatus }) => {
      socket.broadcast.emit("task:statusChanged", { taskId, newStatus });
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
}
function getIo() {
  if (!io) throw new Error("Socket chưa được khởi tạo!");
  return io;
}

module.exports = { initSocket, getIo };