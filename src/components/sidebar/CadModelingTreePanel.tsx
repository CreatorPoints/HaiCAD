import React, { useState } from 'react';
import {
  Layers,
  Box,
  Circle,
  Square,
  Scissors,
  Sparkles,
  ArrowUpRight,
  Crosshair,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  Plus,
  ChevronRight,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';
import {
  CadFeature,
  CadToolMode,
  Transform3D,
  FaceNodePoint,
} from '../../cad/cadModelingState';

interface CadModelingTreePanelProps {
  features: CadFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
  onUpdateFeature: (id: string, updates: Partial<CadFeature>) => void;
  onAddFeature: (type: CadFeature['type'], customParams?: any) => void;
  onDeleteFeature: (id: string) => void;
  toolMode: CadToolMode;
  onSelectToolMode: (mode: CadToolMode) => void;
}

export const CadModelingTreePanel: React.FC<CadModelingTreePanelProps> = ({
  features,
  selectedFeatureId,
  onSelectFeature,
  onUpdateFeature,
  onAddFeature,
  onDeleteFeature,
  toolMode,
  onSelectToolMode,
}) => {
  const selectedFeature = features.find((f) => f.id === selectedFeatureId);

  const getIconForType = (type: CadFeature['type']) => {
    switch (type) {
      case 'box':
        return Box;
      case 'cylinder':
        return Circle;
      case 'sketch_2d':
        return Square;
      case 'extrude':
        return ArrowUpRight;
      case 'hole':
        return Scissors;
      case 'fillet':
        return Sparkles;
      case 'face_node':
      case 'face_cut':
        return Crosshair;
      default:
        return Box;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface select-none text-slate-200">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-subtle/80 border-b border-surface-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan" />
            <span>Parametric Feature Tree</span>
          </h2>
          <p className="text-[10px] text-slate-400">
            FreeCAD / Onshape feature hierarchy & body inspector
          </p>
        </div>

        {/* Quick Add Menu */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddFeature('box')}
            title="Add Box Body"
            className="p-1 rounded bg-surface border border-surface-border hover:border-cyan text-slate-300 hover:text-white transition-all"
          >
            <Box className="w-3.5 h-3.5 text-cyan" />
          </button>
          <button
            type="button"
            onClick={() => onAddFeature('cylinder')}
            title="Add Cylinder Pin"
            className="p-1 rounded bg-surface border border-surface-border hover:border-cyan text-slate-300 hover:text-white transition-all"
          >
            <Circle className="w-3.5 h-3.5 text-emerald" />
          </button>
          <button
            type="button"
            onClick={() => onAddFeature('hole')}
            title="Add Hole Cut"
            className="p-1 rounded bg-surface border border-surface-border hover:border-red-400 text-slate-300 hover:text-white transition-all"
          >
            <Scissors className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Feature Tree List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {features.length === 0 && (
          <div className="text-center p-6 text-slate-500 text-xs">
            No features in tree. Click a tool above or ask the AI to start modeling.
          </div>
        )}

        {features.map((feat, index) => {
          const Icon = getIconForType(feat.type);
          const isSelected = selectedFeatureId === feat.id;

          return (
            <div
              key={feat.id}
              onClick={() => onSelectFeature(feat.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan/15 border-cyan text-white shadow-md shadow-cyan/10 font-medium'
                  : 'bg-surface-subtle/50 hover:bg-surface-subtle border-surface-border text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 w-3">{index + 1}</span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    feat.type === 'hole'
                      ? 'bg-red-500/20 text-red-400'
                      : feat.type === 'fillet'
                      ? 'bg-cyan/20 text-cyan'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{feat.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {feat.type === 'box' && `${feat.params.width || 50}×${feat.params.length || 40}×${feat.params.height || 10} mm`}
                    {feat.type === 'cylinder' && `R${feat.params.radius || 15} H${feat.params.height || 30} mm`}
                    {feat.type === 'hole' && `Ø${feat.params.holeDiameter || 5} Depth ${feat.params.holeDepth || 20} mm`}
                    {feat.type === 'fillet' && `Radius ${feat.params.filletRadius || 2} mm`}
                    {feat.type === 'face_node' && `${feat.params.faceNodes?.length || 0} nodes on face`}
                    {feat.type === 'extrude' && `Depth ${feat.params.extrudeDepth || 10} mm`}
                    {feat.type === 'sketch_2d' && `2D Profile (${feat.params.plane || 'XY'})`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateFeature(feat.id, { enabled: !feat.enabled });
                  }}
                  className="p-1 text-slate-500 hover:text-white transition-colors"
                >
                  {feat.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFeature(feat.id);
                  }}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Feature Properties Inspector */}
      {selectedFeature && (
        <div className="p-3.5 bg-surface-subtle border-t border-surface-border space-y-3 shrink-0 select-text">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>{selectedFeature.name} Parameters</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">
              {selectedFeature.type}
            </span>
          </div>

          {/* Dimension Controls */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {selectedFeature.type === 'box' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Width (X mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.width || 50}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, width: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Length (Y mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.length || 40}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, length: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Height (Z mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.height || 10}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, height: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Corner Fillet (mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.filletRadius || 0}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, filletRadius: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
              </>
            )}

            {selectedFeature.type === 'cylinder' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Radius (mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.radius || 15}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, radius: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Height (mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.height || 30}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, height: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
              </>
            )}

            {selectedFeature.type === 'hole' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Hole Diameter (mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.holeDiameter || 5}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, holeDiameter: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Hole Depth (mm)</label>
                  <input
                    type="number"
                    value={selectedFeature.params.holeDepth || 20}
                    onChange={(e) =>
                      onUpdateFeature(selectedFeature.id, {
                        params: { ...selectedFeature.params, holeDepth: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-white font-mono"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
