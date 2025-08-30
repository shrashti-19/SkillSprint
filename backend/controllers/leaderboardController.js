// controllers/leaderboardController.js

const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { leaderboardManager } = require('../utils/LeaderBoardHeap');

// Get leaderboard for a specific challenge
const getChallengeLeaderboard = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { limit = 10 } = req.query;

    // Validate challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ 
        success: false, 
        message: 'Challenge not found' 
      });
    }

    // Get leaderboard from heap
    const leaderboard = leaderboardManager.getLeaderboard(challengeId, parseInt(limit));

    // Add additional user info if needed
    const enrichedLeaderboard = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await User.findById(entry.userId).select('username email');
        return {
          ...entry,
          username: user?.username || 'Unknown User',
          // Add any other user fields you want to display
        };
      })
    );

    res.json({
      success: true,
      data: {
        challengeId,
        challengeTitle: challenge.title,
        totalParticipants: challenge.participants.length,
        leaderboard: enrichedLeaderboard,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

// Get user's position in specific challenge
const getUserPosition = async (req, res) => {
  try {
    const { challengeId, userId } = req.params;

    // Validate challenge exists
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ 
        success: false, 
        message: 'Challenge not found' 
      });
    }

    // Check if user is participant
    if (!challenge.participants.some(p => p.user.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'User is not a participant in this challenge'
      });
    }

    // FORCE REFRESH: Ensure heap has latest data
    const userParticipant = challenge.participants.find(p => p.user.toString() === userId);
    const user = await User.findById(userId).select('username');
    
    const userData = {
      userId: userId,
      username: user?.username || 'Unknown User',
      currentStreak: userParticipant.streak || 0,
      totalActiveDays: userParticipant.streak || 0,
      lastActivity: userParticipant.lastActivityDate || new Date()
    };

    // Update/ensure user is in heap
    leaderboardManager.updateUserPosition(challengeId, userData);

    // Now get user stats from heap
    const userStats = leaderboardManager.getUserStats(challengeId, userId);
    
    if (!userStats) {
      return res.status(404).json({
        success: false,
        message: 'User not found in leaderboard'
      });
    }

    res.json({
      success: true,
      data: {
        userId,
        username: user?.username,
        challengeId,
        position: userStats.position,
        totalParticipants: userStats.totalParticipants,
        currentStreak: userParticipant.streak || 0,
        percentile: Math.round((1 - (userStats.position - 1) / userStats.totalParticipants) * 100)
      }
    });

  } catch (error) {
    console.error('Error fetching user position:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user position',
      error: error.message
    });
  }
};

// Update leaderboard when user's streak changes
const updateLeaderboard = async (challengeId, userId, streakData) => {
  try {
    // Get user details
    const user = await User.findById(userId).select('username');
    if (!user) {
      console.error(`User ${userId} not found for leaderboard update`);
      return;
    }

    // Prepare user data for heap
    const userData = {
      userId: userId,
      username: user.username,
      currentStreak: streakData.currentStreak,
      totalActiveDays: streakData.totalActiveDays || 0,
      lastActivity: streakData.lastActivityDate || new Date()
    };

    // Update position in heap
    const result = leaderboardManager.updateUserPosition(challengeId, userData);
    
    console.log(`Leaderboard updated for user ${userId}: Position ${result.position}/${result.totalParticipants}`);
    
    return result;

  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
};

// Initialize leaderboard from existing challenge data
const initializeChallengeLeaderboard = async (req, res) => {
  try {
    const { challengeId } = req.params;

    // Get challenge with participants
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Initialize each participant in the heap
    let initialized = 0;
    for (const participant of challenge.participants) {
      // Get streak from participant object, not from challenge.streaks map
      const currentStreak = participant.streak || 0;
      const lastActivity = participant.lastActivityDate || new Date();

      // Get user info for the heap
      const user = await User.findById(participant.user).select('username');

      const userData = {
        userId: participant.user.toString(),
        username: user?.username || 'Unknown User',
        currentStreak,
        totalActiveDays: currentStreak, // Approximate
        lastActivity
      };

      leaderboardManager.updateUserPosition(challengeId, userData);
      initialized++;
    }

    res.json({
      success: true,
      message: `Leaderboard initialized for challenge ${challengeId}`,
      data: {
        challengeId,
        participantsInitialized: initialized,
        leaderboard: leaderboardManager.getLeaderboard(challengeId, 10)
      }
    });

  } catch (error) {
    console.error('Error initializing leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing leaderboard',
      error: error.message
    });
  }
};

// Get global stats across all challenges
const getGlobalStats = async (req, res) => {
  try {
    const totalChallenges = await Challenge.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Get active challenges (have participants)
    const activeChallenges = await Challenge.find({
      participants: { $exists: true, $not: { $size: 0 } }
    }).select('title participants createdAt');

    const challengeStats = activeChallenges.map(challenge => {
      const leaderboard = leaderboardManager.getLeaderboard(challenge._id.toString(), 3);
      return {
        challengeId: challenge._id,
        title: challenge.title,
        participantCount: challenge.participants.length,
        topPerformers: leaderboard,
        createdAt: challenge.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        totalChallenges,
        totalUsers,
        activeChallenges: activeChallenges.length,
        challengeStats,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching global stats',
      error: error.message
    });
  }
};

module.exports = {
  getChallengeLeaderboard,
  getUserPosition,
  updateLeaderboard,
  initializeChallengeLeaderboard,
  getGlobalStats
};