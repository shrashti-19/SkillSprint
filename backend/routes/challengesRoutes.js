const express = require("express");
const { createChallenge, getChallenges, joinChallenge } = require("../controllers/challengeController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", auth, createChallenge);         // Create challenge
router.get("/", getChallenges);                  // Get all challenges
router.post("/:id/join", auth, joinChallenge);   // Join a challenge

module.exports = router;
