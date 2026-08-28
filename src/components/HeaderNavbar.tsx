import React, { useState } from 'react';
import {
  Download,
  Key,
  Layers,
  Sparkles,
  ChevronDown,
  Box,
  SlidersHorizontal,
  Code2,
  Cpu,
  Bot,
} from 'lucide-react';
import { SidebarTab } from './sidebar/LeftSidebar';

interface HeaderNavbarProps {
  onOpenTab: (tab: SidebarTab) => void;
  activeTab: SidebarTab | null;
  onExport: (format: 'step' | 'stl') => void;
  isExporting: boolean;
  activeKeysCount: number;
  rateLimitedCount: number;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenTab,
  activeTab,
  onExport,
  isExporting,
  activeKeysCount,
  rateLimitedCount,
  isChatOpen = true,
  onToggleChat,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 w-full bg-surface/90 border-b border-surface-border px-4 flex items-center justify-between z-40 backdrop-blur-md shrink-0 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-cyan flex items-center justify-center shadow-md shadow-primary/20">
            <Box className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">HaiCAD</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary-glow font-semibold">
                AI Studio
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-surface-border mx-1" />

        {/* Quick Nav Chips */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenTab('view_tools')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'view_tools'
                ? 'bg-primary/20 text-primary-glow border border-primary/40'
                : 'text-slate-300 hover:text-white hover:bg-surface-subtle border border-transparent'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>View Tools</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTab('ide')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'ide'
                ? 'bg-primary/20 text-primary-glow border border-primary/40'
                : 'text-slate-300 hover:text-white hover:bg-surface-subtle border border-transparent'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>CAD Script IDE</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTab('byok')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'byok'
                ? 'bg-primary/20 text-primary-glow border border-primary/40'
                : 'text-slate-300 hover:text-white hover:bg-surface-subtle border border-transparent'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-primary" />
            <span>BYOK Vault</span>
          </button>
        </div>
      </div>

      {/* Right Controls (Export, BYOK Vault, AI Chat Toggle, GitHub) */}
      <div className="flex items-center gap-2.5">
        {/* Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CAD'}</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-surface border border-surface-border shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-400">
                Choose Export Format
              </div>
              <button
                type="button"
                onClick={() => {
                  onExport('step');
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-surface-subtle hover:text-white transition-all text-left"
              >
                <div>
                  <div className="font-semibold text-white">STEP (.step)</div>
                  <div className="text-[10px] text-slate-400">Parametric Solid B-Rep</div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-slate-300">
                  CAD
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExport('stl');
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-surface-subtle hover:text-white transition-all text-left"
              >
                <div>
                  <div className="font-semibold text-white">STL (.stl)</div>
                  <div className="text-[10px] text-slate-400">Binary 3D Printing Mesh</div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-slate-300">
                  3D Print
                </span>
              </button>
            </div>
          )}
        </div>

        {/* BYOK Keys Vault Button */}
        <button
          type="button"
          onClick={() => onOpenTab('byok')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            rateLimitedCount > 0
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 animate-pulse'
              : activeKeysCount > 0
              ? 'bg-surface-subtle border-surface-border text-slate-300 hover:text-white hover:border-slate-500'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-primary-glow" />
          <span>
            {rateLimitedCount > 0
              ? `BYOK (${activeKeysCount}) ⚠️`
              : activeKeysCount > 0
              ? `BYOK Vault (${activeKeysCount})`
              : 'Set BYOK Keys'}
          </span>
        </button>

        {/* AI Chat Area Toggle Button */}
        {onToggleChat && (
          <button
            type="button"
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isChatOpen
                ? 'bg-primary/20 border-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface-subtle border-surface-border text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan" />
            <span>AI Chat</span>
          </button>
        )}

        {/* GitHub Link */}
        <a
          href="https://github.com/CreatorPoints/HaiCAD"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub Repository"
          className="p-2 text-slate-400 hover:text-white hover:bg-surface-subtle rounded-xl border border-surface-border transition-all"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
