const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../utils/authMiddleware");

// Requires authentication
router.use(protect);

router.get("/search", userController.searchUsers);

module.exports = router;
