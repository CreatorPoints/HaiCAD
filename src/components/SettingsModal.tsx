import React, { useState } from 'react';
import { Key, X, ExternalLink, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiKey: string;
  openrouterKey: string;
  onSaveKeys: (geminiKey: string, openrouterKey: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiKey: initialGeminiKey,
  openrouterKey: initialOpenrouterKey,
  onSaveKeys,
}) => {
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey);
  const [openrouterKey, setOpenrouterKey] = useState(initialOpenrouterKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKeys(geminiKey.trim(), openrouterKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">AI Engine Settings & Keys</h3>
              <p className="text-xs text-slate-400">Client-side Bring-Your-Own-Key (BYOK)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-subtle rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="p-3 bg-surface-subtle/70 rounded-xl border border-surface-border flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Your API keys are stored <strong>strictly inside your browser's localStorage</strong>. They are never sent to any intermediary server and connect directly to Google and OpenRouter APIs.
            </p>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary-glow hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-surface-border text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {/* OpenRouter API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                OpenRouter API Key
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-glow hover:underline flex items-center gap-1"
              >
                <span>Get OpenRouter Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-surface-border text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan font-mono"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition-all"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Keys</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
