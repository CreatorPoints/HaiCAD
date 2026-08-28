import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Box,
  SlidersHorizontal,
  Code2,
  LayoutGrid,
  ChevronLeft,
  Edit2,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { SidebarTab } from './sidebar/LeftSidebar';

interface HeaderNavbarProps {
  onOpenTab: (tab: SidebarTab) => void;
  activeTab: SidebarTab | null;
  onExport: (format: 'step' | 'stl') => void;
  isExporting: boolean;
  projectName?: string;
  projectId?: string;
  onGoToDashboard?: () => void;
  onRenameProject?: (newName: string) => void;
  onOpenDocs?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenTab,
  activeTab,
  onExport,
  isExporting,
  projectName,
  projectId,
  onGoToDashboard,
  onRenameProject,
  onOpenDocs,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName || '');

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onRenameProject && titleInput.trim()) {
      onRenameProject(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 w-full bg-surface/90 border-b border-surface-border px-4 flex items-center justify-between z-40 backdrop-blur-md shrink-0 select-none">
      {/* Brand & Project Breadcrumb */}
      <div className="flex items-center gap-3">
        {onGoToDashboard && (
          <button
            type="button"
            onClick={onGoToDashboard}
            title="Return to Projects Dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs text-slate-300 hover:text-white transition-all cursor-pointer mr-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <LayoutGrid className="w-3.5 h-3.5 text-cyan" />
            <span className="font-semibold hidden sm:inline">Projects</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-cyan flex items-center justify-center shadow-md shadow-primary/20">
            <Box className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">HaiCAD</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-surface-border mx-1 hidden sm:block" />

        {/* Project Name / Slug Indicator */}
        {projectId && (
          <div className="hidden sm:flex items-center gap-2">
            {isEditingTitle ? (
              <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => handleSaveTitle()}
                  autoFocus
                  className="px-2 py-0.5 text-xs bg-surface-subtle border border-cyan rounded-lg text-white font-medium focus:outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleInput(projectName || 'Workspace');
                  setIsEditingTitle(true);
                }}
                className="group flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                title="Click to rename project"
              >
                <span className="font-medium max-w-[160px] truncate">
                  {projectName || 'Workspace'}
                </span>
                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Quick Tabs */}
        <div className="hidden md:flex items-center gap-1 ml-4 border-l border-surface-border pl-4">
          <button
            type="button"
            onClick={() => onOpenTab('ai_chat')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ai_chat'
                ? 'bg-cyan text-black shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-surface-subtle border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI CAD Agent</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTab('cad_features')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'cad_features'
                ? 'bg-amber-400 text-black font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-surface-subtle border border-transparent'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Feature Tree</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTab('ide')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'ide'
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-surface-subtle border border-transparent'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script IDE</span>
          </button>
        </div>
      </div>

      {/* Right Controls (Docs, Export) */}
      <div className="flex items-center gap-2">
        {/* Complete OpenCASCADE / Replicad API Docs Button */}
        {onOpenDocs && (
          <button
            type="button"
            onClick={onOpenDocs}
            title="Open Complete OpenCASCADE & Replicad CAD Kernel API Docs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-cyan/30 text-cyan hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CAD API Docs</span>
          </button>
        )}

        {/* Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-surface-subtle hover:text-white transition-all text-left cursor-pointer"
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
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-surface-subtle hover:text-white transition-all text-left cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-white">STL (.stl)</div>
                  <div className="text-[10px] text-slate-400">3D Printing Mesh</div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-emerald-400">
                  Mesh
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
