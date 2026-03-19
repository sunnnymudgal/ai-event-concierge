import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/history");
      setHistory(res.data);
    } catch (err) {
      console.error("History fetch failed", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:5000/api/generate", {
        prompt: input,
      });

      setResult(res.data);
      fetchHistory();
      setInput("");
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  //  DELETE FUNCTION
  const handleDelete = async (id) => {

    try {
      await axios.delete(`http://localhost:5000/api/history/${id}`);
      fetchHistory();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-blue-500/30 font-sans antialiased">
      
      {/* Glow Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/20 blur-[120px] pointer-events-none" />

      <main className="relative max-w-4xl mx-auto px-6 py-16">

        {/* HEADER */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-3">
            ✨ Event Concierge
          </h1>
          <p className="text-zinc-400 text-lg">
            AI-powered venue scouting and event planning.
          </p>
        </header>

        {/* INPUT */}
        <div className="relative group mb-12">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
          
          <div className="relative flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-2 shadow-2xl">
            <input
              className="bg-transparent border-none outline-none w-full px-4 py-3 text-zinc-100 placeholder:text-zinc-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your perfect event..."
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-zinc-100 text-black font-semibold px-8 py-3 rounded-lg hover:bg-white active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Planning..." : "Generate"}
            </button>
          </div>
        </div>

        {/* RESULT + LOADING */}
        <section className="space-y-6">

          {/* LOADING */}
          {loading && (
            <div className="animate-pulse bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-4">
              <div className="h-6 bg-zinc-800 rounded w-1/3" />
              <div className="h-4 bg-zinc-800 rounded w-1/2" />
              <div className="h-20 bg-zinc-800 rounded w-full" />
            </div>
          )}

          {/* RESULT */}
          {result && !loading && (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-blue-500/20 p-8 rounded-2xl shadow-2xl hover:border-blue-500/40 transition">
              
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-bold text-white">
                  {result.venueName}
                </h2>

                <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-mono border border-blue-500/20">
                  {result.estimatedCost}
                </span>
              </div>

              <p className="text-zinc-400 flex items-center gap-2 mb-6">
                📍 {result.location}
              </p>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  AI Reasoning
                </h3>
                <p className="leading-relaxed text-zinc-300">
                  {result.whyItFits}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* HISTORY */}
        <footer className="mt-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">
              Recent History
            </h2>
            <div className="w-full h-[1px] bg-zinc-800/50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((item) => (
              <div
                key={item._id}
                className="group relative bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl hover:bg-zinc-800/40 transition-colors"
              >
                
                {/* DELETE BUTTON */}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="absolute top-2 right-2 text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded hover:bg-red-500/20"
                >
                  ✕
                </button>

                <p className="text-xs text-zinc-500 truncate mb-2 italic">
                  "{item.prompt}"
                </p>

                <p className="font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">
                  {item.response.venueName}
                </p>

                <p className="text-sm text-zinc-400">
                  {item.response.location}
                </p>
              </div>
            ))}
          </div>
        </footer>

      </main>
    </div>
  );
}

export default App;