import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Database,
  Cpu,
  RefreshCw,
  Server,
  Lock,
  Zap,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

interface AnalyticsEvent {
  eventName: string;
  params: any;
  timestamp: string;
}

export const TelemetryView: React.FC = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events.reverse());
      }
    } catch (e) {
      console.error('Failed to fetch analytics telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-8 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>Security & Infrastructure Telemetry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Firebase <span className="text-amber-400">Architecture Matrix</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Monitoring client attestation with Firebase App Check, relational queries on Cloud SQL via
              Firebase SQL Connect, sliding-window request throttling, and live Firebase Analytics event ingestion.
            </p>
          </div>

          <button
            onClick={fetchTelemetry}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold flex items-center space-x-2 border border-zinc-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Architecture Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Auth */}
        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Authentication</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Firebase Auth</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Replaced Clerk with authoritative Firebase UID, Google OAuth, and secure session tokens.
          </p>
          <div className="pt-2 border-t border-zinc-800 text-[10px] text-emerald-400 font-mono">
            STATUS: ACTIVE & ENFORCED
          </div>
        </div>

        {/* Card 2: Database */}
        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Database</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Firebase SQL Connect</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Cloud SQL for PostgreSQL with relational schema: Users, Competitions, ModelResponses, Votes, Stats.
          </p>
          <div className="pt-2 border-t border-zinc-800 text-[10px] text-emerald-400 font-mono">
            STATUS: POSTGRESQL CONNECTED
          </div>
        </div>

        {/* Card 3: Security & Quotas */}
        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bot & Abuse Protection</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>App Check & Quotas</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Replaced Arcjet with Firebase App Check attestation + sliding-window token bucket (20 req/min).
          </p>
          <div className="pt-2 border-t border-zinc-800 text-[10px] text-emerald-400 font-mono">
            LIMIT: 20 REQ/MIN | 4000 CHAR
          </div>
        </div>

        {/* Card 4: Model Gateway */}
        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Streaming Gateway</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Cpu className="w-4 h-4 text-rose-400" />
            <span>OpenRouter & GenAI</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Simultaneous multi-model racing engine with real-time SSE telemetry (TTFT, tok/s, cost).
          </p>
          <div className="pt-2 border-t border-zinc-800 text-[10px] text-emerald-400 font-mono">
            STATUS: STREAMING ACTIVE
          </div>
        </div>
      </div>

      {/* Live Event Stream Table */}
      <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Firebase Analytics Event Stream (Replaces PostHog)
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {events.length} tracked product events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono bg-zinc-950/60">
                <th className="py-2.5 px-3">Event Name</th>
                <th className="py-2.5 px-3">Parameters Payload</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-xs font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-zinc-500 italic">
                    Awaiting product telemetry events...
                  </td>
                </tr>
              ) : (
                events.map((evt, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/20">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold text-[11px]">
                        {evt.eventName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px] truncate max-w-md">
                      {JSON.stringify(evt.params)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 text-[10px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
