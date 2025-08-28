const express = require("express");
const { 
  createChallenge, 
  getChallenges, 
  joinChallenge,
  getChallenge,              // 🆕 NEW
  getChallengeLeaderboard    // 🆕 NEW
} = require("../controllers/challengeController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ EXISTING ROUTES (now with Redis caching)
router.post("/", auth, createChallenge);           // Create challenge
router.get("/", getChallenges);                    // Get all challenges  
router.post("/:id/join", auth, joinChallenge);     // Join a challenge

// 🆕 NEW ROUTES (Redis-powered features)
router.get("/:id", getChallenge);                  // Get single challenge
router.get("/:id/leaderboard", getChallengeLeaderboard); // Get challenge leaderboard

module.exports = router;