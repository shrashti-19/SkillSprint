// routes/notificationRoutes.js
const express = require("express");
const {
  generateSmartNotifications,
  processNextNotification,
  getNotificationsByPriority,
  getQueueStats,
  clearNotificationQueue
} = require("../controllers/notificationController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Generate smart notifications for all users (Priority Queue magic!)
router.post("/generate", auth, generateSmartNotifications);

// Process next highest priority notification
router.post("/process", auth, processNextNotification);

// Get all notifications sorted by priority
router.get("/priority", getNotificationsByPriority);

// Get priority queue statistics and performance metrics
router.get("/stats", getQueueStats);

// Clear notification queue (for testing)
router.delete("/clear", clearNotificationQueue);

module.exports = router;