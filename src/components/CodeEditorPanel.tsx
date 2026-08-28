import React from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Copy, Check, AlertCircle, Code, FileText } from 'lucide-react';

interface CodeEditorPanelProps {
  code: string;
  onChange: (value: string | undefined) => void;
  onRunCode: () => void;
  isBuilding: boolean;
  errorMessage?: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  code,
  onChange,
  onRunCode,
  isBuilding,
  errorMessage,
  isOpen,
  onToggle,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-4 left-24 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/80 hover:bg-surface border border-surface-border backdrop-blur-md text-xs font-medium text-slate-300 hover:text-white shadow-lg transition-all"
      >
        <Code className="w-3.5 h-3.5 text-primary" />
        <span>Open Script Editor</span>
      </button>
    );
  }

  return (
    <div className="w-[420px] lg:w-[480px] h-full flex flex-col bg-surface border-r border-surface-border z-20 shrink-0">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-subtle/50">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Parametric CAD Script
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-subtle rounded-lg transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-surface-subtle rounded-lg"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Error Notification Bar */}
      {errorMessage && (
        <div className="px-3.5 py-2.5 bg-red-950/80 border-b border-red-500/30 flex items-start gap-2.5 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 overflow-x-auto font-mono text-[11px] leading-relaxed">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Monaco Editor Component */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 12.5,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Bottom Run Bar */}
      <div className="p-3 border-t border-surface-border bg-surface-subtle/30 flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-400">
          Press Run or Cmd/Ctrl+S to rebuild
        </span>
        <button
          onClick={onRunCode}
          disabled={isBuilding}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isBuilding ? 'Building...' : 'Run Script'}</span>
        </button>
      </div>
    </div>
  );
};
