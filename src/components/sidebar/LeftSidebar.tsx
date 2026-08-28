import React from 'react';
import {
  SlidersHorizontal,
  Code2,
  Sparkles,
  Key,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  Cpu,
  Eye,
  AlertTriangle,
  Play,
  Copy,
  Check,
  AlertCircle,
  FolderTree,
  ArrowRight,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ViewToolsPanel } from './ViewToolsPanel';
import { BYOKPanel } from './BYOKPanel';
import { FreeModelsPanel } from './FreeModelsPanel';
import { RenderMode } from '../CADViewport';
import { WorkerMeshOutput } from '../../cad/cadClient';
import { APIKeyEntry, AIModelOption } from '../../services/aiService';
import { PRESETS, CADPreset } from '../../cad/presets';

export type SidebarTab = 'view_tools' | 'ide' | 'free_models' | 'byok' | 'presets';

interface LeftSidebarProps {
  activeTab: SidebarTab | null;
  onSelectTab: (tab: SidebarTab | null) => void;
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
  // BYOK props
  keyPool: APIKeyEntry[];
  onUpdateKeyPool: (newPool: APIKeyEntry[]) => void;
  // Models props
  selectedModel: string;
  onSelectModel: (modelId: string, modelObj?: AIModelOption) => void;
  // Presets props
  onSelectPreset: (preset: CADPreset) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
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
  keyPool,
  onUpdateKeyPool,
  selectedModel,
  onSelectModel,
  onSelectPreset,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDrawerOpen = activeTab !== null;
  const activeKeysCount = keyPool.filter((k) => k.isActive).length;
  const rateLimitedKeysCount = keyPool.filter((k) => k.isRateLimited && (k.rateLimitedUntil || 0) > Date.now()).length;

  const tabsConfig: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'view_tools', label: 'View Tools', icon: SlidersHorizontal },
    { id: 'ide', label: 'CAD Script IDE', icon: Code2 },
    { id: 'free_models', label: 'Free AI Hub', icon: Sparkles, badge: 'Free', badgeColor: 'bg-cyan text-slate-950 font-bold' },
    {
      id: 'byok',
      label: 'BYOK Vault',
      icon: Key,
      badge: rateLimitedKeysCount > 0 ? `!` : activeKeysCount > 0 ? `${activeKeysCount}` : undefined,
      badgeColor: rateLimitedKeysCount > 0 ? 'bg-amber-500 text-slate-950 font-bold animate-pulse' : 'bg-primary/30 text-primary-glow',
    },
    { id: 'presets', label: 'Preset Library', icon: FolderTree },
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
                    ? 'bg-primary text-white shadow-md shadow-primary/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-surface-subtle'
                }`}
              >
                <Icon className="w-5 h-5" />

                {/* Optional Badge */}
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-1 text-[9px] px-1 py-0.2 rounded-full border border-surface shadow-sm ${
                      tab.badgeColor || 'bg-primary text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Drawer Toggle Indicator */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectTab(isDrawerOpen ? null : 'view_tools')}
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
              {activeTab === 'view_tools' && <SlidersHorizontal className="w-4 h-4 text-cyan" />}
              {activeTab === 'ide' && <Code2 className="w-4 h-4 text-primary" />}
              {activeTab === 'free_models' && <Sparkles className="w-4 h-4 text-cyan" />}
              {activeTab === 'byok' && <Key className="w-4 h-4 text-primary" />}
              {activeTab === 'presets' && <FolderTree className="w-4 h-4 text-emerald" />}

              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                {activeTab === 'view_tools' && '3D Viewport & Geometry Tools'}
                {activeTab === 'ide' && 'Parametric CAD Script IDE'}
                {activeTab === 'free_models' && 'Free AI Models & Catalog'}
                {activeTab === 'byok' && 'BYOK Vault & Key Rotation'}
                {activeTab === 'presets' && 'Parametric Presets Library'}
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

          {/* Drawer Body Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* VIEW TOOLS */}
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

            {/* IDE SCRIPT EDITOR */}
            {activeTab === 'ide' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="px-3.5 py-2.5 bg-red-950/80 border-b border-red-500/30 flex items-start gap-2.5 text-red-200 text-xs shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 overflow-x-auto font-mono text-[11px] leading-relaxed">
                      {errorMessage}
                    </div>
                  </div>
                )}

                {/* Monaco Editor */}
                <div className="flex-1 relative overflow-hidden">
                  <Editor
                    height="100%"
                    language="javascript"
                    theme="vs-dark"
                    value={code}
                    onChange={onChangeCode}
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
                <div className="p-3 border-t border-surface-border bg-surface-subtle/30 flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    Replicad JavaScript Kernel
                  </span>
                  <button
                    type="button"
                    onClick={onRunCode}
                    disabled={isBuilding}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isBuilding ? 'Compiling...' : 'Run Script'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* FREE MODELS CATALOG */}
            {activeTab === 'free_models' && (
              <FreeModelsPanel
                selectedModel={selectedModel}
                onSelectModel={(modelId, modelObj) => {
                  onSelectModel(modelId, modelObj);
                }}
                onOpenBYOKTab={() => onSelectTab('byok')}
              />
            )}

            {/* BYOK VAULT & KEY POOL */}
            {activeTab === 'byok' && (
              <BYOKPanel
                keyPool={keyPool}
                onUpdateKeyPool={onUpdateKeyPool}
                activeModel={selectedModel}
                onOpenFreeModelsTab={() => onSelectTab('free_models')}
              />
            )}

            {/* PRESETS LIBRARY */}
            {activeTab === 'presets' && (
              <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-3">
                <div className="p-3 bg-surface-subtle/50 rounded-xl border border-surface-border flex items-start gap-2.5">
                  <FolderTree className="w-4 h-4 text-emerald mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Select a parametric CAD template to load into the workspace and customize.
                  </p>
                </div>

                <div className="space-y-3">
                  {PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => onSelectPreset(preset)}
                      className="group p-3.5 rounded-xl bg-surface-subtle/70 hover:bg-surface-subtle border border-surface-border hover:border-cyan/50 cursor-pointer transition-all flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/10 text-cyan font-semibold">
                            {preset.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-surface-border/50 flex items-center justify-between text-xs text-slate-400 group-hover:text-white">
                        <span>Load Template</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
