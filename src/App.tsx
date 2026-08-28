import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { CADViewport, CADViewportHandle, RenderMode } from './components/CADViewport';
import { LeftSidebar, SidebarTab } from './components/sidebar/LeftSidebar';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { cadClient, WorkerMeshOutput } from './cad/cadClient';
import {
  CADProject,
  loadAllProjects,
  createProject,
  updateProject,
  deleteProject,
  renameProject,
  DEFAULT_PROJECT_CODE,
} from './services/projectService';

function getProjectIdFromPath(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/project\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export const App: React.FC = () => {
  // Multi-Project Router State
  const [projects, setProjects] = useState<CADProject[]>(() => loadAllProjects());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => getProjectIdFromPath());

  // Listen to browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentProjectId(getProjectIdFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Current Active Project
  const currentProject = currentProjectId
    ? projects.find((p) => p.id === currentProjectId) || null
    : null;

  // CAD Script & Geometry State
  const [code, setCode] = useState<string>(() => currentProject?.code || DEFAULT_PROJECT_CODE);
  const [meshes, setMeshes] = useState<WorkerMeshOutput[]>([]);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Left Sidebar State (Defaults to 'view_tools' open)
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab | null>('view_tools');

  // Viewport Display Settings
  const [renderMode, setRenderMode] = useState<RenderMode>('clay');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const viewportRef = useRef<CADViewportHandle>(null);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Compile / Rebuild Code
  const runCode = useCallback(async (codeToRun: string) => {
    setIsBuilding(true);
    setErrorMessage(null);
    try {
      const result = await cadClient.evaluateCode(codeToRun);
      if (result.success && result.meshes) {
        setMeshes(result.meshes);
      } else {
        setErrorMessage(result.error || 'Failed to compile CAD model');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || String(err));
    } finally {
      setIsBuilding(false);
    }
  }, []);

  // Sync state when currentProjectId changes
  useEffect(() => {
    if (currentProjectId) {
      const all = loadAllProjects();
      let proj = all.find((p) => p.id === currentProjectId);
      if (!proj) {
        proj = createProject(undefined, DEFAULT_PROJECT_CODE, currentProjectId);
        setProjects(loadAllProjects());
      }
      setCode(proj.code);
      runCode(proj.code);
    }
  }, [currentProjectId, runCode]);

  // Auto-save active project changes to localStorage
  useEffect(() => {
    if (currentProjectId && currentProject) {
      updateProject({
        ...currentProject,
        code,
        meshCount: meshes.length,
      });
    }
  }, [code, meshes.length, currentProjectId]);

  // Navigation Handlers
  const handleOpenProject = (id: string) => {
    window.history.pushState({}, '', `/project/${id}`);
    setCurrentProjectId(id);
  };

  const handleGoToDashboard = () => {
    window.history.pushState({}, '', '/');
    setCurrentProjectId(null);
    setProjects(loadAllProjects());
  };

  const handleCreateNewProject = (customName?: string) => {
    const newProj = createProject(customName);
    const updated = loadAllProjects();
    setProjects(updated);
    handleOpenProject(newProj.id);
  };

  const handleDeleteProject = (id: string) => {
    const updated = deleteProject(id);
    setProjects(updated);
    if (currentProjectId === id) {
      handleGoToDashboard();
    }
  };

  const handleRenameProject = (id: string, newName: string) => {
    renameProject(id, newName);
    setProjects(loadAllProjects());
  };

  // Export CAD Solid as STEP / STL
  const handleExport = async (format: 'step' | 'stl') => {
    setIsExporting(true);
    try {
      const exportRes = await cadClient.exportModel(format);
      if (exportRes && exportRes.blob) {
        const url = URL.createObjectURL(exportRes.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportRes.filename || `solid-model.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to export CAD model. Check code syntax.');
      }
    } catch (err: any) {
      alert(`Export error: ${err?.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  // IF ON ROOT DASHBOARD (/ or index.html)
  if (!currentProjectId) {
    return (
      <ProjectDashboard
        projects={projects}
        onOpenProject={handleOpenProject}
        onCreateNewProject={handleCreateNewProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />
    );
  }

  // IF INSIDE A PROJECT WORKSPACE (/project/:id)
  return (
    <div className="flex flex-col w-screen h-screen bg-[#070a12] text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. Header Bar */}
      <HeaderNavbar
        onOpenTab={(tab) => setActiveSidebarTab(tab)}
        activeTab={activeSidebarTab}
        onExport={handleExport}
        isExporting={isExporting}
        projectName={currentProject?.name}
        projectId={currentProjectId}
        onGoToDashboard={handleGoToDashboard}
        onRenameProject={(newName) => handleRenameProject(currentProjectId, newName)}
      />

      {/* 2. Main Studio Workspace */}
      <div className="flex-1 flex w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Left Activity Bar + Collapsible Drawer */}
        <LeftSidebar
          activeTab={activeSidebarTab}
          onSelectTab={setActiveSidebarTab}
          renderMode={renderMode}
          onSelectRenderMode={setRenderMode}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showAxes={showAxes}
          onToggleAxes={() => setShowAxes(!showAxes)}
          showEdges={showEdges}
          onToggleEdges={() => setShowEdges(!showEdges)}
          onSetCameraView={(view) => viewportRef.current?.setCameraView(view)}
          onResetCamera={() => viewportRef.current?.resetCamera()}
          meshes={meshes}
          onExport={handleExport}
          isExporting={isExporting}
          code={code}
          onChangeCode={(newCode) => {
            setCode(newCode || '');
            if (newCode) runCode(newCode);
          }}
          onRunCode={() => runCode(code)}
          isBuilding={isBuilding}
          errorMessage={errorMessage}
        />

        {/* Center 3D Viewport */}
        <main className="flex-1 h-full bg-background relative overflow-hidden flex flex-col">
          <CADViewport
            ref={viewportRef}
            meshes={meshes}
            renderMode={renderMode}
            showGrid={showGrid}
            showAxes={showAxes}
            showEdges={showEdges}
            isBuilding={isBuilding}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
