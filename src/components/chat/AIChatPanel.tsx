import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Cpu,
  Zap,
  Key,
  Wand2,
  Code2,
  ChevronDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Maximize2,
  Minimize2,
  Info,
  Layers,
  Flame,
  Brain,
  Search,
  HelpCircle,
  Sliders,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import {
  DEFAULT_MODELS,
  AIModelOption,
  AIPingLocation,
  APIKeyEntry,
  ThoughtBlock,
  ClarificationQuestion,
  ToolCallEvent,
} from '../../services/aiService';
import { RoutingDecision, TaskMode } from '../../services/modelRouter';
import { CADPreset } from '../../cad/presets';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  routingDecision?: RoutingDecision;
  steps?: string[];
  pings?: AIPingLocation[];
  codeSnippet?: string;
  isError?: boolean;
  errorMessage?: string;
  usedKeyLabel?: string;
  thought?: ThoughtBlock;
  toolCalls?: ToolCallEvent[];
  clarification?: ClarificationQuestion;
  paramsSummary?: Record<string, number>;
}

interface AIChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, modelId: string) => Promise<void>;
  isGenerating: boolean;
  currentStep: string;
  activePings: AIPingLocation[];
  keyPool: APIKeyEntry[];
  selectedModel: string;
  onSelectModel: (modelId: string, modelObj?: AIModelOption) => void;
  availableModels?: AIModelOption[];
  onOpenBYOKTab: () => void;
  onOpenFreeModelsTab: () => void;
  onSelectPreset?: (preset: CADPreset) => void;
  onClearChat: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  currentStep,
  activePings,
  keyPool = [],
  selectedModel,
  onSelectModel,
  availableModels = DEFAULT_MODELS,
  onOpenBYOKTab,
  onOpenFreeModelsTab,
  onClearChat,
  isOpen,
  onToggleOpen,
}) => {
  const [prompt, setPrompt] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages or progress updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStep, isGenerating]);

  // Handle prompt submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;

    onSendMessage(trimmed, selectedModel);
    setPrompt('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Adjust textarea height on input
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const activeModelObj =
    availableModels.find((m) => m.id === selectedModel) ||
    DEFAULT_MODELS.find((m) => m.id === selectedModel) ||
    DEFAULT_MODELS[0];

  const isAutoRouting = selectedModel === 'auto-smart' || selectedModel === 'auto';
  const hasGeminiKey = keyPool.some((k) => k.provider === 'gemini' && k.isActive);
  const hasOpenRouterKey = keyPool.some((k) => k.provider === 'openrouter' && k.isActive);
  const hasAnyActiveKey = hasGeminiKey || hasOpenRouterKey;

  const hasActiveKeyForProvider = isAutoRouting
    ? hasAnyActiveKey
    : keyPool.some((k) => k.provider === activeModelObj.provider && k.isActive);

  const quickPrompts = [
    'Add 4 M3 corner mounting holes',
    'Fillet all top edges by 2.5mm',
    'Hollow out center with 3mm wall',
    'Add circular 6-bolt pattern',
    'Create 14-tooth spur gear',
  ];

  if (!isOpen) {
    return (
      <aside aria-label="AI CAD Copilot Panel" className="h-full bg-surface border-l border-surface-border flex flex-col items-center py-3 px-1.5 z-20 shrink-0 select-none">
        <button
          type="button"
          onClick={onToggleOpen}
          title="Open AI Chat Assistant"
          className="w-10 h-10 rounded-xl bg-primary/20 text-primary-glow hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-md"
        >
          <Bot className="w-5 h-5" />
        </button>
        <span className="text-[10px] font-mono text-slate-400 [writing-mode:vertical-lr] mt-4 tracking-widest uppercase">
          AI Chat
        </span>
      </aside>
    );
  }

  return (
    <aside aria-label="AI CAD Copilot Panel" className="w-[380px] lg:w-[420px] h-full bg-surface border-l border-surface-border flex flex-col z-20 shrink-0 shadow-2xl select-none animate-in slide-in-from-right duration-200">
      {/* 1. Header Bar */}
      <div className="px-4 py-3 border-b border-surface-border bg-surface-subtle/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-primary to-cyan flex items-center justify-center shadow-md shadow-primary/20 text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-wide">AI CAD Copilot</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald/20 text-emerald-glow font-bold border border-emerald/30">
                100% Free
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Autonomous Geometric Synthesis
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              title="Clear Chat History"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-surface-subtle rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleOpen}
            title="Collapse AI Chat Panel"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-subtle rounded-lg transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Model Selector Toolbar */}
      <div className="px-3.5 py-2 border-b border-surface-border/60 bg-surface/80 flex items-center justify-between text-xs shrink-0">
        {/* Model Dropdown Trigger */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-surface-subtle border border-surface-border hover:border-slate-500 text-slate-200 hover:text-white transition-all text-left text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <Cpu className="w-3.5 h-3.5 text-cyan" />
              <span className="truncate font-medium">{activeModelObj.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Dropdown Menu */}
          {showModelPicker && (
            <div className="absolute top-full left-0 mt-1.5 w-full rounded-xl bg-surface border border-surface-border shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-surface-border/50 mb-1">
                <span>Model Selector</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowModelPicker(false);
                    onOpenFreeModelsTab();
                  }}
                  className="text-cyan-glow hover:underline text-[10px] font-sans"
                >
                  Browse Hub
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {availableModels.map((m) => {
                  const isSelected = m.id === selectedModel;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m.id, m);
                        setShowModelPicker(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                        isSelected
                          ? 'bg-primary text-white font-semibold'
                          : 'text-slate-300 hover:bg-surface-subtle hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col truncate pr-1">
                        <span className="truncate">{m.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {m.id === 'auto-smart'
                            ? 'Auto Intent Router'
                            : m.provider === 'gemini'
                            ? 'Google Free Tier'
                            : 'OpenRouter Free'}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-surface text-slate-400'
                        }`}
                      >
                        {m.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BYOK Status Shortcut */}
        <div className="ml-2">
          <button
            type="button"
            onClick={onOpenBYOKTab}
            className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
              hasActiveKeyForProvider
                ? 'bg-emerald/10 text-emerald border-emerald/30 hover:bg-emerald/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            {hasActiveKeyForProvider ? 'BYOK Active' : 'Set Key'}
          </button>
        </div>
      </div>

      {/* 3. Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {/* Welcome message if chat is empty */}
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-surface-subtle/80 to-surface-subtle/40 border border-surface-border text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan/10 text-cyan border border-cyan/30 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Welcome to HaiCAD Studio</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe any 3D mechanical component or parametric modification in plain English.
                The autonomous engine selects the optimal 100% free model and renders exact OpenCASCADE B-Rep solid geometry with live spatial radar pings.
              </p>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-primary-glow" /> Try Prompting:
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(qp);
                      textareaRef.current?.focus();
                    }}
                    className="p-2.5 rounded-xl bg-surface-subtle/60 hover:bg-surface-subtle border border-surface-border hover:border-cyan/40 text-left text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span className="truncate">{qp}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Message Bubbles */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Label & Timestamp */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 px-1">
                {isUser ? (
                  <>
                    <span>You</span>
                    <User className="w-3 h-3 text-primary-glow" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-cyan" />
                    <span>HaiCAD Copilot</span>
                  </>
                )}
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Bubble Body */}
              <div
                className={`max-w-[95%] p-3.5 rounded-2xl border leading-relaxed space-y-2.5 ${
                  isUser
                    ? 'bg-primary/20 border-primary/40 text-slate-100 rounded-tr-sm shadow-md'
                    : msg.isError
                    ? 'bg-red-950/40 border-red-500/40 text-red-200 rounded-tl-sm'
                    : 'bg-surface-subtle border-surface-border text-slate-200 rounded-tl-sm shadow-md'
                }`}
              >
                {/* Content Text */}
                <p className="text-xs whitespace-pre-wrap">{msg.content}</p>

                {/* Tool Call Activity Cards (WebSearch, Grounding, Kernel) */}
                {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {msg.toolCalls.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        className="p-2.5 rounded-xl bg-background/90 border border-cyan/30 text-slate-300 space-y-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-cyan font-bold">
                          <span className="flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-cyan" />
                            ● {tc.toolName}("{tc.query}")
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan/10 text-cyan-glow border border-cyan/20">
                            Live Tool
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 pl-3.5 border-l-2 border-cyan/40 leading-relaxed">
                          ⎿ {tc.outputSummary}
                        </div>
                        {tc.sourceUrl && (
                          <div className="pl-3.5">
                            <a
                              href={tc.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] text-primary-glow hover:underline flex items-center gap-1"
                            >
                              <span>{tc.sourceUrl}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Collapsible Thought / Reasoning Stream Block */}
                {!isUser && msg.thought && (
                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => toggleThought(msg.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-purple-300 hover:text-white bg-purple-950/30 font-mono text-[10px] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-bold">
                          ▾ Thought for {msg.thought.durationSeconds}s ({msg.thought.tokenCount} tokens)
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-200 ${
                          expandedThoughts[msg.id] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedThoughts[msg.id] && (
                      <div className="p-3 text-[10px] font-mono text-purple-200/90 whitespace-pre-wrap bg-background/90 border-t border-purple-500/20 leading-relaxed max-h-52 overflow-y-auto">
                        {msg.thought.content}
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Clarification Card (Ask If in Doubt) */}
                {!isUser && msg.clarification && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-[11px]">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{msg.clarification.question}</span>
                    </div>
                    {msg.clarification.explanation && (
                      <p className="text-slate-300 text-[10px]">{msg.clarification.explanation}</p>
                    )}
                    {msg.clarification.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.clarification.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => onSendMessage(opt, selectedModel)}
                            className="px-2.5 py-1 rounded-lg bg-surface border border-amber-500/40 text-amber-200 hover:bg-amber-500/20 hover:text-white text-[11px] font-mono transition-all shadow-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Parametric Drivers (PARAMS) Table */}
                {!isUser && msg.paramsSummary && Object.keys(msg.paramsSummary).length > 0 && (
                  <div className="p-2.5 rounded-xl bg-background/80 border border-surface-border font-mono text-[10px] space-y-1.5">
                    <div className="text-[10px] uppercase text-slate-400 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-cyan" />
                        Design Drivers (PARAMS)
                      </span>
                      <span className="text-[9px] text-slate-500">Auto-extracted</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      {Object.entries(msg.paramsSummary).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between px-2 py-1 rounded bg-surface border border-surface-border/50 text-[10px]"
                        >
                          <span className="text-slate-400 truncate">{k}:</span>
                          <span className="text-cyan font-bold">{v}mm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant Metadata: Autonomous Routing Badge */}
                {!isUser && msg.routingDecision && (
                  <div className="p-2 rounded-xl bg-background/80 border border-surface-border/70 space-y-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {msg.routingDecision.modelName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald/20 text-emerald-glow font-bold">
                        100% Free Tier
                      </span>
                    </div>
                    <div className="text-slate-400 text-[9px] leading-tight">
                      {msg.routingDecision.reason}
                    </div>
                  </div>
                )}

                {/* Human-Readable Steps List */}
                {!isUser && msg.steps && msg.steps.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-surface-border/40">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan" /> Operations Executed:
                    </span>
                    <div className="space-y-1">
                      {msg.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spatial Radar Pings Badges */}
                {!isUser && msg.pings && msg.pings.length > 0 && (
                  <div className="pt-1 border-t border-surface-border/40 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-cyan font-bold block">
                      Spatial Radar Beacons:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {msg.pings.map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan/10 text-cyan-glow border border-cyan/30 flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{p.name} [{p.position.map((c) => c.toFixed(0)).join(',')}]</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Snippet Preview & Copy */}
                {!isUser && msg.codeSnippet && (
                  <div className="pt-1.5 border-t border-surface-border/40 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Replicad Solid Compiled</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(msg.id, msg.codeSnippet || '')}
                      className="text-primary-glow hover:underline flex items-center gap-1 text-[10px]"
                    >
                      {copiedCodeId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JS Script</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Error Box */}
                {msg.isError && msg.errorMessage && (
                  <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/30 font-mono text-[10px] text-red-300 whitespace-pre-wrap">
                    {msg.errorMessage}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Generation Progress Card in Feed */}
        {isGenerating && (
          <div className="p-3.5 rounded-2xl bg-cyan/5 border border-cyan/30 space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                <span className="text-xs font-mono font-bold text-cyan-glow">
                  {currentStep || 'Synthesizing parametric CAD solid...'}
                </span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan/20 text-cyan">
                Live OpenCASCADE
              </span>
            </div>

            {activePings.length > 0 && (
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan" />
                <span>Spatial Focus: {activePings[activePings.length - 1].name}</span>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Input & Quick Suggestion Bar */}
      <div className="p-3 border-t border-surface-border bg-surface-subtle/50 space-y-2 shrink-0">
        {/* Quick Suggestion Chips (when idle) */}
        {!isGenerating && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-0.5">
              <Wand2 className="w-3 h-3 text-primary-glow" /> Quick:
            </span>
            {quickPrompts.slice(0, 3).map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(qp);
                  textareaRef.current?.focus();
                }}
                className="px-2 py-0.5 rounded-md bg-surface-subtle hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-surface-border/60 shrink-0 transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>
        )}

        {/* Input Box Form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative rounded-xl bg-background border border-surface-border focus-within:border-cyan transition-colors overflow-hidden">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              rows={1}
              placeholder={
                isGenerating
                  ? 'HaiCAD is generating your 3D model...'
                  : !hasActiveKeyForProvider
                  ? 'Add your free OpenRouter or Gemini key in BYOK...'
                  : 'Describe CAD changes (e.g. "Add 4 M4 holes")...'
              }
              className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-28"
            />
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              prompt.trim() && !isGenerating
                ? 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/30'
                : 'bg-surface-subtle text-slate-500 cursor-not-allowed border border-surface-border'
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Bottom Helper text */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
          <span>Enter to send • Shift+Enter for newline</span>
          <span className="text-cyan-glow">100% Free AI Engine</span>
        </div>
      </div>
    </aside>
  );
};
