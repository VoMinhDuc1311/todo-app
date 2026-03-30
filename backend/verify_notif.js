require("dotenv").config();
const mongoose = require("mongoose");
const Notification = require("./src/models/Notification");

const verifyNotification = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TODO_MANAGEMENT");
    
    // Find the latest notification
    const latest = await Notification.findOne().sort({ createdAt: -1 });

    if (latest) {
      console.log("Latest Notification Found:");
      console.log("--------------------------");
      console.log("Type:", latest.type);
      console.log("Task Title:", latest.taskTitle);
      console.log("Group Name:", latest.groupName);
      console.log("Actor Name:", latest.actorName);
      console.log("Task ID:", latest.taskId);
      console.log("Group ID:", latest.groupId);
      console.log("Message:", latest.message);
      console.log("Created At:", latest.createdAt);
    } else {
      console.log("No notifications found.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

verifyNotification();
