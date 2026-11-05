import React, { useState, useEffect } from 'react';
import { History, Swords, Trophy, Clock, CheckCircle2, ChevronRight, Shield, Layers } from 'lucide-react';
import { Competition } from '../types/arena';
import { useAuth } from '../context/AuthContext';

interface HistoryViewProps {
  onRerunPrompt: (prompt: string, category: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onRerunPrompt }) => {
  const { user, isGuest } = useAuth();
  const [history, setHistory] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/arena/history', {
        headers: {
          'x-firebase-uid': user?.firebaseUid || 'anonymous'
        }
      });
      const data = await res.json();
      if (data.history && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-8 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <History className="w-3.5 h-3.5" />
              <span>Personal Battle Archive</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Competition <span className="text-amber-400">History</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Your historical benchmark executions, blind voting records, and response latencies.
              Secured with Firebase Authentication and isolated per UID.
            </p>
          </div>

          <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 flex items-center space-x-3 text-xs">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-zinc-200 font-semibold">Private Data Isolation</p>
              <p className="text-zinc-400 text-[11px]">
                {isGuest ? 'Session restricted to Guest UID' : 'Encrypted Firebase user token verified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 italic bg-zinc-900/40 rounded-2xl border border-zinc-800">
            Querying private records from Firebase SQL Connect...
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-3">
            <Swords className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Competitions Yet</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Launch your first multi-model race in the Battle Arena to start populating your telemetry history!
            </p>
          </div>
        ) : (
          history.map((comp) => {
            return (
              <div
                key={comp.id}
                className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {comp.category}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {new Date(comp.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {comp.hasVoted ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Voted: {comp.userVote?.voteType.toUpperCase()}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px]">
                        Unvoted
                      </span>
                    )}
                  </div>
                </div>

                {/* Prompt Excerpt */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 text-xs font-mono text-zinc-200 line-clamp-2">
                  "{comp.prompt}"
                </div>

                {/* Models in Competition */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-zinc-400 text-[11px]">Models:</span>
                    {comp.selectedModels.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onRerunPrompt(comp.prompt, comp.category)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                  >
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rerun in Arena</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
