import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header, TabType } from './components/Header';
import { ArenaView } from './components/ArenaView';
import { LeaderboardView } from './components/LeaderboardView';
import { PromptLibraryView } from './components/PromptLibraryView';
import { HistoryView } from './components/HistoryView';
import { TelemetryView } from './components/TelemetryView';
import { AuthModal } from './components/AuthModal';
import { ModelCategory } from './types/arena';
import { Shield, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('arena');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Cross-tab prompt transfer state
  const [arenaPrompt, setArenaPrompt] = useState<string>('');
  const [arenaCategory, setArenaCategory] = useState<ModelCategory>('General');

  const handleSelectPromptFromLibrary = (promptText: string, category: ModelCategory) => {
    setArenaPrompt(promptText);
    setArenaCategory(category);
    setCurrentTab('arena');
  };

  const handleRerunFromHistory = (promptText: string, category: ModelCategory) => {
    setArenaPrompt(promptText);
    setArenaCategory(category);
    setCurrentTab('arena');
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
        {/* Navigation Header */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 pb-16">
          {currentTab === 'arena' && (
            <ArenaView
              initialPrompt={arenaPrompt}
              initialCategory={arenaCategory}
              onNavigateToLeaderboard={() => setCurrentTab('leaderboard')}
            />
          )}

          {currentTab === 'leaderboard' && <LeaderboardView />}

          {currentTab === 'prompts' && (
            <PromptLibraryView onSelectPrompt={handleSelectPromptFromLibrary} />
          )}

          {currentTab === 'history' && (
            <HistoryView onRerunPrompt={handleRerunFromHistory} />
          )}

          {currentTab === 'telemetry' && <TelemetryView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-white">LLM ARENA</span>
              <span>•</span>
              <span>Firebase SQL Connect Architecture</span>
            </div>

            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>App Check Attestation</span>
              </span>
              <span className="flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloud SQL for PostgreSQL</span>
              </span>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    </AuthProvider>
  );
}
