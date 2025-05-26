import Gallery from './components/Gallery';
import { useState } from 'react';

function App() {
  const [filterCategory, setFilterCategory] = useState("all");

  return (
    <div className="bg-gradient-to-b from-[#181824] via-[#23243a] to-[#181824] min-h-screen px-2">
      <div className="py-15 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide mb-15">
          CollegTips Gallery
        </h1>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-gray-500/20 transition focus:outline-none focus:ring-2 focus:ring-gray-400 border border-gray-400/40 ${filterCategory === "all" ? "ring-2 ring-gray-400 bg-gray-600/80 text-white" : ""}`}
            onClick={() => setFilterCategory("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-purple-500/20 transition focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-400/40 ${filterCategory === "team" ? "ring-2 ring-purple-400 bg-purple-600/80 text-white" : ""}`}
            onClick={() => setFilterCategory("team")}
          >
            Team Vibes
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-pink-500/20 transition focus:outline-none focus:ring-2 focus:ring-pink-400 border border-pink-400/40 ${filterCategory === "creative" ? "ring-2 ring-pink-400 bg-pink-600/80 text-white" : ""}`}
            onClick={() => setFilterCategory("creative")}
          >
            Creative Campaigns
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-blue-500/20 transition focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-400/40 ${filterCategory === "work" ? "ring-2 ring-blue-400 bg-blue-600/80 text-white" : ""}`}
            onClick={() => setFilterCategory("work")}
          >
            Work Hard, Play Hard
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-gray-500/20 transition focus:outline-none focus:ring-2 focus:ring-gray-400 border border-gray-400/40 ${filterCategory === "bts" ? "ring-2 ring-gray-400 bg-gray-600/80 text-white" : ""}`}
            onClick={() => setFilterCategory("bts")}
          >
            Behind-The-Scenes
          </button>
        </div>
      </div>
      <Gallery filterCategory={filterCategory} />
    </div>
  );
}

export default App;
