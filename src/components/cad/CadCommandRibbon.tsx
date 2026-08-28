import React from 'react';
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  Square,
  Circle,
  Scissors,
  Sparkles,
  ArrowUpRight,
  Layers,
  Sliders,
  Maximize,
  Minimize,
  Grid,
  Plus,
  Trash2,
  CornerDownRight,
  Split,
  Crosshair,
  Check,
} from 'lucide-react';
import {
  CadToolMode,
  CadFeature,
  Transform3D,
} from '../../cad/cadModelingState';

interface CadCommandRibbonProps {
  toolMode: CadToolMode;
  onSelectToolMode: (mode: CadToolMode) => void;
  selectedFeature: CadFeature | null;
  onUpdateTransform: (transform: Partial<Transform3D>) => void;
  onAddFeature: (type: CadFeature['type'], customParams?: any) => void;
  onDeleteSelectedFeature: () => void;
  snapGridSize: number;
  onSetSnapGridSize: (size: number) => void;
}

export const CadCommandRibbon: React.FC<CadCommandRibbonProps> = ({
  toolMode,
  onSelectToolMode,
  selectedFeature,
  onUpdateTransform,
  onAddFeature,
  onDeleteSelectedFeature,
  snapGridSize,
  onSetSnapGridSize,
}) => {
  const transform = selectedFeature?.transform || {
    x: 0,
    y: 0,
    z: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  };

  return (
    <div className="bg-[#10141d] border-b border-surface-border px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 select-none shadow-md z-30">
      {/* Group 1: 3D Direct Manipulation Tools */}
      <div className="flex items-center gap-1 bg-surface-subtle/80 p-1 rounded-xl border border-surface-border">
        <button
          type="button"
          onClick={() => onSelectToolMode('select')}
          title="Select Object / Face"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'select'
              ? 'bg-cyan text-black shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Select</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectToolMode('move')}
          title="Move Tool: Move any selected object accurately with 3D Gizmo & mm coordinates"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'move'
              ? 'bg-cyan text-black shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Move</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectToolMode('rotate')}
          title="Rotate Tool: Rotate solid around X, Y, or Z axis"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'rotate'
              ? 'bg-cyan text-black shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Rotate</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectToolMode('scale')}
          title="Scale Tool: Scale geometry dimensions"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'scale'
              ? 'bg-cyan text-black shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Scale</span>
        </button>
      </div>

      {/* Group 2: 2D Sketching & Section Workbench */}
      <div className="flex items-center gap-1 bg-surface-subtle/80 p-1 rounded-xl border border-surface-border">
        <button
          type="button"
          onClick={() => onSelectToolMode('sketch_section')}
          title="2D Section / Sketch Plane"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'sketch_section'
              ? 'bg-primary text-white shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Split className="w-3.5 h-3.5 text-primary-glow" />
          <span>Section (2D)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectToolMode('sketch_square');
            onAddFeature('sketch_2d', {
              sketchEntities: [{ id: 'sq_' + Date.now(), type: 'rectangle', x: 0, y: 0, width: 40, length: 30 }],
            });
          }}
          title="Square / Rectangle: Generate 2D parametric square sketch"
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            toolMode === 'sketch_square'
              ? 'bg-primary text-white shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Square className="w-3.5 h-3.5 text-cyan" />
          <span>Square</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectToolMode('sketch_circle');
            onAddFeature('sketch_2d', {
              sketchEntities: [{ id: 'cir_' + Date.now(), type: 'circle', x: 0, y: 0, radius: 20 }],
            });
          }}
          title="Circle: Generate 2D parametric circle sketch"
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            toolMode === 'sketch_circle'
              ? 'bg-primary text-white shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Circle className="w-3.5 h-3.5 text-emerald" />
          <span>Circle</span>
        </button>

        {/* Constraints */}
        <div className="w-px h-4 bg-surface-border mx-1" />

        <button
          type="button"
          onClick={() => onSelectToolMode('constraint_horizontal')}
          title="Horizontal Constraint: Constrain entities horizontally (y1 = y2)"
          className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-all ${
            toolMode === 'constraint_horizontal'
              ? 'bg-cyan/20 border-cyan text-cyan font-bold'
              : 'bg-surface border-surface-border text-slate-400 hover:text-white'
          }`}
        >
          ⬌ H-Constraint
        </button>

        <button
          type="button"
          onClick={() => onSelectToolMode('constraint_vertical')}
          title="Vertical Constraint: Constrain entities vertically (x1 = x2)"
          className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-all ${
            toolMode === 'constraint_vertical'
              ? 'bg-cyan/20 border-cyan text-cyan font-bold'
              : 'bg-surface border-surface-border text-slate-400 hover:text-white'
          }`}
        >
          ⬍ V-Constraint
        </button>
      </div>

      {/* Group 3: 3D Operations & Per-Face Direct Node Editing */}
      <div className="flex items-center gap-1 bg-surface-subtle/80 p-1 rounded-xl border border-surface-border">
        <button
          type="button"
          onClick={() => {
            onSelectToolMode('extrude');
            onAddFeature('extrude', { extrudeDepth: 15 });
          }}
          title="Extrude (Pad): Pull 2D sketch into 3D solid"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'extrude'
              ? 'bg-amber-400 text-black shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          <span>Extrude</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectToolMode('fillet');
            onAddFeature('fillet', { filletRadius: 2 });
          }}
          title="Fillet / Bevel: Round edges with radius"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'fillet'
              ? 'bg-cyan text-black shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan" />
          <span>Fillet</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectToolMode('make_hole');
            onAddFeature('hole', { holeDiameter: 4, holeDepth: 20 });
          }}
          title="Make Hole: Place subtractive hole / pocket"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'make_hole'
              ? 'bg-red-500 text-white shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-red-400" />
          <span>Make Hole</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectToolMode('face_node')}
          title="Per-Face Node & Cut (Blender-style): Click anywhere on any 3D face to add a node and make custom face cuts"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            toolMode === 'face_node'
              ? 'bg-purple-500 text-white shadow-sm font-bold'
              : 'text-slate-300 hover:text-white hover:bg-surface'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-purple-400" />
          <span>Add Node on Face</span>
        </button>
      </div>

      {/* Group 4: Exact Coordinate Positioning & Snapping (X, Y, Z mm) */}
      <div className="flex items-center gap-1.5 bg-surface-subtle/80 px-2.5 py-1 rounded-xl border border-surface-border text-xs font-mono">
        <span className="text-[10px] text-slate-500 font-semibold">POS (mm):</span>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-red-400 font-bold">X</span>
          <input
            type="number"
            value={transform.x}
            onChange={(e) => onUpdateTransform({ x: parseFloat(e.target.value) || 0 })}
            className="w-12 px-1 py-0.5 text-[11px] bg-surface border border-surface-border rounded text-white text-center focus:outline-none focus:border-cyan"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-emerald font-bold">Y</span>
          <input
            type="number"
            value={transform.y}
            onChange={(e) => onUpdateTransform({ y: parseFloat(e.target.value) || 0 })}
            className="w-12 px-1 py-0.5 text-[11px] bg-surface border border-surface-border rounded text-white text-center focus:outline-none focus:border-cyan"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-cyan font-bold">Z</span>
          <input
            type="number"
            value={transform.z}
            onChange={(e) => onUpdateTransform({ z: parseFloat(e.target.value) || 0 })}
            className="w-12 px-1 py-0.5 text-[11px] bg-surface border border-surface-border rounded text-white text-center focus:outline-none focus:border-cyan"
          />
        </div>

        {/* Snap Grid Toggle */}
        <select
          value={snapGridSize}
          onChange={(e) => onSetSnapGridSize(parseFloat(e.target.value) || 1)}
          title="Grid Snap Step"
          className="px-1.5 py-0.5 text-[10px] bg-surface border border-surface-border rounded text-slate-300 focus:outline-none focus:border-cyan ml-1 cursor-pointer"
        >
          <option value="1">Snap: 1mm</option>
          <option value="5">Snap: 5mm</option>
          <option value="10">Snap: 10mm</option>
          <option value="0">Snap: Off</option>
        </select>

        {selectedFeature && (
          <button
            type="button"
            onClick={onDeleteSelectedFeature}
            title="Delete Selected Body/Cut"
            className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
