
const User = require("../models/User");
const Challenge = require("../models/Challenge");

const {cache, ensureConnected} = require('../utils/redisClient');

const mongoose = require('mongoose');
// const getUserProfile = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Step 1: Check LRU cache first

//     await ensureConnected();
//     let cachedProfile = await cache.getUserProfile(userId);
//     let userProfile = cachedProfile ? cachedProfile.data : null;
    
//     if (userProfile) {
//       return res.json({
//         success: true,
//         source: "cache",
//         data: userProfile
//       });
//     }

//     // Step 2: Cache miss - fetch from database
//     const user = await User.findById(userId).select("-password");
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     // Step 3: Get user's challenges
//     const userChallenges = await Challenge.find({
//       "participants.user": userId
//     });

//     // Step 4: Calculate statistics
//     let totalStreaks = 0;
//     let activeChallenges = 0;
//     let longestStreak = 0;

//     userChallenges.forEach(challenge => {
//       const participant = challenge.participants.find(
//         p => p.user.toString() === userId
//       );
      
//       if (participant) {
//         totalStreaks += participant.streak;
//         longestStreak = Math.max(longestStreak, participant.streak);
//         activeChallenges++;
//       }
//     });

//     // Step 5: Create profile object
//     const enhancedProfile = {
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email
//       },
//       stats: {
//         totalChallenges: userChallenges.length,
//         activeChallenges,
//         totalStreaks,
//         longestStreak
//       },
//       lastUpdated: new Date()
//     };

//     // Step 6: Store in cache
//     await cache.setUserProfile(userId, enhancedProfile);

//     res.json({
//       success: true,
//       source: "database",
//       data: enhancedProfile
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };
//🚀 OPTIMIZED VERSION - Single aggregation pipeline
const getUserProfile= async (req, res) => {
  const startTime = Date.now(); // Performance monitoring
  
  try {
    const { userId } = req.params;

    // Step 1: Check cache first
    await ensureConnected();
    let cachedProfile = await cache.getUserProfile(userId);
    
    if (cachedProfile) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Cache HIT - getUserProfile: ${responseTime}ms`);
      
      return res.json({
        success: true,
        source: "cache",
        responseTime: `${responseTime}ms`,
        data: cachedProfile.data
      });
    }

    // Step 2: Single aggregation pipeline (instead of multiple queries)
    const profileAggregation = await Challenge.aggregate([
      // Match challenges where user participates
      {
        $match: {
          "participants.user": new mongoose.Types.ObjectId(userId)
        }
      },
      // Unwind participants array to work with individual participants
      {
        $unwind: "$participants"
      },
      // Filter to only this user's participation
      {
        $match: {
          "participants.user": new mongoose.Types.ObjectId(userId)
        }
      },
      // Group and calculate all stats in one operation
      {
        $group: {
          _id: "$participants.user",
          totalChallenges: { $sum: 1 },
          totalStreaks: { $sum: "$participants.streak" },
          longestStreak: { $max: "$participants.streak" },
          activeChallenges: {
            $sum: {
              $cond: [
                { $gt: ["$participants.progress", 0] },
                1,
                0
              ]
            }
          },
          challenges: {
            $push: {
              challengeId: "$_id",
              title: "$title",
              progress: "$participants.progress",
              streak: "$participants.streak",
              lastActivity: "$participants.lastActivityDate"
            }
          }
        }
      }
    ]);

    // Step 3: Get basic user info (separate lightweight query)
    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Step 4: Combine results
    const stats = profileAggregation[0] || {
      totalChallenges: 0,
      activeChallenges: 0, 
      totalStreaks: 0,
      longestStreak: 0,
      challenges: []
    };

    const enhancedProfile = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      stats: {
        totalChallenges: stats.totalChallenges,
        activeChallenges: stats.activeChallenges,
        totalStreaks: stats.totalStreaks,
        longestStreak: stats.longestStreak
      },
      challenges: stats.challenges || [],
      lastUpdated: new Date()
    };

    // Step 5: Cache the result
    await cache.setUserProfile(userId, enhancedProfile);

    const responseTime = Date.now() - startTime;
    console.log(`🔥 Database query optimized - getUserProfile: ${responseTime}ms`);

    res.json({
      success: true,
      source: "database_optimized",
      responseTime: `${responseTime}ms`,
      data: enhancedProfile
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ getUserProfile error (${responseTime}ms):`, error);
    
    res.status(500).json({
      success: false,
      message: "Server error",
      responseTime: `${responseTime}ms`
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