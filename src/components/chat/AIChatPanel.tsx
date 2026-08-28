import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Sliders,
  Download,
  AlertTriangle,
  Key,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  Cpu,
} from 'lucide-react';
import { CadPhase, VerificationAction } from '../../types/aiCadTypes';
import { useAiCad } from '../../hooks/useAiCad';
import { FREE_MODELS_PRESETS } from '../../services/openRouterService';

interface AIChatPanelProps {
  aiCad: ReturnType<typeof useAiCad>;
  onApplyCodeToIde?: (code: string) => void;
}

const PHASES: Array<{ id: CadPhase; label: string; number: number }> = [
  { id: 'planning', label: 'Planning', number: 1 },
  { id: 'base', label: 'Base', number: 2 },
  { id: 'cutouts', label: 'Cutouts', number: 3 },
  { id: 'features', label: 'Features', number: 4 },
  { id: 'finalizing', label: 'Finalize', number: 5 },
  { id: 'export', label: 'Export', number: 6 },
];

/**
 * Custom Markdown Code Block with Copy Button
 */
const CodeBlock: React.FC<{
  language?: string;
  value: string;
}> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-surface-border bg-[#141820] text-xs font-mono select-text shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-subtle/80 border-b border-surface-border text-slate-400 text-[10px]">
        <span className="font-semibold text-cyan uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface text-slate-300 hover:text-white transition-colors"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald" />
              <span className="text-emerald text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] text-slate-200 leading-relaxed font-mono">
        <code>{value}</code>
      </pre>
    </div>
  );
};

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ aiCad }) => {
  const {
    phase,
    designParams,
    messages,
    isLoading,
    isCorrecting,
    retryCount,
    needsVerification,
    apiKey,
    model,
    sendMessage,
    verifyStep,
    setApiKey,
    setModel,
    resetSession,
    exportModel,
  } = aiCad;

  const [input, setInput] = useState('');
  const [modifyNote, setModifyNote] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(!apiKey);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempModel, setTempModel] = useState(model || 'inclusionai/ling-3.0-flash-fin:free');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isCorrecting]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(tempApiKey);
    if (tempModel.trim()) {
      setModel(tempModel.trim());
    }
    setShowKeyModal(false);
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleExport = async (format: 'step' | 'stl') => {
    const res = await exportModel(format);
    if (res?.blob) {
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const activePhaseIndex = PHASES.findIndex((p) => p.id === phase);

  return (
    <div className="flex flex-col h-full bg-surface select-text relative overflow-hidden">
      {/* 1. API Key & Model Config Modal */}
      {showKeyModal && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface border border-surface-border rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-cyan">
              <Key className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">OpenRouter Settings</h3>
            </div>
            <p className="text-xs text-slate-400">
              HaiCAD connects directly to OpenRouter. Autonomous fallback will cycle down the free model queue if one fails.
            </p>
            <form onSubmit={handleSaveKey} className="flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">API Key</label>
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Active Model</label>
                <input
                  type="text"
                  placeholder="inclusionai/ling-3.0-flash-fin:free"
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan font-mono"
                />
                <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto no-scrollbar">
                  {FREE_MODELS_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTempModel(m)}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                        tempModel === m
                          ? 'bg-cyan/20 border-cyan text-cyan'
                          : 'bg-surface border-surface-border text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.split('/')[1]?.replace(':free', '') || m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!tempApiKey.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-cyan hover:bg-cyan-hover text-black shadow-md shadow-cyan/20 transition-all disabled:opacity-50"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Top Phase Pipeline Bar */}
      <div className="px-3 py-2.5 bg-surface-subtle/70 border-b border-surface-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {PHASES.map((p, idx) => {
            const isCurrent = p.id === phase;
            const isCompleted = idx < activePhaseIndex;
            return (
              <div key={p.id} className="flex items-center gap-1 shrink-0">
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    isCurrent
                      ? 'bg-cyan text-black shadow-sm font-bold'
                      : isCompleted
                      ? 'bg-emerald/20 text-emerald border border-emerald/30'
                      : 'bg-surface border border-surface-border text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  ) : (
                    <span>{p.number}</span>
                  )}
                  <span>{p.label}</span>
                </div>
                {idx < PHASES.length - 1 && (
                  <ChevronRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            title={`Active Model: ${model}`}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-white hover:bg-surface rounded-lg transition-colors text-[10px] font-mono border border-surface-border/60"
          >
            <Cpu className="w-3 h-3 text-cyan" />
            <span className="max-w-[70px] truncate">{model.split('/')[1]?.replace(':free', '') || 'Model'}</span>
          </button>
          <button
            type="button"
            onClick={resetSession}
            title="Reset Design Loop"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-surface rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Parameter Quick Chips */}
      {designParams?.dimensions && Object.keys(designParams.dimensions).length > 0 && (
        <div className="px-3 py-1.5 bg-surface-subtle/30 border-b border-surface-border flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-[11px] font-mono">
          <span className="text-slate-500 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan" /> Params:
          </span>
          {Object.entries(designParams.dimensions).map(([k, v]) => (
            <span
              key={k}
              className="px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-300 text-[10px]"
            >
              {k}: <strong className="text-cyan">{v}mm</strong>
            </span>
          ))}
        </div>
      )}

      {/* 4. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan mb-3 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Agentic CAD Designer</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Describe what you want to create (e.g. <em>"Make a 3x3 macropad case"</em> or <em>"Custom mounting flange"</em>). The agent will remember context, generate step-by-step solids, and self-correct runtime errors.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['3x3 Macropad with Cherry MX switches', 'L-Bracket 60x40x10 with 4 holes', 'Filleted NEMA 17 motor mount'].map(
                (prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-slate-300 hover:text-white transition-all text-left"
                  >
                    {prompt}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCorrection = msg.role === 'ai-correction';

          if (isCorrection) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 font-mono animate-in fade-in select-text"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300">
                      {msg.correctionAttempt ? `Self-Correction (Attempt ${msg.correctionAttempt}/3)` : 'Model Routing Alert'}
                    </span>
                    {msg.modelUsed && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/50 text-amber-300 border border-amber-500/30">
                        {msg.modelUsed.split('/')[1] || msg.modelUsed}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-amber-200/80">{msg.content || msg.error}</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-150 group`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-primary text-white'
                    : 'bg-cyan/20 border border-cyan/30 text-cyan'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs select-text relative ${
                  isUser
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-surface-subtle border border-surface-border text-slate-200 rounded-tl-sm'
                }`}
              >
                {/* Message Header Bar for Assistant: Model Badge + Copy Button */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-border/60 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Cpu className="w-3 h-3 text-cyan" />
                      <span className="text-cyan font-medium">
                        {msg.modelUsed ? msg.modelUsed.split('/')[1]?.replace(':free', '') : model.split('/')[1]?.replace(':free', '')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface text-slate-400 hover:text-white transition-colors"
                      title="Copy response text"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald" />
                          <span className="text-emerald text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Rich Markdown Body */}
                <div className="markdown-content text-xs text-slate-200 leading-relaxed break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        return !inline ? (
                          <CodeBlock language={match ? match[1] : ''} value={codeString} />
                        ) : (
                          <code
                            className="px-1.5 py-0.5 rounded bg-surface border border-surface-border text-cyan font-mono text-[11px]"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      h1: ({ children }) => <h1 className="text-sm font-bold text-white mt-2 mb-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xs font-bold text-white mt-2 mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-semibold text-cyan mt-1.5 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5 text-slate-300">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5 text-slate-300">{children}</ol>,
                      li: ({ children }) => <li className="leading-snug">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-cyan/50 pl-2.5 my-1.5 italic text-slate-400 bg-cyan/5 py-1 rounded-r">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2 rounded border border-surface-border">
                          <table className="min-w-full text-[11px] divide-y divide-surface-border">{children}</table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="px-2.5 py-1 bg-surface-subtle text-left font-semibold text-slate-300">{children}</th>
                      ),
                      td: ({ children }) => <td className="px-2.5 py-1 border-t border-surface-border">{children}</td>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Suggested options / pills */}
                {msg.suggestedOptions && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-surface-border/50">
                    {msg.suggestedOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => sendMessage(opt)}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-cyan text-cyan text-[11px] font-medium transition-all hover:bg-surface-subtle"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-2 bg-surface-subtle/50 rounded-xl border border-surface-border/50 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan" />
            <span>{isCorrecting ? `Self-correcting CAD error (Attempt ${retryCount}/3)...` : 'HaiCAD AI is drafting procedural geometry...'}</span>
          </div>
        )}

        {/* 5. Verification Gate Card */}
        {needsVerification && (
          <div className="p-4 rounded-2xl bg-cyan/5 border-2 border-cyan/40 shadow-lg space-y-3 animate-in zoom-in-95 select-text">
            <div className="flex items-center gap-2 text-cyan font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>STEP VERIFICATION REQUIRED</span>
            </div>
            <p className="text-xs text-slate-300">
              The 3D solid for <strong className="text-white uppercase">{phase}</strong> has compiled successfully in your viewport. Inspect the geometry and choose an action:
            </p>

            {isModifying ? (
              <div className="space-y-2">
                <textarea
                  placeholder="Describe adjustments (e.g. increase hole radius to 4mm, make wall 3mm thicker)..."
                  value={modifyNote}
                  onChange={(e) => setModifyNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan resize-none h-16"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModifying(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModifying(false);
                      verifyStep('Modify', modifyNote);
                      setModifyNote('');
                    }}
                    disabled={!modifyNote.trim()}
                    className="px-3 py-1 rounded-lg bg-cyan text-black font-semibold text-xs disabled:opacity-50"
                  >
                    Submit Modifications
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => verifyStep('Yes')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald hover:bg-emerald/90 text-white font-bold text-xs shadow-md shadow-emerald/20 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Yes (Proceed)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModifying(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-white text-xs font-semibold transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan" />
                  <span>Modify</span>
                </button>
                <button
                  type="button"
                  onClick={() => verifyStep('No')}
                  className="flex items-center justify-center p-2 rounded-xl bg-surface-subtle hover:bg-red-500/20 border border-surface-border hover:border-red-500/40 text-red-400 transition-all"
                  title="Regenerate step"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. Export Phase Action Card */}
        {phase === 'export' && (
          <div className="p-4 rounded-2xl bg-emerald/10 border border-emerald/30 space-y-3 animate-in fade-in select-text">
            <div className="flex items-center gap-2 text-emerald font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>CAD MODEL READY FOR EXPORT</span>
            </div>
            <p className="text-xs text-slate-300">
              Download your verified parametric B-Rep solid or 3D printing mesh:
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport('step')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan hover:bg-cyan-hover text-black font-bold text-xs shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>STEP (.step)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('stl')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-white font-semibold text-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald" />
                <span>STL (.stl)</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 7. Bottom Input Bar */}
      <div className="p-3 bg-surface-subtle/80 border-t border-surface-border shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              phase === 'planning'
                ? 'Describe your part, dimensions, or answers...'
                : `Enter instructions or modifications for phase: ${phase}...`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || needsVerification}
            className="flex-1 px-3.5 py-2 text-xs bg-surface border border-surface-border rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || needsVerification}
            className="w-8 h-8 rounded-xl bg-cyan hover:bg-cyan-hover text-black flex items-center justify-center shadow-md shadow-cyan/20 transition-all disabled:opacity-40 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
