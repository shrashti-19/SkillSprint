const Challenge = require("../models/Challenge");

// Create challenge
exports.createChallenge = async (req, res) => {
  try {
    const { title, description, duration } = req.body;

    const challenge = new Challenge({
      title,
      description,
      duration,
      createdBy: req.user.id,
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ message: "Error creating challenge", error });
  }
};

// Get all challenges
exports.getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find().populate("createdBy", "username email");
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: "Error fetching challenges", error });
  }
};

// Join challenge
exports.joinChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    const alreadyJoined = challenge.participants.some(p => p.user.toString() === req.user.id);
    if (alreadyJoined) {
      return res.status(400).json({ message: "Already joined this challenge" });
    }

    challenge.participants.push({ user: req.user.id });
    await challenge.save();

    res.json({ message: "Joined challenge successfully", challenge });
  } catch (error) {
    res.status(500).json({ message: "Error joining challenge", error });
  }
};
