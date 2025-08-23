const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();


const app = express();

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const challengeRoutes = require('./routes/challengesRoutes');
const progressRoutes = require('./routes/progressRoutes');

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});


//use routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', require("./routes/userRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));



const PORT = process.env.PORT || 4000;

async function start() {
  // optional DB connect for now
  if (!process.env.MONGO_URI) {
    console.warn("⚠️ No MONGO_URI in .env. Starting server without DB connection.");
  } else {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err.message);
    }
  }

  app.listen(PORT, () =>
    console.log(`🚀 Server listening on http://localhost:${PORT}`)
  );
}
start();

module.exports = app;
