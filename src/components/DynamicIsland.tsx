import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  Wand2,
  Cpu,
  CornerDownLeft,
  XCircle,
  Zap,
  Key,
  ExternalLink,
} from 'lucide-react';
import { DEFAULT_MODELS, AIModelOption, AIPingLocation, APIKeyEntry } from '../services/aiService';
import { CADPreset } from '../cad/presets';

interface DynamicIslandProps {
  onGenerate: (prompt: string, model: string) => Promise<void>;
  isGenerating: boolean;
  currentStep: string;
  activePings: AIPingLocation[];
  onOpenSettings?: () => void;
  onOpenBYOKTab?: () => void;
  onOpenFreeModelsTab?: () => void;
  keyPool?: APIKeyEntry[];
  selectedModel: string;
  onSelectModel: (modelId: string, modelObj?: AIModelOption) => void;
  availableModels?: AIModelOption[];
  onSelectPreset?: (preset: CADPreset) => void;
  lastUsedKeyLabel?: string;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  onGenerate,
  isGenerating,
  currentStep,
  activePings,
  onOpenSettings,
  onOpenBYOKTab,
  onOpenFreeModelsTab,
  keyPool = [],
  selectedModel,
  onSelectModel,
  availableModels = DEFAULT_MODELS,
  lastUsedKeyLabel,
}) => {
  const [prompt, setPrompt] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);

  const activeModelObj =
    availableModels.find((m) => m.id === selectedModel) ||
    DEFAULT_MODELS.find((m) => m.id === selectedModel) ||
    DEFAULT_MODELS[0];

  const provider = activeModelObj.provider;
  const hasActiveKeyForProvider = keyPool.some((k) => k.provider === provider && k.isActive);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Check if key is available
    if (!hasActiveKeyForProvider) {
      if (onOpenBYOKTab) {
        onOpenBYOKTab();
      } else if (onOpenSettings) {
        onOpenSettings();
      }
      return;
    }

    onGenerate(prompt.trim(), selectedModel);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    'Add 4 M3 corner mounting holes',
    'Fillet all top edges by 2.5mm',
    'Hollow out center with 3mm wall thickness',
    'Add circular 6-bolt pattern',
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30 pointer-events-auto">
      {/* Floating Dynamic Island Container */}
      <div
        className={`relative w-full rounded-2xl bg-surface/90 border transition-all duration-300 backdrop-blur-xl shadow-island ${
          isGenerating
            ? 'border-cyan/50 shadow-island-active bg-surface/95'
            : 'border-surface-border/80 hover:border-slate-600'
        }`}
      >
        {/* Top Status Banner when Generating / Emitting Pings */}
        {isGenerating && (
          <div className="px-4 py-2.5 border-b border-surface-border/50 flex items-center justify-between bg-cyan/5 rounded-t-2xl">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                <span className="absolute w-2 h-2 rounded-full bg-cyan animate-ping opacity-75" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-semibold text-cyan-glow truncate">
                  {currentStep || 'Generating parametric geometry...'}
                </span>
                {activePings.length > 0 && (
                  <span className="text-[10px] text-slate-400">
                    Live Spatial Focus: {activePings[activePings.length - 1].name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/20">
              <Zap className="w-3 h-3 text-cyan" />
              <span className="text-[10px] font-mono text-cyan uppercase font-bold tracking-wider">
                Live Dynamic CAD
              </span>
            </div>
          </div>
        )}

        {/* Main Input Form */}
        <form onSubmit={handleSubmit} className="p-2.5 flex items-center gap-2">
          {/* Model Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-all shrink-0"
            >
              <Cpu className="w-3.5 h-3.5 text-primary-glow" />
              <span className="max-w-[120px] truncate">{activeModelObj.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Model Dropdown Menu */}
            {showModelPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-surface border border-surface-border shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-surface-border/50 mb-1">
                  <span>Procedural Model Selector</span>
                  {onOpenFreeModelsTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowModelPicker(false);
                        onOpenFreeModelsTab();
                      }}
                      className="text-cyan-glow hover:underline text-[10px] font-sans font-normal"
                    >
                      Browse All Hub
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {availableModels.map((m) => {
                    const isFree = m.isFree || m.id.endsWith(':free');
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
                        <div className="flex flex-col truncate pr-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate">{m.name}</span>
                            {isFree && (
                              <span className="text-[9px] px-1 py-0.2 bg-cyan/20 text-cyan rounded font-mono font-bold">
                                Free
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            {m.provider === 'gemini' ? 'Google' : 'OpenRouter'}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-subtle text-slate-400'
                          }`}
                        >
                          {m.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Hub Actions */}
                <div className="pt-1.5 mt-1.5 border-t border-surface-border/50 flex items-center justify-between text-[11px] px-1 text-slate-400">
                  {onOpenBYOKTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowModelPicker(false);
                        onOpenBYOKTab();
                      }}
                      className="hover:text-white flex items-center gap-1"
                    >
                      <Key className="w-3 h-3 text-primary-glow" /> Manage Keys Vault
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder={
                isGenerating
                  ? 'HaiCAD is generating your 3D model...'
                  : !hasActiveKeyForProvider
                  ? `Click to configure ${activeModelObj.provider === 'gemini' ? 'Gemini' : 'OpenRouter'} key in BYOK...`
                  : 'Describe your CAD part or change (e.g., "Add 4 M4 screw holes on corners")...'
              }
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Action / Submit Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${
              prompt.trim() && !isGenerating
                ? 'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-primary/30'
                : 'bg-surface-subtle text-slate-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips (when idle) */}
        {!isGenerating && (
          <div className="px-3 pb-2.5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
                <Wand2 className="w-3 h-3 text-primary-glow" /> Quick:
              </span>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(qp);
                  }}
                  className="px-2 py-0.5 rounded-md bg-surface-subtle/80 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-surface-border/50 shrink-0 transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Active Key Status Pill */}
            <div className="shrink-0 pl-2">
              <span
                onClick={onOpenBYOKTab}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                  hasActiveKeyForProvider
                    ? 'bg-emerald/10 text-emerald-glow border-emerald/30 hover:bg-emerald/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
                }`}
                title={hasActiveKeyForProvider ? 'Click to manage BYOK Key Pool' : 'No active key! Click to add in BYOK'}
              >
                {hasActiveKeyForProvider ? `BYOK Ready` : `Add Key`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
