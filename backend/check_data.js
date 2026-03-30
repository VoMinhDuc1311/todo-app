require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Group = require("./src/models/Group");

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TODO_MANAGEMENT");
    
    const admin = await User.findOne({ email: "admin@example.com" });
    const otherUser = await User.findOne({ email: { $ne: "admin@example.com" } });
    const group = await Group.findOne();

    console.log("Admin ID:", admin ? admin._id : "None");
    console.log("Other User ID:", otherUser ? otherUser._id : "None");
    console.log("Group ID:", group ? group._id : "None");
    if (group) console.log("Group Name:", group.name);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkData();
