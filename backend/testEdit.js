// backend/testEdit.js

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:5000/api/edit";
const imagePath = path.join(__dirname, "test.jpg"); // change if needed

async function run() {
  try {
    console.log("📂 Reading test image from:", imagePath);
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    const prompt = "make the grass red";

    console.log("📨 Sending request to backend...");
    const response = await axios.post(API_URL, {
      imageBase64,
      prompt,
    });

    console.log("✅ Request successful, keys:", Object.keys(response.data));

    const editedBase64 = response.data?.result?.image_base64;

    if (!editedBase64) {
      console.log("⚠️ No image returned. Full response:");
      console.dir(response.data, { depth: null });
      return;
    }

    const outputPath = path.join(__dirname, "output.png");
    fs.writeFileSync(outputPath, Buffer.from(editedBase64, "base64"));

    console.log("🎨 Edited image saved as:", outputPath);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message || err);
  }
}

run();

