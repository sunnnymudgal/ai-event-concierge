import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

// FIX CORS (important for Vercel)
app.use(cors({
  origin: "*", // or your vercel URL
}));

app.use(express.json());

// DEBUG (temporary)
console.log("ENV CHECK:", process.env.OPENROUTER_API_KEY ? "FOUND" : "MISSING");

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Schema
const eventSchema = new mongoose.Schema({
  prompt: String,
  response: Object,
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);

// API
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "API key missing" });
    }

    const aiPrompt = `
Return ONLY JSON:
{
  "venueName": "",
  "location": "",
  "estimatedCost": "",
  "whyItFits": ""
}
User Request: ${prompt}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: aiPrompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.choices[0].message.content;

    const cleanText = text.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = {
        venueName: "Fallback Venue",
        location: "Unknown",
        estimatedCost: "N/A",
        whyItFits: "AI returned invalid JSON",
      };
    }

    await Event.create({ prompt, response: parsed });

    res.json(parsed);

  } catch (err) {
    console.log("FULL ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "AI failed" });
  }
});

// History
app.get("/api/history", async (req, res) => {
  const data = await Event.find().sort({ createdAt: -1 });
  res.json(data);
});

// Delete
app.delete("/api/history/:id", async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// PORT FIX
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});