// routes/leaderboard.js

const express = require('express');
const router = express.Router();
const {
  getChallengeLeaderboard,
  getUserPosition,
  initializeChallengeLeaderboard,
  getGlobalStats
} = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/leaderboard/:challengeId
// @desc    Get leaderboard for specific challenge
// @access  Public (participants can see rankings)
router.get('/:challengeId', getChallengeLeaderboard);

// @route   GET /api/leaderboard/:challengeId/user/:userId  
// @desc    Get specific user's position and stats
// @access  Private (user can see their own position)
router.get('/:challengeId/user/:userId', authMiddleware, getUserPosition);

// @route   POST /api/leaderboard/:challengeId/initialize
// @desc    Initialize/refresh leaderboard from existing data
// @access  Private (admin or challenge creator)
router.post('/:challengeId/initialize', authMiddleware, initializeChallengeLeaderboard);

// @route   GET /api/leaderboard/global-stats
// @desc    Get global statistics across all challenges
// @access  Private (admin dashboard)
router.get('/global-stats', authMiddleware, getGlobalStats);

// @route   GET /api/leaderboard/:challengeId/top/:limit
// @desc    Get top N users (flexible limit)
// @access  Public
router.get('/:challengeId/top/:limit', async (req, res) => {
  req.query.limit = req.params.limit;
  getChallengeLeaderboard(req, res);
});

module.exports = router;