import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Zap,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Layers,
  Sparkles,
  BarChart3,
  Flame
} from 'lucide-react';
import { ModelStatistic, ModelCategory } from '../types/arena';

const CATEGORIES: Array<{ key: ModelCategory | 'All'; label: string }> = [
  { key: 'All', label: 'All Categories' },
  { key: 'Coding', label: 'Coding' },
  { key: 'Reasoning', label: 'Reasoning' },
  { key: 'Mathematics', label: 'Mathematics' },
  { key: 'Writing', label: 'Writing' },
  { key: 'Research', label: 'Research' },
  { key: 'Business', label: 'Business' },
  { key: 'General', label: 'General' }
];

export const LeaderboardView: React.FC = () => {
  const [stats, setStats] = useState<ModelStatistic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ModelCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const url =
        selectedCategory === 'All'
          ? '/api/arena/leaderboard'
          : `/api/arena/leaderboard?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.stats && Array.isArray(data.stats)) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory]);

  const filteredStats = stats.filter(
    (item) =>
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-8 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Crowdsourced Community Elo Rankings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frontier Model <span className="text-amber-400">Leaderboard</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Aggregated from authentic blind votes and simultaneous head-to-head racing benchmarks.
              Rankings dynamically recalculate in Cloud SQL for PostgreSQL via Firebase SQL Connect.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
            <div className="text-right">
              <p className="text-xs text-zinc-400 font-medium">Total Evaluations</p>
              <p className="text-xl font-black text-amber-400 font-mono">
                {stats.reduce((acc, curr) => acc + curr.totalCompetitions, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-left">
              <p className="text-xs text-zinc-400 font-medium">Community Votes</p>
              <p className="text-xl font-black text-white font-mono">
                {stats.reduce((acc, curr) => acc + curr.totalVotes, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search model or provider..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {filteredStats.length >= 3 && !searchQuery && selectedCategory === 'All' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* #2 Rank */}
          <div className="bg-gradient-to-b from-zinc-800/40 via-zinc-900/60 to-zinc-950 p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between relative order-2 md:order-1">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-zinc-400">#2</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Silver Laurel
              </span>
            </div>
            <div className="my-3">
              <h3 className="text-base font-bold text-white">{filteredStats[1].displayName}</h3>
              <p className="text-xs text-amber-400">{filteredStats[1].provider}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px]">Elo Rating</span>
                <span className="text-white font-mono font-bold text-base">{filteredStats[1].eloScore}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 block text-[10px]">Win Rate</span>
                <span className="text-emerald-400 font-mono font-bold text-base">{filteredStats[1].winRate}%</span>
              </div>
            </div>
          </div>

          {/* #1 Rank (Gold) */}
          <div className="bg-gradient-to-b from-amber-500/15 via-zinc-900/90 to-zinc-950 p-6 rounded-2xl border border-amber-500/50 flex flex-col justify-between relative shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30 order-1 md:order-2 md:-translate-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-amber-400">#1</span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-zinc-950 shadow-md">
                Champion
              </span>
            </div>
            <div className="my-4">
              <h3 className="text-lg font-black text-white">{filteredStats[0].displayName}</h3>
              <p className="text-xs text-amber-400 font-medium">{filteredStats[0].provider}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-amber-500/20 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px]">Elo Rating</span>
                <span className="text-amber-400 font-mono font-black text-xl">{filteredStats[0].eloScore}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 block text-[10px]">Win Rate</span>
                <span className="text-emerald-400 font-mono font-black text-xl">{filteredStats[0].winRate}%</span>
              </div>
            </div>
          </div>

          {/* #3 Rank */}
          <div className="bg-gradient-to-b from-zinc-800/40 via-zinc-900/60 to-zinc-950 p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between relative order-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-700">#3</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-amber-600 border border-zinc-700">
                Bronze Laurel
              </span>
            </div>
            <div className="my-3">
              <h3 className="text-base font-bold text-white">{filteredStats[2].displayName}</h3>
              <p className="text-xs text-amber-400">{filteredStats[2].provider}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px]">Elo Rating</span>
                <span className="text-white font-mono font-bold text-base">{filteredStats[2].eloScore}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 block text-[10px]">Win Rate</span>
                <span className="text-emerald-400 font-mono font-bold text-base">{filteredStats[2].winRate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                <th className="py-4 px-4 w-16 text-center">Rank</th>
                <th className="py-4 px-4">Model & Provider</th>
                <th className="py-4 px-4 text-center">Elo Score</th>
                <th className="py-4 px-4">Win Rate %</th>
                <th className="py-4 px-4 text-center">Battles</th>
                <th className="py-4 px-4 text-center">Avg TTFT</th>
                <th className="py-4 px-4 text-center">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 italic">
                    Loading verified rankings from Cloud SQL...
                  </td>
                </tr>
              ) : filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No models found matching your query.
                  </td>
                </tr>
              ) : (
                filteredStats.map((item, index) => {
                  const isTop1 = index === 0;
                  const isTop2 = index === 1;
                  const isTop3 = index === 2;

                  return (
                    <tr
                      key={item.modelId}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center font-bold font-mono">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-zinc-950 font-black shadow-sm">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-300 text-zinc-950 font-black">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-bold">{index + 1}</span>
                        )}
                      </td>

                      {/* Model & Provider */}
                      <td className="py-4 px-4">
                        <div>
                          <span className="font-bold text-white text-sm hover:text-amber-400 cursor-pointer">
                            {item.displayName}
                          </span>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[11px] text-zinc-400">{item.provider}</span>
                            <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.2 rounded bg-zinc-800">
                              {item.modelId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Elo Score */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-bold text-base text-amber-400">
                          {item.eloScore}
                        </span>
                      </td>

                      {/* Win Rate with Bar */}
                      <td className="py-4 px-4">
                        <div className="w-40 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-mono font-semibold text-emerald-400">
                              {item.winRate}%
                            </span>
                            <span className="text-zinc-400 font-mono text-[10px]">
                              {item.totalWins} / {item.totalVotes}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, item.winRate))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Battles Count */}
                      <td className="py-4 px-4 text-center font-mono text-zinc-300">
                        {item.totalCompetitions.toLocaleString()}
                      </td>

                      {/* TTFT */}
                      <td className="py-4 px-4 text-center font-mono text-zinc-300">
                        {item.averageTimeToFirstToken}ms
                      </td>

                      {/* Avg Duration */}
                      <td className="py-4 px-4 text-center font-mono text-zinc-300">
                        {(item.averageResponseDuration / 1000).toFixed(2)}s
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
