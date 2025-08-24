// controllers/progressController.js

const Challenge = require("../models/Challenge");
const User = require("../models/User");
const {updateLeaderboard} = require('./leaderboardController');

// 🎯 MAIN FUNCTION: Log daily activity (like checking off a habit tracker)
const logDailyActivity = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id; // From JWT auth middleware

    // 📝 STEP 1: Find the challenge (like finding the right habit to check off)
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // 📝 STEP 2: Find the user in participants list (like finding your name on attendance sheet)
    const participantIndex = challenge.participants.findIndex(
      (participant) => participant.user.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({ 
        message: "You are not enrolled in this challenge" 
      });
    }

    // 📝 STEP 3: Check if user already logged activity today (prevent double check-ins)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const participant = challenge.participants[participantIndex];
    
    // Simple check: if lastActivityDate is today, they already checked in
    if (participant.lastActivityDate && 
        participant.lastActivityDate.getTime() === today.getTime()) {
      return res.status(400).json({ 
        message: "Activity already logged for today" 
      });
    }

    // 📝 STEP 4: Update streak (consecutive days logic)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If last activity was yesterday, increment streak
    // If not, reset streak to 1 (starting fresh)
    if (participant.lastActivityDate && 
        participant.lastActivityDate.getTime() === yesterday.getTime()) {
      participant.streak += 1; // Continue the streak! 🔥
    } else {
      participant.streak = 1; // Starting new streak
    }

    // 📝 STEP 5: Update lastActivityDate to today
    participant.lastActivityDate = today;
    
    // Update progress percentage (simple: each day = +1%)
    participant.progress = Math.min(participant.progress + 1, 100);

    // 📝 STEP 6: Save the updated challenge
    await challenge.save();
    await updateLeaderboard(challengeId, req.user.id, {
      currentStreak : participant.streak,
      totalActiveDays: participant.streak,
      lastActivityDate: today
    })

    // 📝 STEP 7: Send success response with streak info
    res.status(200).json({
      message: "Daily activity logged successfully! 🎉",
      streak: participant.streak,
      progress: participant.progress,
      challengeTitle: challenge.title,
      leaderboardUpdated: true
    });

  } catch (error) {
    console.error("Error logging daily activity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔍 HELPER FUNCTION: Get user's current streak in a challenge
const getUserStreak = async (req, res) => {
  try {
    const { userId, challengeId } = req.params;

    // Find the challenge and get participant data
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Find user in participants
    const participant = challenge.participants.find(
      (p) => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(404).json({ 
        message: "User not found in this challenge" 
      });
    }

    res.status(200).json({
      streak: participant.streak,
      progress: participant.progress,
      lastActivity: participant.lastActivityDate,
      challengeTitle: challenge.title
    });

  } catch (error) {
    console.error("Error getting user streak:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  logDailyActivity,
  getUserStreak,
};