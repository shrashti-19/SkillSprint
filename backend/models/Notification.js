const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // The user who the notification is intended for
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // This links the notification to a user
      required: true,
    },
    // The main message content of the notification
    message: {
      type: String,
      required: true,
    },
    // The priority of the notification (e.g., EMERGENCY, MOTIVATION)
    priority: {
      type: Number,
      required: true,
    },
    // The type of notification (e.g., 'EMERGENCY', 'MOTIVATION', 'REMINDER')
    type: {
      type: String,
      required: true,
      enum: ["EMERGENCY", "MOTIVATION", "REMINDER", "ENCOURAGEMENT"],
    },
    // A flag to indicate if the user has read the notification
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // This adds 'createdAt' and 'updatedAt' fields
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
