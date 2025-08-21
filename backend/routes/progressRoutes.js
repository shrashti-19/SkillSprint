const express = require("express");
const {logDailyActivity, getUserStreak} = require("../controllers/progressController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// log daily activity (users check in daily)
router.post("/log/:challengeId", auth, logDailyActivity);

//get user current streak in a specific challenge
router.get("/streak/:userId/:challengeId", getUserStreak);

modules.exports = router;