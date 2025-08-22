
const User = require("../models/User");
const Challenge = require("../models/Challenge");
const userProfileCache = require("../utils/LRUcache");

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: Check LRU cache first
    let userProfile = userProfileCache.get(userId);
    
    if (userProfile) {
      return res.json({
        success: true,
        source: "cache",
        data: userProfile
      });
    }

    // Step 2: Cache miss - fetch from database
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Step 3: Get user's challenges
    const userChallenges = await Challenge.find({
      "participants.user": userId
    });

    // Step 4: Calculate statistics
    let totalStreaks = 0;
    let activeChallenges = 0;
    let longestStreak = 0;

    userChallenges.forEach(challenge => {
      const participant = challenge.participants.find(
        p => p.user.toString() === userId
      );
      
      if (participant) {
        totalStreaks += participant.streak;
        longestStreak = Math.max(longestStreak, participant.streak);
        activeChallenges++;
      }
    });

    // Step 5: Create profile object
    const enhancedProfile = {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      stats: {
        totalChallenges: userChallenges.length,
        activeChallenges,
        totalStreaks,
        longestStreak
      },
      lastUpdated: new Date()
    };

    // Step 6: Store in cache
    userProfileCache.set(userId, enhancedProfile);

    res.json({
      success: true,
      source: "database",
      data: enhancedProfile
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const getCacheStats = (req, res) => {
  const stats = userProfileCache.getStats();
  res.json({
    success: true,
    cacheStats: stats
  });
};

module.exports = {
  getUserProfile,
  getCacheStats
};