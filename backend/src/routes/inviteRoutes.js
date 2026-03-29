const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/inviteController");
const { protect } = require("../utils/authMiddleware");

// Requires authentication
router.use(protect);

router.post("/", inviteController.createInvite);
router.get("/", inviteController.getMyInvites);
router.post("/:id/accept", inviteController.acceptInvite);
router.post("/:id/reject", inviteController.rejectInvite);

module.exports = router;
