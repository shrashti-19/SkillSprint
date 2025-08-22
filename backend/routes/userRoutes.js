const express = require("express");
const { getUserProfile, getCacheStats } = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Get user profile with LRU caching
router.get("/profile/:userId", auth, getUserProfile);

// Get cache statistics
router.get("/cache/stats", getCacheStats);

module.exports = router;