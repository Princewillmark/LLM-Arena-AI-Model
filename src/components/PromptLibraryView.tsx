import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Swords,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Code,
  Brain,
  Calculator,
  PenTool,
  Compass,
  Briefcase
} from 'lucide-react';
import { SavedPrompt, ModelCategory } from '../types/arena';
import { useAuth } from '../context/AuthContext';
import { trackFirebaseAnalytics } from '../lib/firebase';

interface PromptLibraryViewProps {
  onSelectPrompt: (prompt: string, category: ModelCategory) => void;
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

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({ onSelectPrompt }) => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New prompt form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ModelCategory>('General');
  const [promptText, setPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/prompts', {
        headers: {
          'x-firebase-uid': user?.firebaseUid || 'anonymous'
        }
      });
      const data = await res.json();
      if (data.prompts && Array.isArray(data.prompts)) {
        setPrompts(data.prompts);
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [user]);

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user?.firebaseUid || 'anonymous'
        },
        body: JSON.stringify({
          title,
          category,
          prompt: promptText,
          userUid: user?.firebaseUid || 'anonymous'
        })
      });

      if (res.ok) {
        setTitle('');
        setPromptText('');
        setShowCreateModal(false);
        fetchPrompts();
        trackFirebaseAnalytics('prompt_saved', { category });
      }
    } catch (err) {
      console.error('Error creating prompt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
        headers: {
          'x-firebase-uid': user?.firebaseUid || 'anonymous'
        }
      });
      if (res.ok) {
        setPrompts(prompts.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting prompt:', err);
    }
  };

  const filteredPrompts = prompts.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: ModelCategory) => {
    switch (cat) {
      case 'Coding':
        return <Code className="w-3.5 h-3.5 text-blue-400" />;
      case 'Reasoning':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'Mathematics':
        return <Calculator className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Writing':
        return <PenTool className="w-3.5 h-3.5 text-amber-400" />;
      case 'Research':
        return <Compass className="w-3.5 h-3.5 text-rose-400" />;
      case 'Business':
        return <Briefcase className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-8 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Standardized Test Bench & User Prompts</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Arena <span className="text-amber-400">Prompt Library</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Curated adversarial benchmarks and test suites designed to stress-test reasoning depth,
              coding accuracy, and instruction adherence across models.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Prompt</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'All'
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            All Prompts
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrompts.map((item) => {
          const isCurated = item.firebaseUid === 'system_curated';

          return (
            <div
              key={item.id}
              className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-semibold text-zinc-300">
                    {getCategoryIcon(item.category)}
                    <span>{item.category}</span>
                  </div>

                  {isCurated ? (
                    <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Standard Benchmark
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeletePrompt(item.id)}
                      title="Delete prompt"
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono line-clamp-4 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                  {item.prompt}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onSelectPrompt(item.prompt, item.category)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Battle in Arena</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating Custom Prompt */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6">
            <h2 className="text-lg font-bold text-white mb-1">Add Benchmark Prompt</h2>
            <p className="text-xs text-zinc-400 mb-4">
              Saved prompts are stored in Firebase SQL Connect and available across your sessions.
            </p>

            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Prompt Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Verification"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ModelCategory)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Prompt Content</label>
                <textarea
                  rows={4}
                  required
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Type the full prompt or question..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
