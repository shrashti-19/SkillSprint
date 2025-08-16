const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const PORT = process.env.PORT || 5000;

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
