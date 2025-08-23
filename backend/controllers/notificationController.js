// controllers/notificationController.js
const Challenge = require("../models/Challenge");
const User = require("../models/User");
const { NotificationPriorityCalculator, notificationQueue } = require("../utils/PriorityQueue");

/**
 * Generate Smart Notifications for All Users
 * This is where the Priority Queue magic happens!
 */
const generateSmartNotifications = async (req, res) => {
  try {
    console.log("🧠 Generating smart notifications with priority queue...");
    
    // Step 1: Get all active challenges
    const challenges = await Challenge.find({}).populate('participants.user', 'username email');
    
    let notificationsGenerated = 0;
    let emergencyAlerts = 0;
    let motivationMessages = 0;
    
    // Step 2: Process each challenge
    for (const challenge of challenges) {
      for (const participant of challenge.participants) {
        const user = participant.user;
        const streak = participant.streak;
        const lastActivity = participant.lastActivityDate;
        
        // Step 3: Calculate days since last activity
        const now = new Date();
        const daysSinceLastActivity = lastActivity ? 
          Math.floor((now - new Date(lastActivity)) / (1000 * 60 * 60 * 24)) : 1;
        
        // Step 4: Create notification with calculated priority
        const notification = NotificationPriorityCalculator.createNotification(
          user._id,
          streak,
          daysSinceLastActivity,
          challenge.title
        );
        
        // Step 5: Add to priority queue
        notificationQueue.enqueue(notification);
        notificationsGenerated++;
        
        // Step 6: Track notification types
        if (notification.type === 'EMERGENCY') emergencyAlerts++;
        if (notification.type === 'MOTIVATION') motivationMessages++;
      }
    }
    
    res.json({
      success: true,
      message: "Smart notifications generated successfully! 🎯",
      stats: {
        totalNotifications: notificationsGenerated,
        emergencyAlerts,
        motivationMessages,
        queueSize: notificationQueue.size()
      }
    });

  } catch (error) {
    console.error("Error generating notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error generating smart notifications"
    });
  }
};

/**
 * Process Next High-Priority Notification
 * Processes notifications in priority order
 */
const processNextNotification = async (req, res) => {
  try {
    if (notificationQueue.isEmpty()) {
      return res.json({
        success: false,
        message: "No notifications in queue",
        queueSize: 0
      });
    }
    
    // Get highest priority notification
    const notification = notificationQueue.dequeue();
    
    // In real app, you would:
    // - Send email/SMS/push notification
    // - Log to notification history
    // - Update user engagement metrics
    
    // For demo, we'll just return the notification
    res.json({
      success: true,
      message: "Processed highest priority notification! 🚀",
      notification: {
        userId: notification.userId,
        priority: notification.priority,
        type: notification.type,
        message: notification.message,
        userStreak: notification.userStreak
      },
      remainingInQueue: notificationQueue.size()
    });

  } catch (error) {
    console.error("Error processing notification:", error);
    res.status(500).json({
      success: false,
      message: "Error processing notification"
    });
  }
};

/**
 * Get All Notifications by Priority
 * Shows the power of priority queue sorting
 */
const getNotificationsByPriority = (req, res) => {
  try {
    const notifications = notificationQueue.getAllNotifications();
    
    // Group by priority type for better visualization
    const grouped = {
      emergency: notifications.filter(n => n.type === 'EMERGENCY'),
      motivation: notifications.filter(n => n.type === 'MOTIVATION'),
      reminder: notifications.filter(n => n.type === 'REMINDER'),
      encouragement: notifications.filter(n => n.type === 'ENCOURAGEMENT')
    };
    
    res.json({
      success: true,
      totalNotifications: notifications.length,
      notificationsByPriority: grouped,
      queueStats: {
        totalSize: notificationQueue.size(),
        emergencyCount: grouped.emergency.length,
        highPriorityCount: grouped.motivation.length,
        nextToProcess: notificationQueue.peek()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notifications"
    });
  }
};

/**
 * Get Priority Queue Statistics
 * Monitor the performance of our algorithm
 */
const getQueueStats = (req, res) => {
  try {
    const stats = {
      queueSize: notificationQueue.size(),
      isEmpty: notificationQueue.isEmpty(),
      nextNotification: notificationQueue.peek(),
      algorithmComplexity: {
        enqueue: "O(log n)",
        dequeue: "O(log n)",
        peek: "O(1)"
      }
    };
    
    res.json({
      success: true,
      message: "Priority Queue statistics 📊",
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting queue stats"
    });
  }
};

/**
 * Clear All Notifications (for testing)
 */
const clearNotificationQueue = (req, res) => {
  try {
    notificationQueue.clear();
    
    res.json({
      success: true,
      message: "Notification queue cleared! 🧹",
      queueSize: notificationQueue.size()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing queue"
    });
  }
};

module.exports = {
  generateSmartNotifications,
  processNextNotification,
  getNotificationsByPriority,
  getQueueStats,
  clearNotificationQueue
};