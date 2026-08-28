import React, { useState } from 'react';
import {
  Box,
  Plus,
  Trash2,
  Edit2,
  Search,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Layers,
  Code2,
} from 'lucide-react';
import { CADProject } from '../../services/projectService';

interface ProjectDashboardProps {
  projects: CADProject[];
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: (customName?: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onOpenProject,
  onCreateNewProject,
  onDeleteProject,
  onRenameProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
                Parametric CAD Studio
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              <Layers className="w-3.5 h-3.5" />
              <span>Parametric OpenCASCADE Solids</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Design & Synthesize 3D CAD Models
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Every project runs with an isolated OpenCASCADE geometry kernel and high-performance Monaco CAD IDE.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start gap-2 z-10">
            <div className="px-4 py-2 rounded-2xl bg-background/80 border border-surface-border text-xs font-mono flex items-center gap-3">
              <span className="text-slate-400">Total Projects:</span>
              <span className="text-cyan font-bold text-sm">{projects.length}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-background/80 border border-surface-border text-xs font-mono flex items-center gap-3">
              <span className="text-slate-400">Engine:</span>
              <span className="text-cyan font-bold text-sm">OpenCASCADE JS</span>
            </div>
          </div>
        </section>

        {/* Project Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => onCreateNewProject('NEMA 17 Stepper Mount')}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              + NEMA Mount
            </button>
            <button
              type="button"
              onClick={() => onCreateNewProject('Enclosure Box')}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              + Enclosure Box
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center space-y-4 rounded-3xl bg-surface/40 border border-surface-border">
            <Box className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No CAD projects found</h3>
              <p className="text-xs text-slate-400">
                {searchQuery ? 'Try clearing your search query.' : 'Create your first 3D parametric CAD project to get started.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreateNewProject()}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const isEditing = editingProjectId === project.id;

              return (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="group relative p-5 rounded-2xl bg-surface hover:bg-surface-subtle border border-surface-border hover:border-cyan/50 shadow-xl transition-all flex flex-col justify-between cursor-pointer space-y-4"
                >
                  <div className="space-y-3">
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan group-hover:scale-105 transition-transform shrink-0">
                        <Box className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleCopyUrl(project.id, e)}
                          title="Copy Direct Project URL"
                          className="p-1.5 rounded-lg hover:bg-background/80 text-slate-400 hover:text-cyan transition-colors"
                        >
                          {copiedId === project.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(project, e)}
                          title="Rename Project"
                          className="p-1.5 rounded-lg hover:bg-background/80 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete project "${project.name}"?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          title="Delete Project"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Project Title / Inline Edit */}
                    {isEditing ? (
                      <form onSubmit={(e) => handleSaveRename(project.id, e)} className="space-y-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => handleSaveRename(project.id)}
                          className="w-full px-2 py-1 rounded bg-background border border-cyan text-xs font-bold text-white focus:outline-none"
                        />
                      </form>
                    ) : (
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-glow transition-colors truncate">
                          {project.name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500">
                          /project/{project.id}
                        </span>
                      </div>
                    )}

                    {/* Code Preview snippet */}
                    <div className="p-2.5 rounded-xl bg-background/90 border border-surface-border/80 font-mono text-[10px] text-slate-400 h-16 overflow-hidden select-none">
                      <pre className="line-clamp-3 whitespace-pre-wrap">{project.code.slice(0, 140)}...</pre>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1 text-cyan font-sans font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Open Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
