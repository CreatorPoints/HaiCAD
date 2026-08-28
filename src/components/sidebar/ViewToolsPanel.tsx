import React from 'react';
import {
  Box,
  Eye,
  Layers,
  RotateCcw,
  Sparkles,
  Maximize2,
  Compass,
  Grid,
  Activity,
  Download,
  Info,
  Check,
} from 'lucide-react';
import { RenderMode } from '../CADViewport';
import { WorkerMeshOutput } from '../../cad/cadClient';

interface ViewToolsPanelProps {
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
}

export const ViewToolsPanel: React.FC<ViewToolsPanelProps> = ({
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
}) => {
  // Compute overall stats
  let totalTriangles = 0;
  let totalVertices = 0;
  let boundingBox = {
    min: [0, 0, 0],
    max: [0, 0, 0],
    dimensions: [0, 0, 0],
    center: [0, 0, 0],
  };

  if (meshes.length > 0) {
    meshes.forEach((m) => {
      totalTriangles += (m.mesh.triangles.length || 0) / 3;
      totalVertices += (m.mesh.vertices.length || 0) / 3;
    });

    if (meshes[0].boundingBox) {
      boundingBox = meshes[0].boundingBox;
    }
  }

  const renderModesList: Array<{ id: RenderMode; label: string; desc: string; iconColor: string }> = [
    { id: 'lit', label: 'Lit (Shaded)', desc: 'Standard studio lighting & depth (Default)', iconColor: 'bg-cyan-400' },
    { id: 'unlit', label: 'Unlit (Flat)', desc: 'Engineering flat color with 0 glare', iconColor: 'bg-slate-300' },
    { id: 'wireframe', label: 'Wireframe', desc: 'Vector polygon geometry mesh', iconColor: 'bg-emerald-400' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-5 select-none text-slate-200">
      {/* Header Description */}
      <div className="p-3 bg-surface-subtle/50 rounded-xl border border-surface-border flex items-start gap-2.5">
        <Compass className="w-4 h-4 text-cyan mt-0.5 shrink-0" />
        <p className="text-xs text-slate-300 leading-relaxed">
          Configure 3D viewport materials, projection angles, display guides, and inspect parametric geometry metrics.
        </p>
      </div>

      {/* Section 1: Surface Render Modes */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-primary-glow" /> Surface Shader Material
        </label>

        <div className="grid grid-cols-2 gap-2">
          {renderModesList.map((m) => {
            const isSelected = renderMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectRenderMode(m.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-primary/15 border-primary text-white shadow-md shadow-primary/10'
                    : 'bg-surface-subtle/60 border-surface-border hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{m.label}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${m.iconColor} ${isSelected ? 'ring-2 ring-primary' : ''}`} />
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Camera View Angles */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-primary-glow" /> Camera Projection Angles
          </label>
          <button
            type="button"
            onClick={onResetCamera}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-surface-subtle hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5 font-mono">
          <button
            type="button"
            onClick={() => onSetCameraView('iso')}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-slate-700 border border-surface-border text-center text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            ISO
          </button>
          <button
            type="button"
            onClick={() => onSetCameraView('top')}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-slate-700 border border-surface-border text-center text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            TOP (XY)
          </button>
          <button
            type="button"
            onClick={() => onSetCameraView('front')}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-slate-700 border border-surface-border text-center text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            FRONT (XZ)
          </button>
          <button
            type="button"
            onClick={() => onSetCameraView('right')}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-slate-700 border border-surface-border text-center text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            RIGHT (YZ)
          </button>
        </div>
      </div>

      {/* Section 3: Viewport Overlays */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary-glow" /> Display Guides & Overlays
        </label>

        <div className="space-y-2">
          {/* Grid Toggle */}
          <div
            onClick={onToggleGrid}
            className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle/70 border border-surface-border hover:border-slate-500 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Grid className="w-4 h-4 text-cyan" />
              <div>
                <div className="text-xs font-semibold text-white">3D Floor Grid</div>
                <div className="text-[10px] text-slate-400">Millimeter scale ground reference plane</div>
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                showGrid ? 'bg-primary' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showGrid ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Sharp Edges Toggle */}
          <div
            onClick={onToggleEdges}
            className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle/70 border border-surface-border hover:border-slate-500 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Box className="w-4 h-4 text-primary-glow" />
              <div>
                <div className="text-xs font-semibold text-white">OpenCASCADE Edge Lines</div>
                <div className="text-[10px] text-slate-400">High-contrast solid boundary curves</div>
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                showEdges ? 'bg-primary' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showEdges ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Coordinate Axes Toggle */}
          <div
            onClick={onToggleAxes}
            className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle/70 border border-surface-border hover:border-slate-500 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald" />
              <div>
                <div className="text-xs font-semibold text-white">Coordinate Axes (XYZ)</div>
                <div className="text-[10px] text-slate-400">RGB 3D orientation origin tripod</div>
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                showAxes ? 'bg-primary' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showAxes ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Live Geometry Inspection */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan" /> Parametric Solid Metrics
        </label>

        <div className="p-3 bg-surface-subtle/80 rounded-xl border border-surface-border space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Active Meshes:</span>
            <span className="font-semibold text-white">{meshes.length} Part{meshes.length === 1 ? '' : 's'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Triangles:</span>
            <span className="text-cyan-glow">{Math.round(totalTriangles).toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Bounding Box (W×D×H):</span>
            <span className="text-emerald font-semibold">
              {boundingBox.dimensions[0].toFixed(1)} × {boundingBox.dimensions[1].toFixed(1)} × {boundingBox.dimensions[2].toFixed(1)} mm
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Center Origin:</span>
            <span className="text-slate-300">
              [{boundingBox.center.map((n) => n.toFixed(1)).join(', ')}]
            </span>
          </div>
        </div>
      </div>

      {/* Section 5: Quick Export */}
      <div className="pt-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
          <Download className="w-3.5 h-3.5 text-emerald" /> Quick Export Solids
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onExport('step')}
            disabled={isExporting || meshes.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export STEP</span>
          </button>
          <button
            type="button"
            onClick={() => onExport('stl')}
            disabled={isExporting || meshes.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-surface-subtle hover:bg-slate-700 border border-surface-border text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export STL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
