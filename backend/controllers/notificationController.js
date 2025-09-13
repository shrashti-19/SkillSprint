const Challenge = require("../models/Challenge");
const User = require("../models/User");
const Notification = require("../models/Notification"); // <-- Step 1: Import the new Notification model
const { NotificationPriorityCalculator, notificationQueue } = require("../utils/PriorityQueue");

/**
 * Get notifications for a specific user from the database.
 * This function is used by the frontend to display a user's notifications.
 */
const getNotifications = async (req, res) => {
  //console.log("🚪 Auth middleware reached for path:", req.originalUrl);
  console.log("🎯 Request reached getNotifications controller function.");
  try {
    const { userId } = req.params;

    // Validate that a userId was provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to fetch notifications."
      });
    }

    // Step 2: Query the database for notifications where the recipient is the specified userId
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .limit(50); // Limit the number of notifications to prevent performance issues

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully.",
      notifications: notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching notifications.",
      error: error.message
    });
  }
};

/**
 * Generate Smart Notifications for All Users
 * This is where the Priority Queue and database persistence happens!
 */
const generateSmartNotifications = async (req, res) => {
  try {
    console.log("🧠 Generating smart notifications with priority queue...");
    
    // Step 1: Get all active challenges
    const challenges = await Challenge.find({}).populate('participants.user', 'username email');
    
    let notificationsGenerated = 0;
    let emergencyAlerts = 0;
    let motivationMessages = 0;
    
    // Step 2: Process each challenge and create notifications
    for (const challenge of challenges) {
      for (const participant of challenge.participants) {
        const user = participant.user;
        const streak = participant.streak;
        const lastActivity = participant.lastActivityDate;
        
        const now = new Date();
        const daysSinceLastActivity = lastActivity ? 
          Math.floor((now - new Date(lastActivity)) / (1000 * 60 * 60 * 24)) : 1;
        
        const notification = NotificationPriorityCalculator.createNotification(
          user._id,
          streak,
          daysSinceLastActivity,
          challenge.title
        );
        
        // Step 3: Save the notification to the database
        const newNotification = new Notification({
          recipient: notification.userId,
          message: notification.message,
          priority: notification.priority,
          type: notification.type
        });
        await newNotification.save();

        // Step 4: Add to priority queue for immediate processing
        notificationQueue.enqueue(notification);
        notificationsGenerated++;
        
        if (notification.type === 'EMERGENCY') emergencyAlerts++;
        if (notification.type === 'MOTIVATION') motivationMessages++;
      }
    }
    
    res.json({
      success: true,
      message: "Smart notifications generated and saved successfully! 🎯",
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
    
    const notification = notificationQueue.dequeue();
    
    // In a real application, you would:
    // - Send email/SMS/push notification to the user
    // - Update the 'isRead' status of the notification in the database
    
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
  getNotifications, // <-- Step 3: Export the new function
  generateSmartNotifications,
  processNextNotification,
  getNotificationsByPriority,
  getQueueStats,
  clearNotificationQueue
};
