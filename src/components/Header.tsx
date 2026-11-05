import React from 'react';
import { Swords, Trophy, BookOpen, History, Activity, User, LogOut, ShieldCheck, Database, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType = 'arena' | 'leaderboard' | 'prompts' | 'history' | 'telemetry';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, onOpenAuth }) => {
  const { user, logout, isGuest } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('arena')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Swords className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-wider text-white font-mono">
                  LLM<span className="text-amber-400">ARENA</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Firebase SQL Connect
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Blind AI Benchmark & Simultaneous Racing</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onTabChange('arena')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'arena'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Battle Arena</span>
            </button>

            <button
              onClick={() => onTabChange('leaderboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'leaderboard'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => onTabChange('prompts')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'prompts'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Prompt Library</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'history'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              onClick={() => onTabChange('telemetry')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'telemetry'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Telemetry</span>
            </button>
          </nav>

          {/* User Profile / Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>OpenRouter & GenAI Active</span>
            </div>

            {user ? (
              <div className="flex items-center space-x-2">
                <div
                  onClick={onOpenAuth}
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                >
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-zinc-200 leading-none">{user.displayName}</p>
                    <p className="text-[10px] text-zinc-400 leading-none mt-0.5">
                      {isGuest ? 'Guest Pilot' : 'Firebase Authenticated'}
                    </p>
                  </div>
                </div>
                {!isGuest && (
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-900 overflow-x-auto">
          <button
            onClick={() => onTabChange('arena')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              currentTab === 'arena' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            Arena
          </button>
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              currentTab === 'leaderboard' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => onTabChange('prompts')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              currentTab === 'prompts' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            Prompts
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              currentTab === 'history' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            History
          </button>
          <button
            onClick={() => onTabChange('telemetry')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              currentTab === 'telemetry' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
            }`}
          >
            Telemetry
          </button>
        </div>
      </div>
    </header>
  );
};
