import Gallery from './components/Gallery';
import { useState } from 'react';

// Category mapping for filter buttons and images.js
const CATEGORY_MAP = {
  all: 'All',
  team: 'Team Vibes',
  creative: 'Creative Campaigns',
  work: 'Work Hard, Play Hard',
  bts: 'Behind-The-Scenes',
};

function App() {
  const [filterCategory, setFilterCategory] = useState("all");

  return (
    <div className="bg-gradient-to-b from-[#181824] via-[#23243a] to-[#181824] min-h-screen px-2">
      <div className="py-15 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide mb-15">
          CollegTips Gallery
        </h1>
        <div className="flex flex-wrap justify-center gap-2">
          {/* All */}
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-gray-500/20 transition focus:outline-none focus:ring-2 focus:ring-gray-400 border border-gray-400/40 ${filterCategory === "all" ? "ring-2 ring-gray-400 bg-gray-600/80 text-white scale-105 shadow-lg" : ""}`}
            onClick={() => setFilterCategory("all")}
            aria-pressed={filterCategory === "all"}
          >
            All
          </button>
          {/* Team Vibes */}
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-purple-500/20 transition focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-400/40 ${filterCategory === "team" ? "ring-2 ring-purple-400 bg-purple-600/80 text-white scale-105 shadow-lg" : ""}`}
            onClick={() => setFilterCategory("team")}
            aria-pressed={filterCategory === "team"}
          >
            Team Vibes
          </button>
          {/* Creative Campaigns */}
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-pink-500/20 transition focus:outline-none focus:ring-2 focus:ring-pink-400 border border-pink-400/40 ${filterCategory === "creative" ? "ring-2 ring-pink-400 bg-pink-600/80 text-white scale-105 shadow-lg" : ""}`}
            onClick={() => setFilterCategory("campaign")}
            aria-pressed={filterCategory === "campaign"}
          >
            Creative Campaigns
          </button>
          {/* Work Hard, Play Hard */}
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-blue-500/20 transition focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-400/40 ${filterCategory === "fun" ? "ring-2 ring-blue-400 bg-blue-600/80 text-white scale-105 shadow-lg" : ""}`}
            onClick={() => setFilterCategory("fun")}
            aria-pressed={filterCategory === "fun"}
          >
            Work Hard, Play Hard
          </button>
          {/* Behind-The-Scenes */}
          <button
            className={`px-4 py-1.5 rounded-lg font-medium text-white bg-transparent hover:bg-gray-500/20 transition focus:outline-none focus:ring-2 focus:ring-gray-400 border border-gray-400/40 ${filterCategory === "bts" ? "ring-2 ring-gray-400 bg-gray-600/80 text-white scale-105 shadow-lg" : ""}`}
            onClick={() => setFilterCategory("bts")}
            aria-pressed={filterCategory === "bts"}
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
