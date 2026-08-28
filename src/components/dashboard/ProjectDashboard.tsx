import React, { useState } from 'react';
import {
  Box,
  Plus,
  Trash2,
  Edit2,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Key,
} from 'lucide-react';
import { CADProject } from '../../services/projectService';
import { APIKeyEntry } from '../../services/aiService';

interface ProjectDashboardProps {
  projects: CADProject[];
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: (customName?: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  keyPool: APIKeyEntry[];
  onOpenBYOK: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onOpenProject,
  onCreateNewProject,
  onDeleteProject,
  onRenameProject,
  keyPool,
  onOpenBYOK,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeKeysCount = keyPool.filter((k) => k.isActive).length;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (project: CADProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = (projectId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingName.trim()) {
      onRenameProject(projectId, editingName.trim());
    }
    setEditingProjectId(null);
  };

  const handleCopyUrl = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#070a12] text-slate-100 overflow-y-auto select-none font-sans">
      {/* Top Navbar */}
      <header className="h-16 w-full bg-surface/90 border-b border-surface-border px-6 flex items-center justify-between z-30 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-cyan flex items-center justify-center shadow-lg shadow-primary/20">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-lg">HaiCAD</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/15 text-cyan-glow border border-cyan/30 font-bold">
                Projects Studio
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenBYOK}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-xs text-slate-300 hover:text-white hover:border-primary/50 transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-primary" />
            <span>BYOK Vault</span>
            {activeKeysCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald/20 text-emerald-glow font-bold">
                {activeKeysCount} Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onCreateNewProject()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-primary/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New CAD Project</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Hero Banner */}
        <section className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-surface to-surface-subtle border border-surface-border/80 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[11px] font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Procedural 3D CAD Projects</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Design, Synthesize & Manage Parametric CAD
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Every project has its own dedicated 3D workspace, OpenCASCADE Replicad script, and AI Copilot memory.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start gap-2 z-10">
            <div className="px-4 py-2 rounded-2xl bg-background/80 border border-surface-border text-xs font-mono flex items-center gap-3">
              <span className="text-slate-400">Total Projects:</span>
              <span className="text-cyan font-bold text-sm">{projects.length}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-background/80 border border-surface-border text-xs font-mono flex items-center gap-3">
              <span className="text-slate-400">Default Router:</span>
              <span className="text-emerald-glow font-bold text-sm">100% Free Tier</span>
            </div>
          </div>
        </section>

        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name or slug..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-surface-border text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCreateNewProject('NEMA 17 Stepper Mount')}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs text-slate-300 hover:text-white transition-all text-left font-mono text-[11px]"
            >
              + NEMA Mount
            </button>
            <button
              type="button"
              onClick={() => onCreateNewProject('PCB Enclosure Box')}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs text-slate-300 hover:text-white transition-all text-left font-mono text-[11px]"
            >
              + Enclosure Box
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface/50 border border-dashed border-surface-border space-y-4">
            <Box className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No CAD Projects Found</h3>
              <p className="text-xs text-slate-400">
                {searchQuery ? `No matches for "${searchQuery}"` : 'Create your first project to start modeling in 3D.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreateNewProject()}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group relative p-5 rounded-2xl bg-surface hover:bg-surface-subtle border border-surface-border hover:border-cyan/40 shadow-xl transition-all flex flex-col justify-between cursor-pointer space-y-4"
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan/10 text-cyan-glow border border-cyan/20 font-semibold">
                      /project/{project.id}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyUrl(project.id, e)}
                      title="Copy Direct Project URL"
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                    >
                      {copiedId === project.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {editingProjectId === project.id ? (
                    <form
                      onSubmit={(e) => handleSaveRename(project.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        className="w-full px-2 py-1 rounded bg-background border border-cyan/50 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 rounded bg-primary text-white text-xs font-bold"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan transition-colors truncate">
                        {project.name}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(project, e)}
                        title="Rename Project"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded transition-opacity"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {project.description || 'Parametric solid project'}
                  </p>
                </div>

                {/* Code Snippet Preview */}
                <div className="p-2.5 rounded-xl bg-background/90 border border-surface-border font-mono text-[10px] text-slate-400 line-clamp-3 leading-tight overflow-hidden">
                  {project.code.slice(0, 120)}...
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      title="Delete Project"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="flex items-center gap-1 text-xs font-semibold text-primary-glow group-hover:translate-x-0.5 transition-transform">
                      <span>Open Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
