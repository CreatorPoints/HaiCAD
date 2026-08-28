import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { CADViewport, CADViewportHandle, RenderMode } from './components/CADViewport';
import { DynamicIsland } from './components/DynamicIsland';
import { LeftSidebar, SidebarTab } from './components/sidebar/LeftSidebar';
import { PRESETS, CADPreset } from './cad/presets';
import { cadClient, WorkerMeshOutput } from './cad/cadClient';
import {
  generateCADCode,
  AIPingLocation,
  DEFAULT_MODELS,
  AIModelOption,
  APIKeyEntry,
  loadKeyPool,
  saveKeyPool,
  fetchOpenRouterModels,
  KeyRotationEvent,
} from './services/aiService';
import { ArrowRightLeft, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const App: React.FC = () => {
  // CAD Script & Geometry State
  const [code, setCode] = useState<string>(PRESETS[0].code);
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

  // BYOK Key Pool State
  const [keyPool, setKeyPool] = useState<APIKeyEntry[]>(() => loadKeyPool());

  // Procedural Models State
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODELS[0].id);
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>(DEFAULT_MODELS);

  // AI & Dynamic Island State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [activePings, setActivePings] = useState<AIPingLocation[]>([]);
  const [lastUsedKeyLabel, setLastUsedKeyLabel] = useState<string | undefined>();
  const [rotationToast, setRotationToast] = useState<KeyRotationEvent | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch OpenRouter dynamic catalog on load to populate procedural models
  useEffect(() => {
    fetchOpenRouterModels().then((fetched) => {
      if (fetched && fetched.length > 0) {
        const geminiDefaults = DEFAULT_MODELS.filter((m) => m.provider === 'gemini');
        setAvailableModels([...geminiDefaults, ...fetched]);
      }
    });
  }, []);

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

  // Initial compile on mount
  useEffect(() => {
    runCode(code);
  }, []);

  // Key Pool update handler
  const handleUpdateKeyPool = (newPool: APIKeyEntry[]) => {
    setKeyPool(newPool);
    saveKeyPool(newPool);
  };

  // AI Generation Handler with Procedural BYOK Key Rotation & Failover
  const handleGenerate = async (prompt: string, modelToUse: string) => {
    setIsGenerating(true);
    setCurrentStep('Analyzing geometry constraints...');
    setActivePings([]);

    try {
      const result = await generateCADCode({
        prompt,
        currentCode: code,
        model: modelToUse,
        keyPool,
        onStepProgress: (step) => {
          setCurrentStep(step);
        },
        onLivePing: (ping) => {
          setActivePings((prev) => [...prev.slice(-3), ping]);
        },
        onKeyRotated: (event) => {
          setRotationToast(event);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setRotationToast(null), 6000);
        },
        onKeyPoolUpdated: (updatedPool) => {
          setKeyPool(updatedPool);
        },
      });

      setLastUsedKeyLabel(result.usedKeyLabel);
      setCurrentStep('Synthesizing 3D OpenCASCADE solid...');
      setCode(result.code);
      if (result.pings.length > 0) {
        setActivePings(result.pings);
      }

      // Compile new code
      const evalRes = await cadClient.evaluateCode(result.code);
      if (evalRes.success && evalRes.meshes) {
        setMeshes(evalRes.meshes);
        setErrorMessage(null);
        setCurrentStep('Model successfully generated!');
      } else {
        // Auto-fix attempt if error occurs (Self-healing loop)
        setCurrentStep('Self-healing CAD geometry error...');
        setErrorMessage(evalRes.error || 'Initial build error');

        const fixResult = await generateCADCode({
          prompt: `The previous code produced this error: "${evalRes.error}". Please fix the issue and return working Replicad code. Original prompt was: ${prompt}`,
          currentCode: result.code,
          model: modelToUse,
          keyPool,
          onStepProgress: (step) => setCurrentStep(step),
          onKeyRotated: (event) => {
            setRotationToast(event);
          },
          onKeyPoolUpdated: (updatedPool) => {
            setKeyPool(updatedPool);
          },
        });

        setCode(fixResult.code);
        const secondEval = await cadClient.evaluateCode(fixResult.code);
        if (secondEval.success && secondEval.meshes) {
          setMeshes(secondEval.meshes);
          setErrorMessage(null);
          setCurrentStep('Self-healed and rendered!');
        } else {
          setErrorMessage(secondEval.error || 'Build failed after self-healing');
        }
      }

      // Keep pings visible for 6 seconds then fade out
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = setTimeout(() => {
        setActivePings([]);
      }, 7000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error generating CAD');
      setCurrentStep('');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setCurrentStep('');
      }, 3000);
    }
  };

  // Export File Handler
  const handleExport = async (format: 'step' | 'stl') => {
    setIsExporting(true);
    try {
      const { blob, filename } = await cadClient.exportModel(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectPreset = (preset: CADPreset) => {
    setCode(preset.code);
    runCode(preset.code);
  };

  const handleModelSelect = (modelId: string, modelObj?: AIModelOption) => {
    setSelectedModel(modelId);
    if (modelObj && !availableModels.some((m) => m.id === modelObj.id)) {
      setAvailableModels((prev) => [...prev, modelObj]);
    }
  };

  const activeKeysCount = keyPool.filter((k) => k.isActive).length;
  const rateLimitedCount = keyPool.filter((k) => k.isRateLimited && (k.rateLimitedUntil || 0) > Date.now()).length;

  return (
    <div className="flex flex-col w-screen h-screen bg-background overflow-hidden select-none font-sans text-slate-100">
      {/* Top Header Navbar */}
      <HeaderNavbar
        onOpenTab={(tab) => setActiveSidebarTab((prev) => (prev === tab ? null : tab))}
        activeTab={activeSidebarTab}
        onExport={handleExport}
        isExporting={isExporting}
        activeKeysCount={activeKeysCount}
        rateLimitedCount={rateLimitedCount}
      />

      {/* Main Studio Workspace */}
      <div className="flex flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden">
        {/* Left Multi-Panel Sidebar (View Tools, IDE, Free Models Hub, BYOK Vault, Presets) */}
        <LeftSidebar
          activeTab={activeSidebarTab}
          onSelectTab={setActiveSidebarTab}
          // View Tools props
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
          // IDE props
          code={code}
          onChangeCode={(newVal) => setCode(newVal || '')}
          onRunCode={() => runCode(code)}
          isBuilding={isBuilding}
          errorMessage={errorMessage}
          // BYOK props
          keyPool={keyPool}
          onUpdateKeyPool={handleUpdateKeyPool}
          // Models props
          selectedModel={selectedModel}
          onSelectModel={handleModelSelect}
          // Presets props
          onSelectPreset={handleSelectPreset}
        />

        {/* Center 3D CAD Viewport */}
        <main className="flex-1 h-full relative overflow-hidden">
          <CADViewport
            ref={viewportRef}
            meshes={meshes}
            activePings={activePings}
            isBuilding={isBuilding}
            renderMode={renderMode}
            onSelectRenderMode={setRenderMode}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showAxes={showAxes}
            onToggleAxes={() => setShowAxes(!showAxes)}
            showEdges={showEdges}
            onToggleEdges={() => setShowEdges(!showEdges)}
            onClearPings={() => setActivePings([])}
          />

          {/* Key Rotation Failover Notification Toast */}
          {rotationToast && (
            <aside aria-label="Key failover notification" className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <ArrowRightLeft className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>Auto-Rotated API Key</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {rotationToast.reason}
                  </span>
                </span>
                <span className="text-slate-300 text-[11px]">
                  Switched from <strong className="text-amber-300">{rotationToast.fromKeyLabel}</strong> to{' '}
                  <strong className="text-emerald">{rotationToast.toKeyLabel}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRotationToast(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </aside>
          )}

          {/* Floating Dynamic Island HUD */}
          <DynamicIsland
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            currentStep={currentStep}
            activePings={activePings}
            keyPool={keyPool}
            selectedModel={selectedModel}
            onSelectModel={handleModelSelect}
            availableModels={availableModels}
            onOpenBYOKTab={() => setActiveSidebarTab('byok')}
            onOpenFreeModelsTab={() => setActiveSidebarTab('free_models')}
            onSelectPreset={handleSelectPreset}
            lastUsedKeyLabel={lastUsedKeyLabel}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
