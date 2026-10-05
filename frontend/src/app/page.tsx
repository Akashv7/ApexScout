'use client';

import { useState, useEffect } from 'react';

// Define the athlete type expected from the backend
type Athlete = {
  id: string;
  name: string;
  role: string;
  sport: string;
  talentIndex: number;
  recentForm: number;
  consistency: number;
  confidence: string;
  league: { name: string; strength: number } | null;
};

export default function Dashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState('all');

  // Fetch athletes from the existing Node.js backend
  useEffect(() => {
    const fetchAthletes = async () => {
      setLoading(true);
      try {
        const url = sport === 'all' 
          ? 'http://localhost:3000/api/players' 
          : `http://localhost:3000/api/players?sport=${sport}`;
          
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) setAthletes(data);
      } catch (error) {
        console.error("Error fetching athletes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAthletes();
  }, [sport]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="font-bold text-xl tracking-tighter">A</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              ApexScout
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">Global (All Sports)</option>
              <option value="cricket">Cricket</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
            </select>
            <button className="bg-white text-slate-950 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">
              Upload Video
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Universal Talent Intelligence</h2>
          <p className="text-slate-400">Discover mathematically verified athletes across all tiers of global competition.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {athletes.map(athlete => (
              <div 
                key={athlete.id} 
                className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{athlete.name}</h3>
                      <p className="text-sm text-slate-400 capitalize">{athlete.sport} • {athlete.league?.name || "Independent"}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold tracking-wide uppercase">
                      {athlete.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                      <div className="text-xs text-slate-400 font-medium mb-1">Talent Index</div>
                      <div className="text-2xl font-bold text-indigo-400">
                        {athlete.talentIndex ? athlete.talentIndex.toFixed(1) : "N/A"}
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                      <div className="text-xs text-slate-400 font-medium mb-1">Recent Form</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {athlete.recentForm ? athlete.recentForm.toFixed(1) : "N/A"}
                      </div>
                    </div>

                    <div className="col-span-2 bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">Data Confidence</div>
                        <div className="text-sm font-semibold capitalize">
                          <span className={athlete.confidence === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'}>
                            ● {athlete.confidence}
                          </span>
                        </div>
                      </div>
                      <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        View Report →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
