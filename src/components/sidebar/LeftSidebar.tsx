import React from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Code2,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Copy,
  Check,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ViewToolsPanel } from './ViewToolsPanel';
import { CadToolsPanel } from './CadToolsPanel';
import { AIChatPanel } from '../chat/AIChatPanel';
import { RenderMode } from '../CADViewport';
import { WorkerMeshOutput } from '../../cad/cadClient';
import { useAiCad } from '../../hooks/useAiCad';

export type SidebarTab = 'ai_chat' | 'cad_tools' | 'view_tools' | 'ide';

interface LeftSidebarProps {
  activeTab: SidebarTab | null;
  onSelectTab: (tab: SidebarTab | null) => void;
  // AI CAD props
  aiCad: ReturnType<typeof useAiCad>;
  // View Tools props
  renderMode: RenderMode;
  onSelectRenderMode: (mode: RenderMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showAxes: boolean;
  onToggleAxes: () => void;
  showEdges: boolean;
  onToggleEdges: () => void;
  onSetCameraView: (view: 'iso' | 'top' | 'front' | 'right') => void;
  onResetCamera: () => void;
  meshes: WorkerMeshOutput[];
  onExport: (format: 'step' | 'stl') => void;
  isExporting: boolean;
  // IDE props
  code: string;
  onChangeCode: (val: string | undefined) => void;
  onRunCode: () => void;
  isBuilding: boolean;
  errorMessage?: string | null;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  aiCad,
  renderMode,
  onSelectRenderMode,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  showEdges,
  onToggleEdges,
  onSetCameraView,
  onResetCamera,
  meshes,
  onExport,
  isExporting,
  code,
  onChangeCode,
  onRunCode,
  isBuilding,
  errorMessage,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDrawerOpen = activeTab !== null;

  const tabsConfig: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor?: string;
  }> = [
    { id: 'ai_chat', label: 'AI CAD Agent', icon: Sparkles, accentColor: 'text-cyan' },
    { id: 'cad_tools', label: 'CAD Tools Workbench', icon: Wrench, accentColor: 'text-amber-400' },
    { id: 'view_tools', label: 'View & Shaders', icon: SlidersHorizontal, accentColor: 'text-blue-400' },
    { id: 'ide', label: 'CAD Script IDE', icon: Code2, accentColor: 'text-primary' },
  ];

  return (
    <div className="flex h-full shrink-0 z-20 relative select-none">
      {/* 1. Leftmost Activity Bar */}
      <aside className="w-14 h-full bg-surface border-r border-surface-border flex flex-col items-center justify-between py-3 z-30 shrink-0">
        {/* Top Tab Icons */}
        <div className="flex flex-col items-center gap-2 w-full px-1.5">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(isActive ? null : tab.id)}
                title={tab.label}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? tab.id === 'ai_chat'
                      ? 'bg-cyan text-black shadow-md shadow-cyan/30 font-bold'
                      : tab.id === 'cad_tools'
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30 font-bold'
                      : 'bg-primary text-white shadow-md shadow-primary/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-surface-subtle'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Bottom Drawer Toggle Indicator */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectTab(isDrawerOpen ? null : 'ai_chat')}
            title={isDrawerOpen ? 'Collapse Left Side Panel' : 'Expand Left Side Panel'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-subtle transition-colors"
          >
            {isDrawerOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* 2. Expandable Drawer Panel */}
      {isDrawerOpen && (
        <section className="w-[420px] lg:w-[460px] h-full bg-surface border-r border-surface-border flex flex-col z-20 shrink-0 shadow-2xl animate-in slide-in-from-left duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-subtle/50 shrink-0">
            <div className="flex items-center gap-2">
              {activeTab === 'ai_chat' && <Sparkles className="w-4 h-4 text-cyan" />}
              {activeTab === 'cad_tools' && <Wrench className="w-4 h-4 text-amber-400" />}
              {activeTab === 'view_tools' && <SlidersHorizontal className="w-4 h-4 text-cyan" />}
              {activeTab === 'ide' && <Code2 className="w-4 h-4 text-primary" />}

              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                {activeTab === 'ai_chat' && 'AI Parametric CAD Agent'}
                {activeTab === 'cad_tools' && 'CAD Modeling Workbench'}
                {activeTab === 'view_tools' && 'Viewport & Shaders'}
                {activeTab === 'ide' && 'Parametric CAD Script IDE'}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              {activeTab === 'ide' && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy CAD Script"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-subtle rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectTab(null)}
                title="Close Side Panel"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-subtle rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body Contents */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* AI CHAT PANEL */}
            {activeTab === 'ai_chat' && (
              <AIChatPanel
                aiCad={aiCad}
                onApplyCodeToIde={(newCode) => {
                  onChangeCode(newCode);
                }}
              />
            )}

            {/* CAD TOOLS WORKBENCH */}
            {activeTab === 'cad_tools' && (
              <CadToolsPanel
                code={code}
                onChangeCode={(newCode) => onChangeCode(newCode)}
                onRunCode={onRunCode}
              />
            )}

            {/* VIEW TOOLS PANEL */}
            {activeTab === 'view_tools' && (
              <ViewToolsPanel
                renderMode={renderMode}
                onSelectRenderMode={onSelectRenderMode}
                showGrid={showGrid}
                onToggleGrid={onToggleGrid}
                showAxes={showAxes}
                onToggleAxes={onToggleAxes}
                showEdges={showEdges}
                onToggleEdges={onToggleEdges}
                onSetCameraView={onSetCameraView}
                onResetCamera={onResetCamera}
                meshes={meshes}
                onExport={onExport}
                isExporting={isExporting}
              />
            )}

            {/* MONACO CAD SCRIPT IDE */}
            {activeTab === 'ide' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Script Action Bar */}
                <div className="px-4 py-2 bg-surface-subtle/80 border-b border-surface-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">replicad script</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">
                      JavaScript (OpenCASCADE)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onRunCode}
                    disabled={isBuilding}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isBuilding ? 'Compiling...' : 'Run Code'}</span>
                  </button>
                </div>

                {/* Monaco Editor Container */}
                <div className="flex-1 w-full bg-[#1e1e1e] relative">
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={code}
                    onChange={onChangeCode}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      fontFamily: 'Fira Code, monospace',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>

                {/* Compilation Error Footer */}
                {errorMessage && (
                  <div className="p-3 bg-red-950/80 border-t border-red-500/30 font-mono text-xs text-red-200 max-h-32 overflow-y-auto shrink-0 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <pre className="whitespace-pre-wrap flex-1">{errorMessage}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
