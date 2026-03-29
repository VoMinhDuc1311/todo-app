const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../utils/authMiddleware");
const upload = require("../utils/upload");

// Requires authentication
router.use(protect);

router.get("/search", userController.searchUsers);
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);

module.exports = router;
