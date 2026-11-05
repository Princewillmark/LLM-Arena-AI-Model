import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Swords,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  DollarSign,
  Cpu,
  Layers,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Shuffle,
  Shield,
  HelpCircle,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { ModelCatalogItem, ModelCategory, ModelResponse, VoteType } from '../types/arena';
import { useAuth } from '../context/AuthContext';
import { trackFirebaseAnalytics } from '../lib/firebase';

interface ArenaViewProps {
  initialPrompt?: string;
  initialCategory?: ModelCategory;
  onNavigateToLeaderboard: () => void;
}

interface StreamingModelSlot {
  index: number;
  modelId: string;
  maskedName: string;
  revealedName?: string;
  provider?: string;
  text: string;
  status: 'idle' | 'queued' | 'running' | 'streaming' | 'completed' | 'failed';
  ttftMs: number | null;
  totalDurationMs: number | null;
  tokensPerSecond: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  reportedCost: number | null;
  errorMessage?: string;
  responseId?: string;
}

const CATEGORIES: ModelCategory[] = [
  'General',
  'Coding',
  'Reasoning',
  'Mathematics',
  'Writing',
  'Research',
  'Business'
];

export const ArenaView: React.FC<ArenaViewProps> = ({
  initialPrompt = '',
  initialCategory = 'General',
  onNavigateToLeaderboard
}) => {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<ModelCatalogItem[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([
    'gemini-3.1-pro',
    'anthropic/claude-3.5-sonnet'
  ]);
  const [category, setCategory] = useState<ModelCategory>(initialCategory);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [showSystemDrawer, setShowSystemDrawer] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Competition state
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [isCompeting, setIsCompeting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedChoice, setVotedChoice] = useState<VoteType | null>(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Streaming slots
  const [slots, setSlots] = useState<StreamingModelSlot[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // References
  const abortControllerRef = useRef<AbortController | null>(null);
  const panelsContainerRef = useRef<HTMLDivElement | null>(null);

  // Load Model Catalog on mount
  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.models && Array.isArray(data.models)) {
          setCatalog(data.models);
        }
      })
      .catch((err) => console.error('Error fetching model catalog:', err));
  }, []);

  // Update prompt if prop changed
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Handle Model Selection (Max 3)
  const toggleModelSelection = (modelId: string) => {
    if (selectedModelIds.includes(modelId)) {
      if (selectedModelIds.length <= 1) return; // Keep at least one
      setSelectedModelIds(selectedModelIds.filter((id) => id !== modelId));
    } else {
      if (selectedModelIds.length >= 3) {
        // Replace the last one
        setSelectedModelIds([selectedModelIds[0], selectedModelIds[1], modelId]);
      } else {
        setSelectedModelIds([...selectedModelIds, modelId]);
      }
    }
  };

  // Preset match-ups
  const loadPreset = (presetModels: string[]) => {
    setSelectedModelIds(presetModels);
  };

  // Start Competition
  const handleStartCompete = async () => {
    if (!prompt.trim() || isCompeting || selectedModelIds.length === 0) return;

    setIsCompeting(true);
    setHasVoted(false);
    setVotedChoice(null);
    setVoteError(null);
    setCompetitionId(null);

    // Initialize slots with masked names
    const maskedLabels = ['Model A', 'Model B', 'Model C'];
    const initialSlots: StreamingModelSlot[] = selectedModelIds.map((id, index) => ({
      index,
      modelId: id,
      maskedName: maskedLabels[index] || `Model ${index + 1}`,
      text: '',
      status: 'queued',
      ttftMs: null,
      totalDurationMs: null,
      tokensPerSecond: null,
      promptTokens: null,
      completionTokens: null,
      reportedCost: null
    }));
    setSlots(initialSlots);

    // Scroll to results panel
    setTimeout(() => {
      panelsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/arena/compete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user?.firebaseUid || 'anonymous'
        },
        body: JSON.stringify({
          prompt,
          systemInstruction: systemInstruction.trim() || undefined,
          selectedModels: selectedModelIds,
          category,
          userUid: user?.firebaseUid || 'anonymous'
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Arena request failed.');
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          if (!evt.trim()) continue;
          const lines = evt.split('\n');
          let eventType = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              handleSSEMessage(eventType, data);
            } catch (err) {
              console.warn('SSE JSON parse error:', err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Arena streaming error:', err);
        setSlots((prev) =>
          prev.map((s) =>
            s.status !== 'completed'
              ? { ...s, status: 'failed', errorMessage: err.message || 'Stream disrupted' }
              : s
          )
        );
      }
    } finally {
      setIsCompeting(false);
    }
  };

  // Handle SSE Events
  const handleSSEMessage = (eventType: string, data: any) => {
    if (eventType === 'init') {
      setCompetitionId(data.competitionId);
      setSlots((prev) =>
        prev.map((slot) => ({
          ...slot,
          status: 'running'
        }))
      );
    } else if (eventType === 'chunk') {
      const { modelIndex, textDelta, ttftMs } = data;
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.index === modelIndex) {
            return {
              ...slot,
              text: slot.text + textDelta,
              status: 'streaming',
              ttftMs: ttftMs !== null ? ttftMs : slot.ttftMs
            };
          }
          return slot;
        })
      );
    } else if (eventType === 'stats') {
      const { modelIndex, stats } = data;
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.index === modelIndex) {
            return {
              ...slot,
              ttftMs: stats.timeToFirstTokenMs || slot.ttftMs,
              totalDurationMs: stats.totalDurationMs || slot.totalDurationMs,
              tokensPerSecond: stats.tokensPerSecond || slot.tokensPerSecond,
              promptTokens: stats.promptTokens || slot.promptTokens,
              completionTokens: stats.completionTokens || slot.completionTokens,
              reportedCost: stats.reportedCost !== undefined ? stats.reportedCost : slot.reportedCost,
              status: 'completed',
              responseId: stats.id || slot.responseId
            };
          }
          return slot;
        })
      );
    } else if (eventType === 'model_complete') {
      const { modelIndex, responseId } = data;
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.index === modelIndex) {
            return {
              ...slot,
              status: 'completed',
              responseId: responseId || slot.responseId
            };
          }
          return slot;
        })
      );
    } else if (eventType === 'error') {
      const { modelIndex, error } = data;
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.index === modelIndex) {
            return {
              ...slot,
              status: 'failed',
              errorMessage: error
            };
          }
          return slot;
        })
      );
    } else if (eventType === 'done') {
      setIsCompeting(false);
    }
  };

  // Submit Blind Vote
  const handleVote = async (voteType: VoteType) => {
    if (!competitionId || hasVoted || voteSubmitting) return;

    setVoteSubmitting(true);
    setVoteError(null);

    let selectedResponseId: string | null = null;
    if (voteType === 'model_a' && slots[0]) selectedResponseId = slots[0].responseId || null;
    if (voteType === 'model_b' && slots[1]) selectedResponseId = slots[1].responseId || null;
    if (voteType === 'model_c' && slots[2]) selectedResponseId = slots[2].responseId || null;

    try {
      const response = await fetch('/api/arena/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user?.firebaseUid || 'anonymous'
        },
        body: JSON.stringify({
          competitionId,
          voteType,
          selectedResponseId,
          userUid: user?.firebaseUid || 'anonymous'
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit vote.');
      }

      setHasVoted(true);
      setVotedChoice(voteType);

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // Reveal identities on each slot
      if (resData.revealedModels && Array.isArray(resData.revealedModels)) {
        setSlots((prev) =>
          prev.map((slot) => {
            const revealed = resData.revealedModels.find((r: any) => r.modelIndex === slot.index);
            if (revealed) {
              return {
                ...slot,
                revealedName: revealed.displayName,
                provider: revealed.provider
              };
            }
            return slot;
          })
        );
      }

      trackFirebaseAnalytics('vote_submitted', {
        competitionId,
        voteType,
        models: selectedModelIds
      });
    } catch (err: any) {
      setVoteError(err.message || 'Failed to record vote.');
    } finally {
      setVoteSubmitting(false);
    }
  };

  // Copy Response Text
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-8 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simultaneous Multi-Model Arena</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Compare Frontier AI Models <span className="text-amber-400">Head-to-Head</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Send your prompt simultaneously to up to three top LLMs. Responses stream concurrently with blind voting,
              real-time latency tracking, token speed benchmarks, and dynamic Elo updates.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => loadPreset(['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'gemini-3.1-pro'])}
              className="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center justify-center space-x-2 transition-all hover:border-amber-500/40"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Titan Clash (3 Models)</span>
            </button>
            <button
              onClick={() => loadPreset(['gemini-3.8-flash', 'deepseek/deepseek-chat'])}
              className="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center justify-center space-x-2 transition-all hover:border-amber-500/40"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Speed Demons (Sub-Second)</span>
            </button>
            <button
              onClick={() => loadPreset(['deepseek/deepseek-r1', 'gemini-3.1-pro'])}
              className="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center justify-center space-x-2 transition-all hover:border-amber-500/40"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Deep Reasoning (Math & Logic)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Model Selection Bar */}
      <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/80 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Selected Models ({selectedModelIds.length} of 3)
            </span>
          </div>

          {/* Category Selector Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Model Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {catalog.map((model) => {
            const isSelected = selectedModelIds.includes(model.modelId);
            const selectionIndex = selectedModelIds.indexOf(model.modelId);
            const slotLabels = ['Model A', 'Model B', 'Model C'];

            return (
              <div
                key={model.modelId}
                onClick={() => toggleModelSelection(model.modelId)}
                className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isSelected ? slotLabels[selectionIndex] : '+'}
                    </span>
                    <span className="text-xs font-bold text-white">{model.displayName}</span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/60">
                    {model.provider}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 mt-2 line-clamp-1">{model.description}</p>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/50 text-[10px] text-zinc-400">
                  <span className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>${model.inputPricing} / ${model.outputPricing} (1M tok)</span>
                  </span>
                  <span className="text-zinc-500 font-mono">{(model.contextWindow / 1000).toFixed(0)}k ctx</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prompt Composer */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Battle Prompt</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowSystemDrawer(!showSystemDrawer)}
              className="text-xs text-zinc-400 hover:text-amber-400 flex items-center space-x-1 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showSystemDrawer ? 'Hide System Prompt' : 'System Prompt'}</span>
              {showSystemDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span className="text-[11px] text-zinc-400 font-mono">{prompt.length} / 4000</span>
          </div>
        </div>

        {/* System Prompt Drawer */}
        {showSystemDrawer && (
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 animate-fade-in">
            <label className="text-[11px] font-semibold text-zinc-400">System Instruction (Optional)</label>
            <input
              type="text"
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="e.g. You are a senior principal engineer. Provide concise code with no filler commentary."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Prompt Textarea */}
        <div className="relative">
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleStartCompete();
              }
            }}
            placeholder="Enter your prompt or challenge here... (Press Cmd+Enter or Ctrl+Enter to launch arena racing)"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-y leading-relaxed font-sans"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <span className="hidden sm:inline">Shortcut:</span>
            <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
              Cmd + Enter
            </kbd>
            <span>Blind evaluation: Model identities will remain masked until vote!</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {isCompeting ? (
              <button
                type="button"
                onClick={() => abortControllerRef.current?.abort()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
              >
                Cancel Race
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartCompete}
                disabled={!prompt.trim() || selectedModelIds.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Swords className="w-4 h-4" />
                <span>Launch Battle ({selectedModelIds.length} Models)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Racing Panels & Results */}
      {slots.length > 0 && (
        <div ref={panelsContainerRef} className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Concurrent Arena Responses
              </h2>
            </div>
            {isCompeting && (
              <span className="flex items-center space-x-2 text-xs text-amber-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Streaming in real time...</span>
              </span>
            )}
          </div>

          {/* Response Cards Grid */}
          <div
            className={`grid gap-5 ${
              slots.length === 1
                ? 'grid-cols-1'
                : slots.length === 2
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 lg:grid-cols-3'
            }`}
          >
            {slots.map((slot) => {
              const isWinner =
                hasVoted &&
                ((votedChoice === 'model_a' && slot.index === 0) ||
                  (votedChoice === 'model_b' && slot.index === 1) ||
                  (votedChoice === 'model_c' && slot.index === 2));

              return (
                <div
                  key={slot.index}
                  className={`flex flex-col bg-zinc-900/90 rounded-2xl border transition-all duration-300 overflow-hidden shadow-xl ${
                    isWinner
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/10'
                      : 'border-zinc-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isWinner
                            ? 'bg-amber-400 text-zinc-950 shadow-md'
                            : 'bg-zinc-800 text-amber-400'
                        }`}
                      >
                        {isWinner ? <Trophy className="w-4 h-4" /> : slot.maskedName.slice(-1)}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-bold text-white">
                            {hasVoted && slot.revealedName ? slot.revealedName : slot.maskedName}
                          </span>
                          {!hasVoted && (
                            <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                              Masked Identity
                            </span>
                          )}
                        </div>
                        {hasVoted && slot.provider && (
                          <p className="text-[11px] text-amber-400 font-medium">{slot.provider}</p>
                        )}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center space-x-2">
                      {slot.status === 'streaming' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Streaming</span>
                        </span>
                      )}
                      {slot.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </span>
                      )}
                      {slot.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}
                      {slot.status === 'queued' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Metrics Ribbon */}
                  <div className="px-4 py-2 bg-zinc-950/40 border-b border-zinc-800/60 grid grid-cols-4 gap-2 text-[10px] text-zinc-400 font-mono">
                    <div title="Time to first token (Latency)">
                      <span className="text-zinc-400 block text-[9px] uppercase">TTFT</span>
                      <span className="text-zinc-200 font-semibold">
                        {slot.ttftMs !== null ? `${slot.ttftMs}ms` : '—'}
                      </span>
                    </div>
                    <div title="Total response generation duration">
                      <span className="text-zinc-400 block text-[9px] uppercase">Duration</span>
                      <span className="text-zinc-200 font-semibold">
                        {slot.totalDurationMs !== null ? `${(slot.totalDurationMs / 1000).toFixed(2)}s` : '—'}
                      </span>
                    </div>
                    <div title="Tokens generated per second">
                      <span className="text-zinc-400 block text-[9px] uppercase">Speed</span>
                      <span className="text-amber-400 font-semibold">
                        {slot.tokensPerSecond !== null ? `${slot.tokensPerSecond} t/s` : '—'}
                      </span>
                    </div>
                    <div title="Calculated API cost">
                      <span className="text-zinc-400 block text-[9px] uppercase">Cost</span>
                      <span className="text-emerald-400 font-semibold">
                        {slot.reportedCost !== null ? `$${slot.reportedCost.toFixed(5)}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Response Text Viewport */}
                  <div className="flex-1 p-5 min-h-[280px] max-h-[500px] overflow-y-auto font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed select-text">
                    {slot.text ? (
                      <div>
                        {slot.text}
                        {slot.status === 'streaming' && (
                          <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />
                        )}
                      </div>
                    ) : slot.status === 'failed' ? (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                        {slot.errorMessage || 'Response generation failed.'}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-600 italic">
                        {slot.status === 'queued' ? 'Awaiting prompt dispatch...' : 'Connecting to provider...'}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400">
                      {slot.completionTokens ? `${slot.completionTokens} tokens generated` : ''}
                    </span>
                    {slot.text && (
                      <button
                        onClick={() => copyToClipboard(slot.text, slot.index)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-[11px] transition-colors"
                      >
                        {copiedIndex === slot.index ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Output</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blind Voting Bar */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>{hasVoted ? 'Blind Vote Recorded!' : 'Cast Your Blind Vote'}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {hasVoted
                    ? 'Identities unmasked! Elo ratings updated in Firebase SQL Connect.'
                    : 'Choose which model provided the most accurate, articulate, and insightful answer.'}
                </p>
              </div>

              {hasVoted && (
                <button
                  onClick={onNavigateToLeaderboard}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>View Global Leaderboard</span>
                </button>
              )}
            </div>

            {voteError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                {voteError}
              </div>
            )}

            {/* Voting Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
              <button
                type="button"
                disabled={hasVoted || voteSubmitting || slots.length === 0}
                onClick={() => handleVote('model_a')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  votedChoice === 'model_a'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-white hover:border-amber-400 disabled:opacity-40'
                }`}
              >
                <span>👈 Model A Better</span>
                <span className="text-[10px] font-normal opacity-80">
                  {hasVoted && slots[0]?.revealedName ? slots[0].revealedName : 'Option A'}
                </span>
              </button>

              <button
                type="button"
                disabled={hasVoted || voteSubmitting || slots.length < 2}
                onClick={() => handleVote('model_b')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  votedChoice === 'model_b'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-white hover:border-amber-400 disabled:opacity-40'
                }`}
              >
                <span>👉 Model B Better</span>
                <span className="text-[10px] font-normal opacity-80">
                  {hasVoted && slots[1]?.revealedName ? slots[1].revealedName : 'Option B'}
                </span>
              </button>

              {slots.length >= 3 && (
                <button
                  type="button"
                  disabled={hasVoted || voteSubmitting}
                  onClick={() => handleVote('model_c')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                    votedChoice === 'model_c'
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-white hover:border-amber-400 disabled:opacity-40'
                  }`}
                >
                  <span>🎯 Model C Better</span>
                  <span className="text-[10px] font-normal opacity-80">
                    {hasVoted && slots[2]?.revealedName ? slots[2].revealedName : 'Option C'}
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={hasVoted || voteSubmitting || slots.length === 0}
                onClick={() => handleVote('tie')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  votedChoice === 'tie'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-white hover:border-zinc-500 disabled:opacity-40'
                }`}
              >
                <span>🤝 It's a Tie</span>
                <span className="text-[10px] font-normal opacity-80">Equal Quality</span>
              </button>

              <button
                type="button"
                disabled={hasVoted || voteSubmitting || slots.length === 0}
                onClick={() => handleVote('both_bad')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  votedChoice === 'both_bad'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-white hover:border-rose-500 disabled:opacity-40'
                }`}
              >
                <span>👎 All Bad</span>
                <span className="text-[10px] font-normal opacity-80">Low Quality</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
