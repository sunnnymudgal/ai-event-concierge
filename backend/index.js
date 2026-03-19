import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
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



// API
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const aiPrompt = `
You are an AI event planner.

Return ONLY valid JSON.

Rules:
- Do NOT include any symbols like < or >
- Do NOT include explanation
- Output must be valid JSON

Format:
{
  "venueName": "string",
  "location": "string",
  "estimatedCost": "string",
  "whyItFits": "string"
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

    // console.log("AI RAW:", text);

    // Clean JSON
    const cleanText = text.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON",
        raw: text,
      });
    }

    await Event.create({
      prompt,
      response: parsed,
    });

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

app.listen(5000, () => console.log("Server running on 5000"));

//  Delete single history item
app.delete("/api/history/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Event.findByIdAndDelete(id);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Delete failed" });
  }
});