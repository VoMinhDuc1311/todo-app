const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const { protect } = require("../utils/authMiddleware");

router.use(protect);

router.post("/", groupController.create);
router.get("/", groupController.getMyGroups);
router.get("/:id", groupController.getById);
router.put("/:id", groupController.update);
router.delete("/:id", groupController.delete);

// Quản lý thành viên
router.post("/:id/members", groupController.addMember);
router.delete("/:id/members/:memberId", groupController.removeMember);

module.exports = router;
