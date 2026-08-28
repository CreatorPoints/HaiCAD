import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { CADViewport, CADViewportHandle, RenderMode } from './components/CADViewport';
import { LeftSidebar, SidebarTab } from './components/sidebar/LeftSidebar';
import { CadCommandRibbon } from './components/cad/CadCommandRibbon';
import { CadDocumentationModal } from './components/docs/CadDocumentationModal';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { cadClient, WorkerMeshOutput } from './cad/cadClient';
import { useAiCad } from './hooks/useAiCad';
import {
  CadFeature,
  CadToolMode,
  Transform3D,
  FaceNodePoint,
  DEFAULT_INITIAL_FEATURES,
  generateReplicadCodeFromFeatures,
} from './cad/cadModelingState';
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
  // Multi-Project State
  const [projects, setProjects] = useState<CADProject[]>(() => {
    const loaded = loadAllProjects();
    if (loaded.length === 0) {
      const initial = createProject('HaiCAD Workspace');
      return [initial];
    }
    return loaded;
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const fromPath = getProjectIdFromPath();
    if (fromPath) return fromPath;
    const all = loadAllProjects();
    return all.length > 0 ? all[0].id : 'default-workspace';
  });

  const [viewMode, setViewMode] = useState<'workspace' | 'dashboard'>(() => 'workspace');

  // Listen to browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const fromPath = getProjectIdFromPath();
      if (fromPath) {
        setCurrentProjectId(fromPath);
        setViewMode('workspace');
      } else {
        setViewMode('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Current Active Project
  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  // CAD Script & Geometry State
  const [code, setCode] = useState<string>(() => currentProject?.code || DEFAULT_PROJECT_CODE);
  const [meshes, setMeshes] = useState<WorkerMeshOutput[]>([]);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Onshape / FreeCAD Interactive Modeling State
  const [features, setFeatures] = useState<CadFeature[]>(DEFAULT_INITIAL_FEATURES);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>('feat_base_plate');
  const [toolMode, setToolMode] = useState<CadToolMode>('select');
  const [snapGridSize, setSnapGridSize] = useState<number>(1);

  // AI CAD Agent Hook (Aware of live IDE script)
  const aiCad = useAiCad({ currentEditorCode: code });

  // Sync AI-generated code and meshes into active workspace
  useEffect(() => {
    if (aiCad.currentCode) {
      setCode(aiCad.currentCode);
    }
  }, [aiCad.currentCode]);

  useEffect(() => {
    if (aiCad.meshes && aiCad.meshes.length > 0) {
      setMeshes(aiCad.meshes);
    }
  }, [aiCad.meshes]);

  // Left Sidebar State (Defaults to 'ai_chat' OPEN)
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab | null>('ai_chat');

  // Viewport Display Settings (3 Clean Modes: lit, unlit, wireframe)
  const [renderMode, setRenderMode] = useState<RenderMode>('lit');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
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
  }, [code, meshes.length, currentProjectId, currentProject]);

  // --- Feature Tree & Direct Manipulation Handlers ---
  const handleUpdateTransform = useCallback(
    (newTransform: Partial<Transform3D>) => {
      setFeatures((prev) => {
        const updated = prev.map((f) => {
          if (f.id === selectedFeatureId) {
            return {
              ...f,
              transform: {
                ...f.transform,
                ...newTransform,
              },
            };
          }
          return f;
        });
        const newCode = generateReplicadCodeFromFeatures(updated);
        setCode(newCode);
        runCode(newCode);
        return updated;
      });
    },
    [selectedFeatureId, runCode]
  );

  const handleAddFeature = useCallback(
    (type: CadFeature['type'], customParams: any = {}) => {
      const id = 'feat_' + Math.random().toString(36).substring(2, 9);
      const name = `${type.charAt(0).toUpperCase() + type.slice(1)} ${features.length + 1}`;

      const newFeature: CadFeature = {
        id,
        name,
        type,
        enabled: true,
        transform: {
          x: 0,
          y: 0,
          z: 0,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
        },
        params: {
          width: 40,
          length: 40,
          height: 10,
          radius: 15,
          filletRadius: 2,
          holeDiameter: 4,
          holeDepth: 20,
          extrudeDepth: 10,
          ...customParams,
        },
      };

      const updated = [...features, newFeature];
      setFeatures(updated);
      setSelectedFeatureId(id);
      const newCode = generateReplicadCodeFromFeatures(updated);
      setCode(newCode);
      runCode(newCode);
    },
    [features, runCode]
  );

  const handleUpdateFeature = useCallback(
    (id: string, updates: Partial<CadFeature>) => {
      setFeatures((prev) => {
        const updated = prev.map((f) => (f.id === id ? { ...f, ...updates } : f));
        const newCode = generateReplicadCodeFromFeatures(updated);
        setCode(newCode);
        runCode(newCode);
        return updated;
      });
    },
    [runCode]
  );

  const handleDeleteFeature = useCallback(
    (id: string) => {
      setFeatures((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        if (selectedFeatureId === id) {
          setSelectedFeatureId(updated.length > 0 ? updated[0].id : null);
        }
        const newCode = generateReplicadCodeFromFeatures(updated);
        setCode(newCode);
        runCode(newCode);
        return updated;
      });
    },
    [selectedFeatureId, runCode]
  );

  const handleAddFaceNode = useCallback(
    (node: FaceNodePoint) => {
      setFeatures((prev) => {
        const activeCutFeat = prev.find((f) => f.type === 'face_cut' || f.type === 'face_node');
        let updated: CadFeature[];

        if (activeCutFeat) {
          updated = prev.map((f) => {
            if (f.id === activeCutFeat.id) {
              const currentNodes = f.params.faceNodes || [];
              return {
                ...f,
                params: {
                  ...f.params,
                  faceNodes: [...currentNodes, node],
                },
              };
            }
            return f;
          });
        } else {
          const newCutFeat: CadFeature = {
            id: 'feat_cut_' + Date.now(),
            name: 'Face Cut / Pocket',
            type: 'face_cut',
            enabled: true,
            transform: { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 },
            params: { faceNodes: [node], holeDepth: 10 },
          };
          updated = [...prev, newCutFeat];
          setSelectedFeatureId(newCutFeat.id);
        }

        const newCode = generateReplicadCodeFromFeatures(updated);
        setCode(newCode);
        runCode(newCode);
        return updated;
      });
    },
    [runCode]
  );

  // Navigation Handlers
  const handleOpenProject = (id: string) => {
    window.history.pushState({}, '', `/project/${id}`);
    setCurrentProjectId(id);
    setViewMode('workspace');
    setActiveSidebarTab('ai_chat');
  };

  const handleGoToDashboard = () => {
    window.history.pushState({}, '', '/');
    setViewMode('dashboard');
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
    if (currentProjectId === id && updated.length > 0) {
      handleOpenProject(updated[0].id);
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
      const res = await cadClient.exportModel(format);
      if (res && res.blob) {
        const url = URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(`Export error: ${err?.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  // DASHBOARD VIEW
  if (viewMode === 'dashboard') {
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

  const selectedFeature = features.find((f) => f.id === selectedFeatureId) || null;

  // WORKSPACE VIEW
  return (
    <div className="flex flex-col w-screen h-screen bg-[#070a12] text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. Header Bar */}
      <HeaderNavbar
        onOpenTab={(tab) => {
          setActiveSidebarTab(tab);
          setViewMode('workspace');
        }}
        activeTab={activeSidebarTab}
        onExport={handleExport}
        isExporting={isExporting}
        projectName={currentProject?.name}
        projectId={currentProjectId}
        onGoToDashboard={handleGoToDashboard}
        onRenameProject={(newName) => handleRenameProject(currentProjectId, newName)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* 2. Main Studio Workspace */}
      <div className="flex-1 flex w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Left Activity Bar + Drawer */}
        <LeftSidebar
          activeTab={activeSidebarTab}
          onSelectTab={setActiveSidebarTab}
          aiCad={aiCad}
          features={features}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={setSelectedFeatureId}
          onUpdateFeature={handleUpdateFeature}
          onAddFeature={handleAddFeature}
          onDeleteFeature={handleDeleteFeature}
          toolMode={toolMode}
          onSelectToolMode={setToolMode}
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

        {/* Center CAD Modeling Area (Ribbon + 3D Viewport) */}
        <main className="flex-1 h-full bg-background relative overflow-hidden flex flex-col min-w-0">
          {/* Top Onshape / FreeCAD Command Ribbon */}
          <CadCommandRibbon
            toolMode={toolMode}
            onSelectToolMode={setToolMode}
            selectedFeature={selectedFeature}
            onUpdateTransform={handleUpdateTransform}
            onAddFeature={handleAddFeature}
            onDeleteSelectedFeature={() => {
              if (selectedFeatureId) handleDeleteFeature(selectedFeatureId);
            }}
            snapGridSize={snapGridSize}
            onSetSnapGridSize={setSnapGridSize}
          />

          {/* 3D Viewport with TransformControls and Face Raycasting */}
          <div className="flex-1 w-full h-full relative overflow-hidden">
            <CADViewport
              ref={viewportRef}
              meshes={meshes}
              renderMode={renderMode}
              showGrid={showGrid}
              showAxes={showAxes}
              showEdges={showEdges}
              isBuilding={isBuilding}
              toolMode={toolMode}
              onUpdateTransform={handleUpdateTransform}
              onAddFaceNode={handleAddFaceNode}
              snapGridSize={snapGridSize}
            />
          </div>
        </main>
      </div>

      {/* 3. Comprehensive OpenCASCADE & Replicad Documentation Modal */}
      <CadDocumentationModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        onInsertCode={(snippet) => {
          setCode(snippet);
          runCode(snippet);
        }}
      />
    </div>
  );
};

export default App;
