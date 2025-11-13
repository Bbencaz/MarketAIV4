// backend/server.js
// Express backend server for MarketAIV4

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import editRoute from "./routes/editRoute.js"; // AI image edit route

// ---------- Load .env ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// Quick sanity check
console.log("HF_API_KEY:", process.env.HF_API_KEY ? "Loaded ✓" : "MISSING");

// ---------- Create Express app ----------
const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" })); // large enough for base64 images

// Simple test route
app.get("/", (req, res) => {
  res.send("✅ Backend server is running!");
});

// AI edit route
app.use("/api/edit", editRoute);

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
