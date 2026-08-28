import React, { useState } from 'react';
import {
  Box,
  Circle,
  Square,
  Plus,
  Minus,
  Layers,
  Scissors,
  Repeat,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  Code2,
  Sparkles,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';

interface CadToolsPanelProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onRunCode: () => void;
}

interface CadToolItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'primitives' | 'sketch' | 'features' | 'dressup' | 'patterns' | 'booleans';
  defaultSnippet: string;
  paramsConfig: Array<{
    name: string;
    label: string;
    type: 'number' | 'select' | 'text';
    defaultVal: number | string;
    options?: string[];
  }>;
  generateCode: (params: Record<string, any>) => string;
}

const CAD_TOOLS: CadToolItem[] = [
  // --- 1. 3D Primitives (CSG) ---
  {
    id: 'box',
    name: 'Cube / Box',
    desc: 'Solid rectangular block with width, length, height',
    icon: Box,
    category: 'primitives',
    defaultSnippet: 'makeBox(50, 40, 10)',
    paramsConfig: [
      { name: 'width', label: 'Width (X mm)', type: 'number', defaultVal: 50 },
      { name: 'length', label: 'Length (Y mm)', type: 'number', defaultVal: 40 },
      { name: 'height', label: 'Height (Z mm)', type: 'number', defaultVal: 10 },
    ],
    generateCode: (p) => `makeBox(${p.width || 50}, ${p.length || 40}, ${p.height || 10})`,
  },
  {
    id: 'cylinder',
    name: 'Cylinder / Pin',
    desc: 'Round solid cylinder with radius and height',
    icon: Circle,
    category: 'primitives',
    paramsConfig: [
      { name: 'radius', label: 'Radius (mm)', type: 'number', defaultVal: 15 },
      { name: 'height', label: 'Height (mm)', type: 'number', defaultVal: 30 },
    ],
    defaultSnippet: 'makeCylinder(15, 30)',
    generateCode: (p) => `makeCylinder(${p.radius || 15}, ${p.height || 30})`,
  },
  {
    id: 'sphere',
    name: 'Sphere / Ball',
    desc: 'Solid spherical ball',
    icon: Circle,
    category: 'primitives',
    paramsConfig: [
      { name: 'radius', label: 'Radius (mm)', type: 'number', defaultVal: 20 },
    ],
    defaultSnippet: 'makeSphere(20)',
    generateCode: (p) => `makeSphere(${p.radius || 20})`,
  },
  {
    id: 'tube',
    name: 'Hollow Tube / Pipe',
    desc: 'Cylindrical pipe with outer & inner radius',
    icon: Circle,
    category: 'primitives',
    paramsConfig: [
      { name: 'outerRadius', label: 'Outer Radius (mm)', type: 'number', defaultVal: 20 },
      { name: 'innerRadius', label: 'Inner Radius (mm)', type: 'number', defaultVal: 15 },
      { name: 'height', label: 'Height (mm)', type: 'number', defaultVal: 40 },
    ],
    defaultSnippet: 'makeCylinder(20, 40).cut(makeCylinder(15, 44).translate([0, 0, -2]))',
    generateCode: (p) =>
      `makeCylinder(${p.outerRadius || 20}, ${p.height || 40}).cut(makeCylinder(${p.innerRadius || 15}, ${(p.height || 40) + 4}).translate([0, 0, -2]))`,
  },

  // --- 2. 2D Sketching & Profiles ---
  {
    id: 'rounded_rect',
    name: 'Rounded Rectangle Plate',
    desc: '2D rectangular profile with corner fillets, extruded',
    icon: Square,
    category: 'sketch',
    paramsConfig: [
      { name: 'width', label: 'Width (mm)', type: 'number', defaultVal: 60 },
      { name: 'length', label: 'Length (mm)', type: 'number', defaultVal: 40 },
      { name: 'filletRadius', label: 'Corner Radius (mm)', type: 'number', defaultVal: 5 },
      { name: 'thickness', label: 'Extrude Thickness (mm)', type: 'number', defaultVal: 6 },
    ],
    defaultSnippet: 'drawRoundedRectangle(60, 40, 5).sketchOnPlane("XY").extrude(6)',
    generateCode: (p) =>
      `drawRoundedRectangle(${p.width || 60}, ${p.length || 40}, ${p.filletRadius || 5}).sketchOnPlane("XY").extrude(${p.thickness || 6})`,
  },
  {
    id: 'circle_sketch',
    name: 'Circle Disc (Sketch)',
    desc: '2D circle extruded along Z axis',
    icon: Circle,
    category: 'sketch',
    paramsConfig: [
      { name: 'radius', label: 'Radius (mm)', type: 'number', defaultVal: 25 },
      { name: 'thickness', label: 'Thickness (mm)', type: 'number', defaultVal: 5 },
    ],
    defaultSnippet: 'drawCircle(25).sketchOnPlane("XY").extrude(5)',
    generateCode: (p) =>
      `drawCircle(${p.radius || 25}).sketchOnPlane("XY").extrude(${p.thickness || 5})`,
  },
  {
    id: 'polygon',
    name: 'Hexagon / N-Gon Profile',
    desc: 'Regular polygon sketch (e.g. nut or bolt head)',
    icon: Square,
    category: 'sketch',
    paramsConfig: [
      { name: 'radius', label: 'Outer Radius (mm)', type: 'number', defaultVal: 15 },
      { name: 'sides', label: 'Sides Count', type: 'number', defaultVal: 6 },
      { name: 'thickness', label: 'Thickness (mm)', type: 'number', defaultVal: 8 },
    ],
    defaultSnippet: 'draw().polygon(15, 6).sketchOnPlane("XY").extrude(8)',
    generateCode: (p) =>
      `draw().polygon(${p.radius || 15}, ${p.sides || 6}).sketchOnPlane("XY").extrude(${p.thickness || 8})`,
  },

  // --- 3. Feature Operations (Subtractive & Additive) ---
  {
    id: 'cut_hole',
    name: 'Through Hole (Cut)',
    desc: 'Subtractive cylinder bore cutting through solid',
    icon: Scissors,
    category: 'features',
    paramsConfig: [
      { name: 'diameter', label: 'Diameter (mm)', type: 'number', defaultVal: 6 },
      { name: 'depth', label: 'Hole Depth (mm)', type: 'number', defaultVal: 20 },
      { name: 'posX', label: 'Pos X (mm)', type: 'number', defaultVal: 0 },
      { name: 'posY', label: 'Pos Y (mm)', type: 'number', defaultVal: 0 },
    ],
    defaultSnippet: 'makeCylinder(3, 20).translate([0, 0, -2])',
    generateCode: (p) => {
      const r = (Number(p.diameter) || 6) / 2;
      return `makeCylinder(${r}, ${(p.depth || 20) + 4}).translate([${p.posX || 0}, ${p.posY || 0}, -2])`;
    },
  },
  {
    id: 'counterbore',
    name: 'Counterbore Screw Hole',
    desc: 'Stepped screw cavity with screw bore + bolt head recess',
    icon: Scissors,
    category: 'features',
    paramsConfig: [
      { name: 'boreDia', label: 'Screw Hole Dia (mm)', type: 'number', defaultVal: 3.5 },
      { name: 'headDia', label: 'Head Recess Dia (mm)', type: 'number', defaultVal: 6.5 },
      { name: 'headDepth', label: 'Head Recess Depth (mm)', type: 'number', defaultVal: 3 },
      { name: 'totalHeight', label: 'Total Plate Height (mm)', type: 'number', defaultVal: 10 },
    ],
    defaultSnippet: `// Counterbore Hole
const screwBore = makeCylinder(1.75, 14).translate([0, 0, -2]);
const headCavity = makeCylinder(3.25, 4).translate([0, 0, 7]);
const holeCutter = screwBore.fuse(headCavity);`,
    generateCode: (p) => {
      const rBore = (Number(p.boreDia) || 3.5) / 2;
      const rHead = (Number(p.headDia) || 6.5) / 2;
      const h = Number(p.totalHeight) || 10;
      const hDepth = Number(p.headDepth) || 3;
      return `// Counterbore Hole Cutter\nmakeCylinder(${rBore}, ${h + 4}).translate([0, 0, -2]).fuse(makeCylinder(${rHead}, ${hDepth + 1}).translate([0, 0, ${h - hDepth}]))`;
    },
  },

  // --- 4. Patterns & Arrays ---
  {
    id: 'polar_pcd',
    name: 'PCD Circular Bolt Circle (Polar)',
    desc: 'N holes evenly arrayed around a Pitch Circle Diameter',
    icon: Repeat,
    category: 'patterns',
    paramsConfig: [
      { name: 'pcdDia', label: 'Pitch Circle Dia PCD (mm)', type: 'number', defaultVal: 40 },
      { name: 'holeDia', label: 'Hole Diameter (mm)', type: 'number', defaultVal: 4 },
      { name: 'count', label: 'Hole Count (N)', type: 'number', defaultVal: 4 },
      { name: 'depth', label: 'Cut Depth (mm)', type: 'number', defaultVal: 15 },
    ],
    defaultSnippet: `// 4-Hole PCD Pattern
let boltCutters = null;
const pcdRadius = 20;
const count = 4;
for (let i = 0; i < count; i++) {
  const angle = (i * 2 * Math.PI) / count;
  const x = pcdRadius * Math.cos(angle);
  const y = pcdRadius * Math.sin(angle);
  const h = makeCylinder(2, 20).translate([x, y, -2]);
  boltCutters = boltCutters ? boltCutters.fuse(h) : h;
}`,
    generateCode: (p) => {
      const pcdR = (Number(p.pcdDia) || 40) / 2;
      const holeR = (Number(p.holeDia) || 4) / 2;
      const n = Number(p.count) || 4;
      const d = Number(p.depth) || 15;
      return `// ${n}-Hole PCD Array\nlet boltCutters = null;\nfor (let i = 0; i < ${n}; i++) {\n  const angle = (i * 2 * Math.PI) / ${n};\n  const x = ${pcdR} * Math.cos(angle);\n  const y = ${pcdR} * Math.sin(angle);\n  const h = makeCylinder(${holeR}, ${d + 4}).translate([x, y, -2]);\n  boltCutters = boltCutters ? boltCutters.fuse(h) : h;\n}`;
    },
  },
  {
    id: 'linear_pattern',
    name: 'Linear Grid Pattern',
    desc: 'X × Y grid array of holes or features',
    icon: Repeat,
    category: 'patterns',
    paramsConfig: [
      { name: 'cols', label: 'Columns (X Count)', type: 'number', defaultVal: 3 },
      { name: 'rows', label: 'Rows (Y Count)', type: 'number', defaultVal: 3 },
      { name: 'spacingX', label: 'Spacing X (mm)', type: 'number', defaultVal: 19 },
      { name: 'spacingY', label: 'Spacing Y (mm)', type: 'number', defaultVal: 19 },
      { name: 'holeDia', label: 'Hole Dia (mm)', type: 'number', defaultVal: 3 },
    ],
    defaultSnippet: `// 3x3 Grid Pattern
let gridCutters = null;
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const x = (c - 1) * 19;
    const y = (r - 1) * 19;
    const h = makeCylinder(1.5, 20).translate([x, y, -2]);
    gridCutters = gridCutters ? gridCutters.fuse(h) : h;
  }
}`,
    generateCode: (p) => {
      const cols = Number(p.cols) || 3;
      const rows = Number(p.rows) || 3;
      const sx = Number(p.spacingX) || 19;
      const sy = Number(p.spacingY) || 19;
      const hr = (Number(p.holeDia) || 3) / 2;
      return `// ${cols}x${rows} Grid Array\nlet gridCutters = null;\nfor (let r = 0; r < ${rows}; r++) {\n  for (let c = 0; c < ${cols}; c++) {\n    const x = (c - (${cols - 1}) / 2) * ${sx};\n    const y = (r - (${rows - 1}) / 2) * ${sy};\n    const h = makeCylinder(${hr}, 20).translate([x, y, -2]);\n    gridCutters = gridCutters ? gridCutters.fuse(h) : h;\n  }\n}`;
    },
  },

  // --- 5. Dress-up & Edge Modifiers ---
  {
    id: 'fillet',
    name: 'Fillet (Round Edges)',
    desc: 'Smooth curved round on edges (directional filter)',
    icon: Sparkles,
    category: 'dressup',
    paramsConfig: [
      { name: 'radius', label: 'Fillet Radius (mm)', type: 'number', defaultVal: 2 },
      {
        name: 'direction',
        label: 'Edge Filter',
        type: 'select',
        defaultVal: 'Z',
        options: ['Z', 'XY', 'All'],
      },
    ],
    defaultSnippet: 'shape.fillet(2, (e) => e.inDirection("Z"))',
    generateCode: (p) => {
      const r = p.radius || 2;
      if (p.direction === 'XY') return `.fillet(${r}, (e) => e.inPlane("XY"))`;
      if (p.direction === 'All') return `.fillet(${r})`;
      return `.fillet(${r}, (e) => e.inDirection("Z"))`;
    },
  },
  {
    id: 'chamfer',
    name: 'Chamfer (Bevel Edges)',
    desc: '45-degree flat bevel along edges',
    icon: Scissors,
    category: 'dressup',
    paramsConfig: [
      { name: 'distance', label: 'Chamfer Distance (mm)', type: 'number', defaultVal: 1.5 },
    ],
    defaultSnippet: 'shape.chamfer(1.5, (e) => e.inPlane("XY"))',
    generateCode: (p) => `.chamfer(${p.distance || 1.5}, (e) => e.inPlane("XY"))`,
  },

  // --- 6. Booleans & Transformations ---
  {
    id: 'fuse',
    name: 'Union (Fuse Shapes)',
    desc: 'Combine and weld shapeA with shapeB into a single solid',
    icon: Plus,
    category: 'booleans',
    paramsConfig: [],
    defaultSnippet: 'shapeA.fuse(shapeB)',
    generateCode: () => `.fuse(shapeB)`,
  },
  {
    id: 'cut',
    name: 'Cut (Subtract Shape)',
    desc: 'Subtract shapeB cavity from shapeA',
    icon: Minus,
    category: 'booleans',
    paramsConfig: [],
    defaultSnippet: 'shapeA.cut(shapeB)',
    generateCode: () => `.cut(shapeB)`,
  },
  {
    id: 'translate',
    name: 'Translate (Move [X, Y, Z])',
    desc: 'Shift position in 3D coordinate space',
    icon: Maximize2,
    category: 'booleans',
    paramsConfig: [
      { name: 'x', label: 'Offset X (mm)', type: 'number', defaultVal: 10 },
      { name: 'y', label: 'Offset Y (mm)', type: 'number', defaultVal: 0 },
      { name: 'z', label: 'Offset Z (mm)', type: 'number', defaultVal: 0 },
    ],
    defaultSnippet: '.translate([10, 0, 0])',
    generateCode: (p) => `.translate([${p.x || 0}, ${p.y || 0}, ${p.z || 0}])`,
  },
  {
    id: 'rotate',
    name: 'Rotate (Axis Angle)',
    desc: 'Rotate solid around specified pivot vector',
    icon: RotateCw,
    category: 'booleans',
    paramsConfig: [
      { name: 'angle', label: 'Angle (Degrees)', type: 'number', defaultVal: 90 },
      {
        name: 'axis',
        label: 'Rotation Axis',
        type: 'select',
        defaultVal: 'Z',
        options: ['Z', 'X', 'Y'],
      },
    ],
    defaultSnippet: '.rotate(90, [0, 0, 0], [0, 0, 1])',
    generateCode: (p) => {
      const a = p.angle || 90;
      const axisVec = p.axis === 'X' ? '[1, 0, 0]' : p.axis === 'Y' ? '[0, 1, 0]' : '[0, 0, 1]';
      return `.rotate(${a}, [0, 0, 0], ${axisVec})`;
    },
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Tools' },
  { id: 'primitives', label: '📦 3D Primitives' },
  { id: 'sketch', label: '📐 2D Sketches' },
  { id: 'features', label: '⚡ Features & Cuts' },
  { id: 'patterns', label: '🔄 Arrays & PCD' },
  { id: 'dressup', label: '✨ Fillet & Bevel' },
  { id: 'booleans', label: '🔀 Booleans & Transform' },
];

export const CadToolsPanel: React.FC<CadToolsPanelProps> = ({
  code,
  onChangeCode,
  onRunCode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTools =
    selectedCategory === 'all'
      ? CAD_TOOLS
      : CAD_TOOLS.filter((t) => t.category === selectedCategory);

  const activeTool = CAD_TOOLS.find((t) => t.id === activeToolId);

  const handleSelectTool = (tool: CadToolItem) => {
    setActiveToolId(tool.id);
    const initialParams: Record<string, any> = {};
    tool.paramsConfig.forEach((p) => {
      initialParams[p.name] = p.defaultVal;
    });
    setToolParams(initialParams);
  };

  const handleParamChange = (name: string, value: any) => {
    setToolParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInsertIntoScript = (tool: CadToolItem) => {
    const generatedCode = tool.generateCode(toolParams);

    // Smartly inject into existing code or create main()
    let updatedScript = code;

    if (!code || !code.includes('function main')) {
      updatedScript = `// Precision Parametric Solid (Replicad / OpenCASCADE)\nfunction main({ makeBox, makeCylinder, makeSphere, draw, drawCircle, drawRectangle, drawRoundedRectangle }) {\n  const shape = ${generatedCode};\n  return shape;\n}\n`;
    } else {
      // Append right before return in main
      const returnIndex = code.lastIndexOf('return ');
      if (returnIndex !== -1) {
        const insertion = `  // Added ${tool.name}\n  const ${tool.id}_part = ${generatedCode};\n  `;
        updatedScript =
          code.substring(0, returnIndex) +
          insertion +
          code.substring(returnIndex);
      } else {
        updatedScript = code + `\n// ${tool.name}\nconst ${tool.id}_part = ${generatedCode};\n`;
      }
    }

    onChangeCode(updatedScript);
    setTimeout(() => onRunCode(), 100);
    setActiveToolId(null);
  };

  const handleCopySnippet = (id: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface select-none text-slate-200">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-subtle/80 border-b border-surface-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan" />
            <span>CAD Modeling Workbench</span>
          </h2>
          <p className="text-[10px] text-slate-400">
            Select manual primitives, sketches, patterns, or boolean cutters
          </p>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="px-3 py-2 bg-surface-subtle/40 border-b border-surface-border flex gap-1 overflow-x-auto no-scrollbar shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-cyan text-black shadow-sm font-bold'
                : 'bg-surface border border-surface-border text-slate-400 hover:text-white hover:bg-surface-border'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = activeToolId === tool.id;

          return (
            <div
              key={tool.id}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? 'bg-surface-subtle border-cyan/50 shadow-md ring-1 ring-cyan/30'
                  : 'bg-surface-subtle/50 hover:bg-surface-subtle border-surface-border'
              }`}
            >
              <div
                onClick={() => handleSelectTool(tool)}
                className="p-3 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{tool.name}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {tool.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySnippet(tool.id, tool.defaultSnippet);
                    }}
                    title="Copy code snippet"
                    className="p-1 rounded hover:bg-surface text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedId === tool.id ? (
                      <Check className="w-3 h-3 text-emerald" />
                    ) : (
                      <Code2 className="w-3 h-3" />
                    )}
                  </button>
                  {isSelected ? (
                    <ChevronDown className="w-4 h-4 text-cyan" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Expanded Parameter Configurator */}
              {isSelected && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-surface-border/60 space-y-3 animate-in fade-in duration-150">
                  {tool.paramsConfig.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {tool.paramsConfig.map((param) => (
                        <div key={param.name} className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-300">
                            {param.label}
                          </label>
                          {param.type === 'select' ? (
                            <select
                              value={toolParams[param.name] ?? param.defaultVal}
                              onChange={(e) =>
                                handleParamChange(param.name, e.target.value)
                              }
                              className="w-full px-2 py-1 text-xs bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-cyan"
                            >
                              {param.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              value={toolParams[param.name] ?? param.defaultVal}
                              onChange={(e) =>
                                handleParamChange(
                                  param.name,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 text-xs bg-surface border border-surface-border rounded-lg text-white font-mono focus:outline-none focus:border-cyan"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Generated Code Preview */}
                  <div className="p-2 rounded-lg bg-[#141820] border border-surface-border text-[11px] font-mono text-cyan truncate select-text">
                    <code>{tool.generateCode(toolParams)}</code>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInsertIntoScript(tool)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-cyan hover:bg-cyan-hover text-black font-bold text-xs shadow-md shadow-cyan/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Insert & Rebuild</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveToolId(null)}
                      className="py-1.5 px-3 rounded-xl bg-surface border border-surface-border hover:bg-surface-border text-slate-300 text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
