import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://ai-event-concierge-xxih.onrender.com";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // 📦 Fetch history
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("History fetch failed", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🤖 Generate AI result
  const handleSubmit = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const res = await axios.post(`${API}/api/generate`, {
        prompt: input,
      });

      setResult(res.data);
      fetchHistory();
      setInput("");
    } catch (err) {
      console.error("AI request failed", err);
    }

    setLoading(false);
  };

  // ❌ Delete history
  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;

    try {
      await axios.delete(`${API}/api/history/${id}`);
      fetchHistory();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 px-6 py-16 font-sans">

      {/* HEADER */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          ✨ Event Concierge
        </h1>
        <p className="text-zinc-400 mt-2">
          AI-powered venue scouting and event planning
        </p>
      </header>

      {/* INPUT */}
      <div className="max-w-3xl mx-auto flex gap-4 mb-10">
        <input
          className="flex-1 p-4 rounded-xl bg-zinc-900 border border-zinc-700 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your perfect event..."
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-white text-black px-6 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Planning..." : "Generate"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center text-zinc-400 mb-6 animate-pulse">
          🤖 AI is planning your event...
        </div>
      )}

      {/* RESULT */}
      {result && !loading && (
        <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-700 p-6 rounded-xl mb-10 shadow-lg">
          
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white">
              {result.venueName}
            </h2>

            <span className="text-sm text-green-400 font-semibold">
              {result.estimatedCost}
            </span>
          </div>

          <p className="text-zinc-400 mb-3">
            📍 {result.location}
          </p>

          <p className="text-zinc-300">
            {result.whyItFits}
          </p>
        </div>
      )}

      {/* HISTORY */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-zinc-300">
          Recent Searches
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {history.map((item) => (
            <div
              key={item._id}
              className="relative bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800 transition"
            >
              
              {/* DELETE BUTTON */}
              <button
                onClick={() => handleDelete(item._id)}
                className="absolute top-2 right-2 text-red-400 text-xs hover:text-red-300"
              >
                ✕
              </button>

              <p className="text-xs text-zinc-500 mb-2 italic truncate">
                "{item.prompt}"
              </p>

              <p className="font-semibold text-zinc-200">
                {item.response.venueName}
              </p>

              <p className="text-sm text-zinc-400">
                {item.response.location}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default App;