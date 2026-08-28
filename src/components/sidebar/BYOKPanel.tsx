import React, { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  ArrowRightLeft,
  Upload,
  Download,
  AlertCircle,
} from 'lucide-react';
import { APIKeyEntry, saveKeyPool, validateAPIKey } from '../../services/aiService';

interface BYOKPanelProps {
  keyPool: APIKeyEntry[];
  onUpdateKeyPool: (newPool: APIKeyEntry[]) => void;
  activeModel?: string;
  onOpenFreeModelsTab?: () => void;
}

export const BYOKPanel: React.FC<BYOKPanelProps> = ({
  keyPool,
  onUpdateKeyPool,
  activeModel = 'auto-smart',
  onOpenFreeModelsTab,
}) => {
  // New Key Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState<'gemini' | 'openrouter'>('gemini');
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Key visibility & copy state
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Toggle show/hide key
  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy key to clipboard
  const handleCopyKey = (id: string, keyValue: string) => {
    navigator.clipboard.writeText(keyValue);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Add new key
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedKey = newKey.trim();
    if (!trimmedKey) {
      setFormError('Please enter a valid API key string.');
      return;
    }

    const trimmedLabel = newLabel.trim() || `${newProvider === 'gemini' ? 'Gemini' : 'OpenRouter'} Key #${keyPool.length + 1}`;

    setIsValidating(true);
    const valResult = await validateAPIKey(newProvider, trimmedKey);
    setIsValidating(false);

    if (!valResult.valid) {
      const confirmAdd = window.confirm(
        `Validation Warning: "${valResult.message}". Do you still want to save this key?`
      );
      if (!confirmAdd) return;
    }

    const newEntry: APIKeyEntry = {
      id: `${newProvider}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: newProvider,
      label: trimmedLabel,
      key: trimmedKey,
      isActive: true,
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      createdAt: Date.now(),
    };

    const updatedPool = [...keyPool, newEntry];
    saveKeyPool(updatedPool);
    onUpdateKeyPool(updatedPool);

    setNewLabel('');
    setNewKey('');
    setShowAddForm(false);
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    const updated = keyPool.map((k) => (k.id === id ? { ...k, isActive: !k.isActive } : k));
    saveKeyPool(updated);
    onUpdateKeyPool(updated);
  };

  // Delete key
  const handleDeleteKey = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this API key from the local vault?')) return;
    const updated = keyPool.filter((k) => k.id !== id);
    saveKeyPool(updated);
    onUpdateKeyPool(updated);
  };

  // Reset all rate-limit flags
  const handleResetRateLimits = () => {
    const updated = keyPool.map((k) => ({
      ...k,
      isRateLimited: false,
      rateLimitedUntil: undefined,
      lastError: undefined,
    }));
    saveKeyPool(updated);
    onUpdateKeyPool(updated);
    alert('All key rate-limit cooldowns have been reset.');
  };

  // Test single key
  const handleTestKey = async (entry: APIKeyEntry) => {
    setTestingKeyId(entry.id);
    setTestResult(null);
    const res = await validateAPIKey(entry.provider, entry.key);
    setTestingKeyId(null);
    setTestResult({
      id: entry.id,
      success: res.valid,
      message: res.message,
    });
    setTimeout(() => {
      setTestResult((current) => (current?.id === entry.id ? null : current));
    }, 4000);
  };

  // Export keys backup
  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(keyPool, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haicad_byok_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import keys backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const merged = [...keyPool];
          parsed.forEach((imported: any) => {
            if (imported.key && imported.provider && !merged.some((m) => m.key === imported.key)) {
              merged.push({
                ...imported,
                id: imported.id || 'imported_' + Math.random().toString(36).substring(2, 7),
              });
            }
          });
          saveKeyPool(merged);
          onUpdateKeyPool(merged);
          alert(`Successfully imported keys. Total keys in vault: ${merged.length}`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const geminiKeys = keyPool.filter((k) => k.provider === 'gemini');
  const openRouterKeys = keyPool.filter((k) => k.provider === 'openrouter');
  const rateLimitedCount = keyPool.filter((k) => k.isRateLimited && (k.rateLimitedUntil || 0) > Date.now()).length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-5 select-none text-slate-200">
      {/* Intro Banner */}
      <div className="p-3 bg-surface-subtle/50 rounded-xl border border-surface-border flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald mt-0.5 shrink-0" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">Client-Side BYOK Vault:</span> Store any number of Google Gemini & OpenRouter keys.
          HaiCAD automatically failovers and rotates to the next healthy key if a 429 rate limit or quota exhaustion is reached.
        </div>
      </div>

      {/* Quick Summary & Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border text-slate-300">
            {keyPool.length} Key{keyPool.length === 1 ? '' : 's'} Stored
          </span>
          {rateLimitedCount > 0 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {rateLimitedCount} Rate Limited
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cancel' : 'Add API Key'}</span>
        </button>
      </div>

      {/* Add New Key Form Card */}
      {showAddForm && (
        <form onSubmit={handleAddKey} className="p-4 rounded-xl bg-surface-subtle border border-primary/40 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" /> Register New API Key
            </span>
            <div className="flex items-center gap-2">
              <a
                href={newProvider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://openrouter.ai/keys'}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary-glow hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNewProvider('gemini')}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                newProvider === 'gemini'
                  ? 'bg-primary/20 border-primary text-white'
                  : 'bg-background border-surface-border text-slate-400'
              }`}
            >
              Google Gemini
            </button>
            <button
              type="button"
              onClick={() => setNewProvider('openrouter')}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                newProvider === 'openrouter'
                  ? 'bg-cyan/20 border-cyan text-white'
                  : 'bg-background border-surface-border text-slate-400'
              }`}
            >
              OpenRouter
            </button>
          </div>

          {/* Label */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Custom Key Label / Alias
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={newProvider === 'gemini' ? 'e.g. Personal Gemini 2.5 Flash' : 'e.g. OpenRouter Backup #1'}
              className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Key String */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              API Key Secret String
            </label>
            <input
              type="password"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder={newProvider === 'gemini' ? 'AIzaSy...' : 'sk-or-v1-...'}
              className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {formError && (
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
            >
              {isValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isValidating ? 'Validating...' : 'Validate & Save'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Auto-Rotation & Failover Info Badge */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-cyan/10 to-primary/10 border border-cyan/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-cyan" />
          <div className="text-xs">
            <span className="font-bold text-white">Smart Auto-Failover:</span> Active
            <div className="text-[10px] text-slate-400">Rotates keys seamlessly on rate limits (429)</div>
          </div>
        </div>
        {rateLimitedCount > 0 && (
          <button
            type="button"
            onClick={handleResetRateLimits}
            title="Clear all cooldowns"
            className="text-[10px] font-mono px-2 py-1 rounded bg-surface border border-surface-border text-amber-300 hover:text-white transition-colors"
          >
            Reset Cooldowns
          </button>
        )}
      </div>

      {/* Google Gemini Keys Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" /> Google Gemini Keys ({geminiKeys.length})
          </label>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-primary-glow hover:underline flex items-center gap-0.5"
          >
            <span>Get Free Key</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {geminiKeys.length === 0 ? (
          <div className="p-4 rounded-xl bg-surface-subtle/40 border border-dashed border-surface-border text-center text-xs text-slate-400">
            No Gemini keys added yet. Add a free key from Google AI Studio.
          </div>
        ) : (
          <div className="space-y-2">
            {geminiKeys.map((entry) => renderKeyCard(entry))}
          </div>
        )}
      </div>

      {/* OpenRouter Keys Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan" /> OpenRouter Keys ({openRouterKeys.length})
          </label>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-cyan-glow hover:underline flex items-center gap-0.5"
          >
            <span>Get OpenRouter Key</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {openRouterKeys.length === 0 ? (
          <div className="p-4 rounded-xl bg-surface-subtle/40 border border-dashed border-surface-border text-center text-xs text-slate-400">
            No OpenRouter keys added yet. Add your key to unlock Claude, DeepSeek, and free models.
          </div>
        ) : (
          <div className="space-y-2">
            {openRouterKeys.map((entry) => renderKeyCard(entry))}
          </div>
        )}
      </div>

      {/* Backup & Import Options */}
      <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
        <label className="cursor-pointer hover:text-white flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          <span>Import JSON Backup</span>
          <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
        </label>
        <button
          type="button"
          onClick={handleExportBackup}
          disabled={keyPool.length === 0}
          className="hover:text-white flex items-center gap-1.5 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Backup</span>
        </button>
      </div>
    </div>
  );

  function renderKeyCard(entry: APIKeyEntry) {
    const isVisible = Boolean(visibleKeys[entry.id]);
    const isCopied = copiedKeyId === entry.id;
    const isTesting = testingKeyId === entry.id;
    const testResultForThis = testResult?.id === entry.id ? testResult : null;
    const isRateLimited = entry.isRateLimited && (entry.rateLimitedUntil || 0) > Date.now();
    const remainingCooldownSec = isRateLimited
      ? Math.ceil(((entry.rateLimitedUntil || 0) - Date.now()) / 1000)
      : 0;

    const maskedKey = entry.key.length > 10
      ? `${entry.key.substring(0, 7)}...${entry.key.substring(entry.key.length - 4)}`
      : '••••••••••••';

    return (
      <div
        key={entry.id}
        className={`p-3 rounded-xl border transition-all ${
          !entry.isActive
            ? 'bg-surface-subtle/30 border-surface-border opacity-60'
            : isRateLimited
            ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
            : 'bg-surface-subtle/80 border-surface-border hover:border-slate-500'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{entry.label}</span>
            {isRateLimited ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Cooldown ({remainingCooldownSec}s)
              </span>
            ) : entry.isActive ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald/20 text-emerald border border-emerald/30">
                Healthy
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                Disabled
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle Active Button */}
            <button
              type="button"
              onClick={() => handleToggleActive(entry.id)}
              title={entry.isActive ? 'Disable this key' : 'Enable this key'}
              className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                entry.isActive
                  ? 'bg-emerald/20 text-emerald hover:bg-emerald/30'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {entry.isActive ? 'Active' : 'Paused'}
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => handleDeleteKey(entry.id)}
              title="Delete Key"
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-surface-subtle rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Key String Bar */}
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-background border border-surface-border text-xs font-mono text-slate-300 mb-2">
          <span className="truncate max-w-[200px] select-all">
            {isVisible ? entry.key : maskedKey}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              type="button"
              onClick={() => toggleKeyVisibility(entry.id)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => handleCopyKey(entry.id, entry.key)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-surface-border/40">
          <div className="flex items-center gap-3">
            <span>Calls: {entry.totalCalls || 0}</span>
            <span className="text-emerald">✓ {entry.successCalls || 0}</span>
            {entry.failedCalls > 0 && <span className="text-red-400">✗ {entry.failedCalls}</span>}
          </div>

          <button
            type="button"
            onClick={() => handleTestKey(entry)}
            disabled={isTesting}
            className="text-primary-glow hover:underline flex items-center gap-1"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>
        </div>

        {/* Test Result Message */}
        {testResultForThis && (
          <div
            className={`mt-2 p-1.5 rounded text-[11px] font-sans flex items-center gap-1.5 ${
              testResultForThis.success
                ? 'bg-emerald/20 border border-emerald/30 text-emerald-glow'
                : 'bg-red-950/60 border border-red-500/40 text-red-300'
            }`}
          >
            {testResultForThis.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">{testResultForThis.message}</span>
          </div>
        )}
      </div>
    );
  }
};
