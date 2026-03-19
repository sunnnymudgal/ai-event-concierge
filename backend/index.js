import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://ai-event-concierge-blue.vercel.app",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// API
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const aiPrompt = `
You are an AI event planner.

Return ONLY valid JSON.

Format:
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
          "HTTP-Referer": "https://your-vercel-app.vercel.app", // 🔥 important
          "X-Title": "AI Event Concierge",
        },
      }
    );

    const text = response.data.choices[0].message.content;

    const cleanText = text
      .replace(/```json|```/g, "")
      .replace(/<|>/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = {
        venueName: "Suggested Venue",
        location: "Unknown",
        estimatedCost: "N/A",
        whyItFits: "Fallback response due to formatting issue",
      };
    }

    await Event.create({ prompt, response: parsed });

    res.json(parsed);

  } catch (err) {
    console.log(err.response?.data || err.message);
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
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ✅ ONLY ONE LISTEN
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});