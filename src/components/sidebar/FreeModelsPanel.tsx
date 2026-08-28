import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  RefreshCw,
  Cpu,
  Zap,
  Check,
  ExternalLink,
  Code2,
  Brain,
  Layers,
  Filter,
  CheckCircle2,
  DollarSign,
  Gauge,
  Trophy,
} from 'lucide-react';
import {
  AIModelOption,
  DEFAULT_MODELS,
  fetchOpenRouterModels,
} from '../../services/aiService';
import { MODEL_CAPABILITY_PROFILES } from '../../services/modelRouter';

interface FreeModelsPanelProps {
  selectedModel: string;
  onSelectModel: (modelId: string, modelObj?: AIModelOption) => void;
  onOpenBYOKTab?: () => void;
}

type FilterCategory = 'auto' | 'free' | 'coding' | 'reasoning' | 'priority_matrix' | 'all';

export const FreeModelsPanel: React.FC<FreeModelsPanelProps> = ({
  selectedModel,
  onSelectModel,
  onOpenBYOKTab,
}) => {
  const [models, setModels] = useState<AIModelOption[]>(DEFAULT_MODELS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('free');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Load models on mount
  const loadModels = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchOpenRouterModels();
      if (fetched && fetched.length > 0) {
        // Merge with Gemini defaults
        const geminiModels = DEFAULT_MODELS.filter((m) => m.provider === 'gemini');
        const combined = [...geminiModels, ...fetched];
        setModels(combined);
        setLastFetched(new Date());
      }
    } catch (e) {
      console.warn('Could not fetch OpenRouter models:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  // Filtered models
  const filteredModels = models.filter((m) => {
    if (m.id === 'auto-smart') return false; // Show auto router in top banner

    // Search query matching
    const matchesSearch =
      searchQuery.trim() === '' ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Category matching
    if (filterCategory === 'free') {
      return m.isFree === true || m.id.endsWith(':free') || m.id.startsWith('gemini-');
    }
    if (filterCategory === 'coding') {
      return m.isCodeSuited === true;
    }
    if (filterCategory === 'reasoning') {
      return m.isReasoning === true;
    }
    return true;
  });

  const freeCount = models.filter((m) => m.isFree || m.id.endsWith(':free') || m.id.startsWith('gemini-')).length;
  const codingCount = models.filter((m) => m.isCodeSuited).length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 select-none text-slate-200">
      {/* Auto Smart Router Featured Banner */}
      <div
        onClick={() => onSelectModel('auto-smart')}
        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
          selectedModel === 'auto-smart'
            ? 'bg-gradient-to-r from-primary/20 via-cyan/20 to-emerald/20 border-cyan shadow-lg shadow-cyan/15'
            : 'bg-surface-subtle/80 border-surface-border hover:border-slate-500'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan/20 text-cyan">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⚡ Auto Smart Priority Router</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan/20 text-cyan font-bold">
                  RECOMMENDED
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Autonomous capability analyzer & geometric task matcher
              </div>
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedModel === 'auto-smart'
                ? 'bg-cyan text-slate-950 shadow'
                : 'bg-surface text-slate-300 border border-surface-border'
            }`}
          >
            {selectedModel === 'auto-smart' ? 'Active Router' : 'Enable Auto'}
          </div>
        </div>
        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
          Analyzes each prompt's complexity and automatically routes to the best model across Google Free Tier & OpenRouter, injecting task-tailored OpenCASCADE directives.
        </p>
      </div>

      {/* Search & Refresh Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI models (e.g. Free, Qwen, Coder, Claude)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan"
          />
        </div>

        <button
          type="button"
          onClick={loadModels}
          disabled={isLoading}
          title="Refresh Live OpenRouter Catalog"
          className="p-2 rounded-xl bg-surface-subtle hover:bg-slate-700 border border-surface-border text-slate-300 hover:text-white transition-all shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan' : ''}`} />
        </button>
      </div>

      {/* Filter Categories Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterCategory('free')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            filterCategory === 'free'
              ? 'bg-cyan text-slate-950 font-bold shadow-md'
              : 'bg-surface-subtle text-slate-300 hover:bg-slate-800 hover:text-white border border-surface-border/60'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Free Models ({freeCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('coding')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            filterCategory === 'coding'
              ? 'bg-primary text-white font-bold shadow-md'
              : 'bg-surface-subtle text-slate-300 hover:bg-slate-800 hover:text-white border border-surface-border/60'
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>Code Specialists ({codingCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('reasoning')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            filterCategory === 'reasoning'
              ? 'bg-purple-600 text-white font-bold shadow-md'
              : 'bg-surface-subtle text-slate-300 hover:bg-slate-800 hover:text-white border border-surface-border/60'
          }`}
        >
          <Brain className="w-3 h-3" />
          <span>Reasoning</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('priority_matrix')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            filterCategory === 'priority_matrix'
              ? 'bg-emerald text-slate-950 font-bold shadow-md'
              : 'bg-surface-subtle text-slate-300 hover:bg-slate-800 hover:text-white border border-surface-border/60'
          }`}
        >
          <Trophy className="w-3 h-3" />
          <span>Priority Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            filterCategory === 'all'
              ? 'bg-slate-200 text-slate-900 font-bold shadow-md'
              : 'bg-surface-subtle text-slate-300 hover:bg-slate-800 hover:text-white border border-surface-border/60'
          }`}
        >
          <span>All ({models.length})</span>
        </button>
      </div>

      {/* Priority & Capabilities Matrix View */}
      {filterCategory === 'priority_matrix' ? (
        <div className="space-y-3">
          <div className="p-3 bg-surface-subtle/50 rounded-xl border border-surface-border text-xs text-slate-300">
            <span className="font-bold text-white">Autonomous Priority Ranking:</span> The table below outlines how the model router scores and selects models for specific CAD geometric tasks.
          </div>

          <div className="space-y-2">
            {MODEL_CAPABILITY_PROFILES.map((p) => {
              const isSelected = selectedModel === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary shadow-md'
                      : 'bg-surface-subtle/70 border-surface-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono w-5 h-5 rounded-full bg-surface border border-surface-border flex items-center justify-center font-bold text-primary-glow">
                        #{p.priorityRank}
                      </span>
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      {p.isFree && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan/20 text-cyan font-bold">
                          FREE
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectModel(p.id)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-all ${
                        isSelected
                          ? 'bg-emerald text-slate-950'
                          : 'bg-surface hover:bg-surface-subtle text-slate-300'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Select'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {p.isReasoningSpecialist && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        REASONING ONLY
                      </span>
                    )}
                    {p.isCodeSpecialist && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary-glow font-bold border border-primary/30">
                        CODE SPECIALIST
                      </span>
                    )}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-300">
                      Speed: {p.speedScore}/10
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    <span className="font-semibold text-slate-300">Task Modes: </span>
                    {p.allowedModes.map((m) => m.replace('_', ' ')).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standard Model Cards List */
        <div className="space-y-2.5">
          {filteredModels.length === 0 ? (
            <div className="p-8 text-center bg-surface-subtle/30 rounded-xl border border-dashed border-surface-border text-slate-400 text-xs">
              No models found matching your search and filter criteria.
            </div>
          ) : (
            filteredModels.map((m) => {
              const isSelected = selectedModel === m.id;
              const isFree = m.isFree || m.id.endsWith(':free') || m.id.startsWith('gemini-');

              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-primary/15 border-primary shadow-md shadow-primary/10'
                      : 'bg-surface-subtle/70 border-surface-border hover:border-slate-500'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white leading-tight">{m.name}</h4>
                        {isFree && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan/20 text-cyan font-bold border border-cyan/40">
                            FREE
                          </span>
                        )}
                        {m.isCodeSuited && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary-glow font-bold border border-primary/30">
                            CAD / CODE
                          </span>
                        )}
                        {m.isReasoning && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            REASONING
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{m.id}</div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface text-slate-300 border border-surface-border shrink-0">
                      {m.provider === 'gemini' ? 'Google' : 'OpenRouter'}
                    </span>
                  </div>

                  {/* Description */}
                  {m.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  )}

                  {/* Footer specs & Select Button */}
                  <div className="pt-2 border-t border-surface-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      {m.contextLength && (
                        <span>Context: {Math.round(m.contextLength / 1000)}k</span>
                      )}
                      {m.provider === 'openrouter' && (
                        <a
                          href={`https://openrouter.ai/${m.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-white flex items-center gap-0.5"
                          title="View OpenRouter Model Details"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectModel(m.id, m)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald text-slate-950 shadow'
                          : 'bg-primary hover:bg-primary-hover text-white shadow-sm'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Model</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Select Model</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
