

const Challenge = require("../models/Challenge");
// 🚀 ADD: Redis cache integration
const { cache, ensureConnected } = require("../utils/redisClient");

// 🚀 ENHANCED: Create challenge with cache invalidation
exports.createChallenge = async (req, res) => {
  try {
    await ensureConnected();
    
    const { title, description, duration } = req.body;

    const challenge = new Challenge({
      title,
      description,
      duration,
      createdBy: req.user.id,
    });

    await challenge.save();
    
    // 🚀 SMART INVALIDATION: Clear challenges list cache since we added a new one
    await cache.invalidateAllChallenges();
    console.log(`🗑️ Invalidated challenges list cache - new challenge created: ${challenge._id}`);

    res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      data: challenge
    });
  } catch (error) {
    console.error("❌ Error creating challenge:", error);
    res.status(500).json({ 
      success: false,
      message: "Error creating challenge", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🚀 ENHANCED: Get all challenges with Redis caching
exports.getChallenges = async (req, res) => {
  try {
    await ensureConnected();
    
    console.log("🔍 Fetching challenges list...");
    
    // Step 1: Check Redis cache first
    const cachedChallenges = await cache.getAllChallenges();
    
    if (cachedChallenges && cachedChallenges.data) {
      console.log("🎯 Cache HIT for challenges list");
      return res.json({
        success: true,
        source: "redis-cache",
        data: cachedChallenges.data,
        cached_at: cachedChallenges.cached_at,
        count: cachedChallenges.data.length
      });
    }

    // Step 2: Cache miss - fetch from database
    console.log("📀 Cache MISS for challenges - fetching from database");
    const challenges = await Challenge.find()
      .populate("createdBy", "name email")
      .populate("participants.user", "name email")
      .sort({ createdAt: -1 });

    // Step 3: Add computed fields for each challenge
    const enhancedChallenges = challenges.map(challenge => {
      const challengeObj = challenge.toObject();
      
      return {
        ...challengeObj,
        participantCount: challenge.participants.length,
        averageStreak: challenge.participants.length > 0 
          ? (challenge.participants.reduce((sum, p) => sum + p.streak, 0) / challenge.participants.length).toFixed(1)
          : 0,
        topStreak: challenge.participants.length > 0 
          ? Math.max(...challenge.participants.map(p => p.streak))
          : 0,
        isActive: new Date() <= new Date(challenge.startDate.getTime() + (challenge.duration * 24 * 60 * 60 * 1000))
      };
    });

    // Step 4: Cache the results (30 minutes TTL for challenges)
    await cache.setAllChallenges(enhancedChallenges, 1800); // 30 min TTL
    
    res.json({
      success: true,
      source: "database",
      data: enhancedChallenges,
      count: enhancedChallenges.length,
      cached: true
    });

  } catch (error) {
    console.error("❌ Error fetching challenges:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching challenges", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🚀 ENHANCED: Join challenge with smart cache invalidation
exports.joinChallenge = async (req, res) => {
  try {
    await ensureConnected();
    
    const challengeId = req.params.id;
    const userId = req.user.id;
    
    console.log(`👤 User ${userId} attempting to join challenge ${challengeId}`);

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ 
        success: false,
        message: "Challenge not found" 
      });
    }

    const alreadyJoined = challenge.participants.some(p => p.user.toString() === userId);
    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false,
        message: "Already joined this challenge" 
      });
    }

    // Add user to challenge
    challenge.participants.push({ user: userId });
    await challenge.save();

    // 🚀 SMART CACHE INVALIDATION: Multiple cache invalidations needed!
    
    // 1. Invalidate user's profile cache (their stats changed)
    await cache.invalidateUser(userId);
    console.log(`🗑️ Invalidated user ${userId} cache - joined new challenge`);
    
    // 2. Invalidate this specific challenge cache
    await cache.invalidateChallenge(challengeId);
    console.log(`🗑️ Invalidated challenge ${challengeId} cache - new participant`);
    
    // 3. Invalidate all challenges list (participant counts changed)
    await cache.invalidateAllChallenges();
    console.log(`🗑️ Invalidated challenges list cache - participant counts changed`);

    // 4. Get fresh challenge data for response
    const updatedChallenge = await Challenge.findById(challengeId)
      .populate("createdBy", "name email")
      .populate("participants.user", "name email");

    res.json({ 
      success: true,
      message: "Joined challenge successfully", 
      data: updatedChallenge,
      cacheStatus: "Invalidated user, challenge, and challenges list caches"
    });

  } catch (error) {
    console.error("❌ Error joining challenge:", error);
    res.status(500).json({ 
      success: false,
      message: "Error joining challenge", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🆕 NEW: Get single challenge with caching
exports.getChallenge = async (req, res) => {
  try {
    await ensureConnected();
    
    const challengeId = req.params.id;
    console.log(`🔍 Fetching challenge ${challengeId}`);
    
    // Check cache first
    const cachedChallenge = await cache.getChallenge(challengeId);
    
    if (cachedChallenge && cachedChallenge.data) {
      console.log(`🎯 Cache HIT for challenge ${challengeId}`);
      return res.json({
        success: true,
        source: "redis-cache",
        data: cachedChallenge.data,
        cached_at: cachedChallenge.cached_at
      });
    }

    // Cache miss - fetch from database
    console.log(`📀 Cache MISS for challenge ${challengeId}`);
    const challenge = await Challenge.findById(challengeId)
      .populate("createdBy", "name email")
      .populate("participants.user", "name email");

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    // Add computed fields
    const enhancedChallenge = {
      ...challenge.toObject(),
      participantCount: challenge.participants.length,
      averageStreak: challenge.participants.length > 0 
        ? (challenge.participants.reduce((sum, p) => sum + p.streak, 0) / challenge.participants.length).toFixed(1)
        : 0,
      topStreak: challenge.participants.length > 0 
        ? Math.max(...challenge.participants.map(p => p.streak))
        : 0,
      isActive: new Date() <= new Date(challenge.startDate.getTime() + (challenge.duration * 24 * 60 * 60 * 1000))
    };

    // Cache it (20 minutes TTL for individual challenges)
    await cache.setChallenge(challengeId, enhancedChallenge, 1200);

    res.json({
      success: true,
      source: "database",
      data: enhancedChallenge,
      cached: true
    });

  } catch (error) {
    console.error("❌ Error fetching challenge:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching challenge",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🆕 NEW: Get challenge leaderboard with caching
exports.getChallengeLeaderboard = async (req, res) => {
  try {
    await ensureConnected();
    
    const challengeId = req.params.id;
    console.log(`🏆 Fetching leaderboard for challenge ${challengeId}`);
    
    // Check cache (short TTL for leaderboards - they change frequently)
    const cachedLeaderboard = await cache.getChallengeLeaderboard(challengeId);
    
    if (cachedLeaderboard && cachedLeaderboard.data) {
      console.log(`🎯 Cache HIT for challenge ${challengeId} leaderboard`);
      return res.json({
        success: true,
        source: "redis-cache",
        data: cachedLeaderboard.data,
        cached_at: cachedLeaderboard.cached_at
      });
    }

    // Cache miss - compute leaderboard
    console.log(`📀 Cache MISS for challenge ${challengeId} leaderboard`);
    const challenge = await Challenge.findById(challengeId)
      .populate("participants.user", "name email");

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    // Create leaderboard sorted by streak
    const leaderboard = challenge.participants
      .map((participant, index) => ({
        rank: index + 1,
        user: participant.user,
        streak: participant.streak,
        progress: participant.progress,
        lastActivity: participant.lastActivityDate
      }))
      .sort((a, b) => b.streak - a.streak)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // Cache leaderboard (5 minutes TTL - changes frequently)
    await cache.setChallengeLeaderboard(challengeId, leaderboard, 300);

    res.json({
      success: true,
      source: "database",
      data: leaderboard,
      challengeTitle: challenge.title,
      totalParticipants: leaderboard.length,
      cached: true
    });

  } catch (error) {
    console.error("❌ Error fetching challenge leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching challenge leaderboard",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};