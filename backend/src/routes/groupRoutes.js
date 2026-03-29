const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const { protect } = require("../utils/authMiddleware");
const upload = require("../utils/upload");

router.use(protect);

router.post("/", upload.single("avatar"), groupController.create);
router.get("/", groupController.getMyGroups);
router.get("/:id", groupController.getById);
router.put("/:id", groupController.update);
router.put("/:id/avatar", upload.single("avatar"), groupController.updateAvatar);
router.delete("/:id", groupController.delete);

// Quản lý thành viên
router.post("/:id/members", groupController.addMember);
router.delete("/:id/members/:memberId", groupController.removeMember);

module.exports = router;
