import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  Code2,
  Copy,
  Check,
  Sparkles,
  Box,
  Circle,
  Scissors,
  Layers,
  Repeat,
  Maximize2,
  ShieldAlert,
  Terminal,
  ExternalLink,
} from 'lucide-react';

interface CadDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode?: (code: string) => void;
}

interface DocSection {
  id: string;
  title: string;
  category: string;
  description: string;
  signature: string;
  codeExample: string;
  parameters: Array<{ name: string; type: string; desc: string }>;
  tips?: string[];
}

const COMPLETE_OPENCASCADE_DOCS: DocSection[] = [
  // --- 1. CORE SCRIPT STRUCTURE ---
  {
    id: 'main_entry',
    title: 'main(cadEnv) Script Entry Point',
    category: 'Core Architecture',
    description:
      'The primary entry function required in all HaiCAD scripts. Injected with all OpenCASCADE / Replicad kernel helpers.',
    signature: 'function main({ makeBox, makeCylinder, makeSphere, draw, drawCircle, drawRectangle, drawRoundedRectangle }) : Shape | Shape[]',
    codeExample: `function main({ makeBox, drawCircle }) {
  const base = makeBox(60, 40, 10);
  const hole = drawCircle(4).sketchOnPlane("XY").extrude(14).translate([0, 0, -2]);
  return base.cut(hole);
}`,
    parameters: [
      { name: 'cadEnv', type: 'Object', desc: 'Object containing all 2D/3D primitives and drawing functions' },
    ],
    tips: [
      'Always return a valid Shape object or an Array of Shapes.',
      'All dimensions are in millimeters (mm). Coordinates use standard Z-up standard CAD convention.',
    ],
  },

  // --- 2. 2D SKETCHING API ---
  {
    id: 'draw_sketch',
    title: 'draw() 2D Vector Path Builder',
    category: '2D Sketching',
    description:
      'Fluent 2D vector sketch path generator with lines, tangent arcs, three-point arcs, bulges, and bezier curves.',
    signature: 'draw(startPoint?: [x, y]): Drawing',
    codeExample: `// Custom L-profile sketch
const profile = draw([0, 0])
  .hLine(50)
  .vLine(10)
  .hLine(-35)
  .vLine(30)
  .hLine(-15)
  .close()
  .sketchOnPlane("XY")
  .extrude(20);`,
    parameters: [
      { name: 'startPoint', type: '[number, number]', desc: 'Starting 2D coordinate [x, y] (Defaults to [0, 0])' },
    ],
    tips: [
      '.hLine(dx) / .vLine(dy) move horizontally and vertically relative to current cursor.',
      '.hLineTo(x) / .vLineTo(y) move to absolute X or Y coordinate.',
      '.tangentArc([x, y]) creates an arc tangent to the previous segment.',
      '.threePointsArc([midX, midY], [endX, endY]) creates an arc passing through 3 points.',
      '.close() closes the loop back to the start point (mandatory before extrude).',
    ],
  },
  {
    id: 'draw_rounded_rectangle',
    title: 'drawRoundedRectangle(width, length, radius)',
    category: '2D Sketching',
    description:
      'Generates a 2D rectangular profile with rounded corners of specified radius.',
    signature: 'drawRoundedRectangle(width: number, length: number, radius: number, center?: [x, y]): Blueprint',
    codeExample: `// Plate with filleted corners
const plate = drawRoundedRectangle(80, 50, 5)
  .sketchOnPlane("XY")
  .extrude(6);`,
    parameters: [
      { name: 'width', type: 'number', desc: 'Total width along X axis in mm' },
      { name: 'length', type: 'number', desc: 'Total length along Y axis in mm' },
      { name: 'radius', type: 'number', desc: 'Corner fillet radius in mm' },
      { name: 'center', type: '[number, number]', desc: 'Optional 2D center offset [x, y]' },
    ],
    tips: ['Radius must be less than min(width, length) / 2 to prevent self-intersection.'],
  },
  {
    id: 'draw_circle',
    title: 'drawCircle(radius, center?)',
    category: '2D Sketching',
    description: 'Generates a 2D circular blueprint.',
    signature: 'drawCircle(radius: number, center?: [x, y]): Blueprint',
    codeExample: `// 50mm diameter disc
const disc = drawCircle(25)
  .sketchOnPlane("XY")
  .extrude(5);`,
    parameters: [
      { name: 'radius', type: 'number', desc: 'Radius of the circle in mm' },
      { name: 'center', type: '[number, number]', desc: 'Center offset [x, y] (Defaults to [0, 0])' },
    ],
    tips: ['To sketch on other planes, use .sketchOnPlane("XZ") or .sketchOnPlane("YZ").'],
  },
  {
    id: 'draw_polyshape',
    title: 'draw().polygon(radius, sides)',
    category: '2D Sketching',
    description: 'Generates regular N-gon polygon profile (e.g. Hexagon bolt heads, triangles, octagons).',
    signature: 'draw().polygon(radius: number, sides: number): Drawing',
    codeExample: `// M6 Hex nut head (6 sides)
const hexNut = draw()
  .polygon(10, 6)
  .sketchOnPlane("XY")
  .extrude(8);`,
    parameters: [
      { name: 'radius', type: 'number', desc: 'Outer bounding radius in mm' },
      { name: 'sides', type: 'number', desc: 'Number of polygon sides (3 for triangle, 6 for hexagon, 8 for octagon)' },
    ],
    tips: ['Great for fastener heads, stepper motor shafts, and parametric gears.'],
  },

  // --- 3. 3D PRIMITIVES ---
  {
    id: 'make_box',
    title: 'makeBox(x, y, z)',
    category: '3D Primitives',
    description: 'Constructs a 3D solid rectangular box centered at origin or from corner to corner.',
    signature: 'makeBox(x: number, y: number, z: number) | makeBox([x1, y1, z1], [x2, y2, z2]): Solid',
    codeExample: `// Box of 60x40x15 mm
const block = makeBox(60, 40, 15);`,
    parameters: [
      { name: 'x / width', type: 'number', desc: 'Dimension along X axis in mm' },
      { name: 'y / length', type: 'number', desc: 'Dimension along Y axis in mm' },
      { name: 'z / height', type: 'number', desc: 'Dimension along Z axis in mm' },
    ],
    tips: ['makeBox(w, l, h) creates a centered box. makeBox([0,0,0], [w,l,h]) creates from origin.'],
  },
  {
    id: 'make_cylinder',
    title: 'makeCylinder(radius, height, location?, direction?)',
    category: '3D Primitives',
    description: 'Constructs a 3D solid cylinder along Z axis or custom orientation vector.',
    signature: 'makeCylinder(radius: number, height: number, location?: [x,y,z], direction?: [x,y,z]): Solid',
    codeExample: `// Vertical pin
const pin = makeCylinder(8, 30);

// Angled pin located at [10, 20, 0] pointing along [0, 1, 0]
const shaft = makeCylinder(5, 50, [10, 20, 0], [0, 1, 0]);`,
    parameters: [
      { name: 'radius', type: 'number', desc: 'Radius of the cylinder in mm' },
      { name: 'height', type: 'number', desc: 'Length/height along axis in mm' },
      { name: 'location', type: '[number, number, number]', desc: 'Optional 3D base center location' },
      { name: 'direction', type: '[number, number, number]', desc: 'Optional 3D orientation direction vector' },
    ],
    tips: ['For through-holes, always oversize the cutter height by +2 to +4mm and translate -1 to -2mm on Z.'],
  },
  {
    id: 'make_sphere',
    title: 'makeSphere(radius, center?)',
    category: '3D Primitives',
    description: 'Constructs a perfect 3D spherical solid.',
    signature: 'makeSphere(radius: number, center?: [x, y, z]): Solid',
    codeExample: `const ball = makeSphere(15);`,
    parameters: [
      { name: 'radius', type: 'number', desc: 'Radius of the sphere in mm' },
    ],
    tips: ['Use with .intersect() or .cut() to create spherical pockets or dome caps.'],
  },
  {
    id: 'make_torus',
    title: 'makeTorus(majorRadius, minorRadius)',
    category: '3D Primitives',
    description: 'Constructs a 3D donut / O-ring shape.',
    signature: 'makeTorus(majorRadius: number, minorRadius: number): Solid',
    codeExample: `// O-Ring gasket (20mm ring radius, 2mm cross-section radius)
const oRing = makeTorus(20, 2);`,
    parameters: [
      { name: 'majorRadius', type: 'number', desc: 'Distance from torus center to tube center in mm' },
      { name: 'minorRadius', type: 'number', desc: 'Radius of the tube cross-section in mm' },
    ],
    tips: ['majorRadius must be greater than minorRadius.'],
  },
  {
    id: 'make_cone',
    title: 'makeCone(radius1, radius2, height)',
    category: '3D Primitives',
    description: 'Constructs a truncated or pointed conical solid (tapered shaft).',
    signature: 'makeCone(radius1: number, radius2: number, height: number): Solid',
    codeExample: `// Countersink cutter (5mm to 10mm taper over 4mm height)
const taper = makeCone(2.5, 5, 4);`,
    parameters: [
      { name: 'radius1', type: 'number', desc: 'Bottom radius in mm' },
      { name: 'radius2', type: 'number', desc: 'Top radius in mm (use 0 for sharp tip)' },
      { name: 'height', type: 'number', desc: 'Conical height in mm' },
    ],
    tips: ['Ideal for chamfer cutters, countersink screw cavities, and nozzle geometries.'],
  },

  // --- 4. EXTRUSION & ADVANCED 3D OPERATIONS ---
  {
    id: 'extrude',
    title: 'sketch.extrude(distance, options?)',
    category: 'Extrusion & Sweeps',
    description: 'Pulls a 2D sketch plane along its normal vector into a 3D solid.',
    signature: 'sketch.extrude(distance: number, options?: { twistAngle?: number }): Solid',
    codeExample: `// Extrude with 45 degree twist
const twistedSolid = drawRectangle(20, 20)
  .sketchOnPlane("XY")
  .extrude(60, { twistAngle: 45 });`,
    parameters: [
      { name: 'distance', type: 'number', desc: 'Extrusion length in mm' },
      { name: 'twistAngle', type: 'number', desc: 'Optional spiral twist angle in degrees' },
    ],
    tips: ['Always ensure the 2D sketch was closed with .close() before extruding.'],
  },
  {
    id: 'revolve',
    title: 'sketch.revolve(axis?, origin?, angle?)',
    category: 'Extrusion & Sweeps',
    description: 'Revolves a 2D profile 360° (or custom angle) around a rotational axis.',
    signature: 'sketch.revolve(axis?: [x,y,z], origin?: [x,y,z], angle?: number): Solid',
    codeExample: `// Turned shaft profile
const shaft = draw([0, 0])
  .hLine(15)
  .vLine(40)
  .hLine(-5)
  .vLine(20)
  .hLine(-10)
  .close()
  .sketchOnPlane("XZ")
  .revolve([0, 0, 1]);`,
    parameters: [
      { name: 'axis', type: '[number, number, number]', desc: 'Revolution axis vector (Defaults to [0, 0, 1])' },
      { name: 'origin', type: '[number, number, number]', desc: 'Pivot center point' },
      { name: 'angle', type: 'number', desc: 'Revolution angle in degrees (Defaults to 360)' },
    ],
    tips: ['Profile must be entirely on one side of the revolution axis (no crossing).'],
  },
  {
    id: 'loft',
    title: 'sketch.loftWith(otherSketches[], options?)',
    category: 'Extrusion & Sweeps',
    description: 'Smoothly skins and lofts between two or more 2D sketch cross-sections.',
    signature: 'sketch.loftWith(otherSketches: Sketch[], options?: { ruled?: boolean }): Solid',
    codeExample: `const bottomSketch = drawCircle(20).sketchOnPlane("XY", [0, 0, 0]);
const topSketch = drawRoundedRectangle(30, 30, 4).sketchOnPlane("XY", [0, 0, 40]);
const loftedSolid = bottomSketch.loftWith([topSketch]);`,
    parameters: [
      { name: 'otherSketches', type: 'Sketch[]', desc: 'Array of sequential 2D cross-sections' },
      { name: 'ruled', type: 'boolean', desc: 'True for straight faceted faces, false for smooth NURBS skinning' },
    ],
    tips: ['Ensure all cross-sections have the same winding direction to avoid twisted surfaces.'],
  },

  // --- 5. BOOLEAN CSG OPERATIONS ---
  {
    id: 'boolean_cut',
    title: 'shapeA.cut(shapeB) (Subtractive Modeling)',
    category: 'Booleans & CSG',
    description: 'Subtracts shapeB volume from shapeA. Aliased to .subtract() and .difference().',
    signature: 'shapeA.cut(shapeB: Shape): Shape',
    codeExample: `const plate = makeBox(80, 80, 10);
const bore = makeCylinder(15, 14).translate([0, 0, -2]);
const hollowPlate = plate.cut(bore);`,
    parameters: [
      { name: 'shapeB', type: 'Shape', desc: 'Cutter solid to subtract' },
    ],
    tips: [
      'CRITICAL: Cutter shapes must slightly overshoot the target along the cutting axis to avoid coincident boundary artifacts in OpenCASCADE.',
    ],
  },
  {
    id: 'boolean_fuse',
    title: 'shapeA.fuse(shapeB) (Additive Union)',
    category: 'Booleans & CSG',
    description: 'Fuses and welds shapeA and shapeB into a single unified watertight solid. Aliased to .union().',
    signature: 'shapeA.fuse(shapeB: Shape): Shape',
    codeExample: `const base = makeBox(60, 40, 10);
const boss = makeCylinder(10, 15).translate([0, 0, 5]);
const welded = base.fuse(boss);`,
    parameters: [
      { name: 'shapeB', type: 'Shape', desc: 'Solid to fuse' },
    ],
    tips: ['Shapes must touch or overlap for a valid union solid.'],
  },
  {
    id: 'boolean_intersect',
    title: 'shapeA.intersect(shapeB) (Common Volume)',
    category: 'Booleans & CSG',
    description: 'Keeps only the overlapping common volume of shapeA and shapeB. Aliased to .intersection().',
    signature: 'shapeA.intersect(shapeB: Shape): Shape',
    codeExample: `const box = makeBox(30, 30, 30);
const sphere = makeSphere(18);
const roundedBox = box.intersect(sphere);`,
    parameters: [
      { name: 'shapeB', type: 'Shape', desc: 'Intersecting solid' },
    ],
    tips: ['Great for pillowed surfaces, organic enclosures, and lens intersections.'],
  },

  // --- 6. EDGE FILLETING & DRESS-UP FILTERS ---
  {
    id: 'fillet_directional',
    title: 'shape.fillet(radius, filterFn)',
    category: 'Edge Dress-Up',
    description:
      'Applies rounded fillets to edges matching a directional, geometric, or spatial filter.',
    signature: 'shape.fillet(radius: number, filter?: (edge: Edge) => boolean): Shape',
    codeExample: `const body = makeBox(60, 40, 20);

// Round ONLY vertical corner edges (along Z axis)
const filletedCorners = body.fillet(4, (e) => e.inDirection("Z"));

// Round ONLY top/bottom flat perimeter edges (in XY plane)
const roundedFaces = filletedCorners.fillet(1.5, (e) => e.inPlane("XY"));`,
    parameters: [
      { name: 'radius', type: 'number', desc: 'Fillet radius in mm' },
      { name: 'filter', type: 'Function', desc: 'Edge selector filter callback' },
    ],
    tips: [
      'ALWAYS use directional filters like (e) => e.inDirection("Z") rather than filleting all edges at once, to prevent OpenCASCADE topological kernel collapse!',
      'Fillet radius must never exceed half of the shortest adjacent wall thickness.',
    ],
  },
  {
    id: 'chamfer',
    title: 'shape.chamfer(distance, filterFn)',
    category: 'Edge Dress-Up',
    description: 'Applies 45-degree flat bevel chamfers along selected edges.',
    signature: 'shape.chamfer(distance: number, filter?: (edge: Edge) => boolean): Shape',
    codeExample: `const block = makeBox(40, 40, 20);
// Bevel top face edges
const beveled = block.chamfer(2, (e) => e.inPlane("XY"));`,
    parameters: [
      { name: 'distance', type: 'number', desc: 'Chamfer depth in mm' },
      { name: 'filter', type: 'Function', desc: 'Edge selector filter callback' },
    ],
    tips: ['Chamfers are computationally more resilient than fillets and ideal for 3D print lead-ins.'],
  },
  {
    id: 'shell',
    title: 'shape.shell(thickness, filterFacesToKeepOpen?)',
    category: 'Edge Dress-Up',
    description: 'Hollows out a solid into a thin-walled enclosure / casing.',
    signature: 'shape.shell(thickness: number, filterFaces?: (face: Face) => boolean): Shape',
    codeExample: `// Macropad enclosure with top open
const enclosure = makeBox(80, 60, 20)
  .fillet(3, (e) => e.inDirection("Z"))
  .shell(2.5, (f) => f.inPlane("XY", 20));`,
    parameters: [
      { name: 'thickness', type: 'number', desc: 'Wall thickness in mm (negative for inward shell)' },
      { name: 'filterFaces', type: 'Function', desc: 'Face filter to remove (open top/bottom)' },
    ],
    tips: ['Filter by f.inPlane("XY", topZ) to keep the top face open.'],
  },

  // --- 7. SPATIAL TRANSFORMATIONS ---
  {
    id: 'translate',
    title: 'shape.translate([x, y, z])',
    category: 'Transformations',
    description: 'Translates and moves a shape in 3D coordinate space (returns new shape).',
    signature: 'shape.translate([dx, dy, dz]: [number, number, number]): Shape',
    codeExample: `const pin = makeCylinder(4, 20).translate([25, 15, 0]);`,
    parameters: [
      { name: 'offset', type: '[x, y, z]', desc: '3D translation offset vector in mm' },
    ],
    tips: ['translate() does NOT mutate in place; it returns a new translated shape.'],
  },
  {
    id: 'rotate',
    title: 'shape.rotate(degrees, origin?, axis?)',
    category: 'Transformations',
    description: 'Rotates a shape around a custom pivot point and orientation axis.',
    signature: 'shape.rotate(degrees: number, origin?: [x,y,z], axis?: [x,y,z]): Shape',
    codeExample: `// Rotate 90 degrees around Y axis
const horizontalShaft = makeCylinder(5, 40).rotate(90, [0, 0, 0], [0, 1, 0]);`,
    parameters: [
      { name: 'degrees', type: 'number', desc: 'Rotation angle in degrees' },
      { name: 'origin', type: '[x, y, z]', desc: 'Pivot center point (Defaults to [0, 0, 0])' },
      { name: 'axis', type: '[x, y, z]', desc: 'Rotation axis vector ([1,0,0]=X, [0,1,0]=Y, [0,0,1]=Z)' },
    ],
    tips: ['Degrees are standard angular units (0-360).'],
  },
  {
    id: 'mirror',
    title: 'shape.mirror(planeNormal, origin?)',
    category: 'Transformations',
    description: 'Mirrors a shape across a specified plane of symmetry.',
    signature: 'shape.mirror(planeNormal: [x,y,z], origin?: [x,y,z]): Shape',
    codeExample: `const leftBracket = makeBox(20, 40, 10);
const rightBracket = leftBracket.mirror([1, 0, 0]);`,
    parameters: [
      { name: 'planeNormal', type: '[x, y, z]', desc: 'Normal vector of the mirror plane' },
      { name: 'origin', type: '[x, y, z]', desc: 'Point on the mirror plane' },
    ],
    tips: ['Use to create symmetrical half-models (car bodies, ergonomic shells).'],
  },
];

const CATEGORIES = [
  'All',
  'Core Architecture',
  '2D Sketching',
  '3D Primitives',
  'Extrusion & Sweeps',
  'Booleans & CSG',
  'Edge Dress-Up',
  'Transformations',
];

export const CadDocumentationModal: React.FC<CadDocumentationModalProps> = ({
  isOpen,
  onClose,
  onInsertCode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredDocs = COMPLETE_OPENCASCADE_DOCS.filter((doc) => {
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.signature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.codeExample.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-5xl h-[85vh] bg-surface border border-surface-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-surface-subtle/80 border-b border-surface-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan/15 border border-cyan/30 text-cyan flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Complete OpenCASCADE & Replicad CAD Kernel Reference</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30 font-mono">
                  Full API Specs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Exhaustive engineering documentation of all 2D vector sketches, 3D solids, boolean CSG, filters, and transforms
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-6 py-3 bg-surface-subtle/40 border-b border-surface-border flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search functions, edge filters, primitives, booleans (e.g. fillet, revolve, cut)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan text-black font-bold shadow-sm'
                    : 'bg-surface border border-surface-border text-slate-400 hover:text-white hover:bg-surface-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Documentation Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No matching CAD kernel functions found for "{searchQuery}".
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-surface-subtle/60 border border-surface-border space-y-4 hover:border-slate-600 transition-colors shadow-sm"
              >
                {/* Title & Category */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-wide">{doc.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-surface-border text-cyan font-mono">
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{doc.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onInsertCode && (
                      <button
                        type="button"
                        onClick={() => {
                          onInsertCode(doc.codeExample);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan/15 hover:bg-cyan/25 border border-cyan/30 text-cyan text-xs font-semibold transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Insert Code</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(doc.id, doc.codeExample)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:bg-surface-subtle text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      {copiedId === doc.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald" />
                          <span className="text-emerald">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Function Signature */}
                <div className="p-2.5 rounded-xl bg-[#0e121a] border border-surface-border text-xs font-mono text-cyan truncate">
                  <code>{doc.signature}</code>
                </div>

                {/* Parameters Table */}
                {doc.parameters.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Parameters
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {doc.parameters.map((p) => (
                        <div
                          key={p.name}
                          className="p-2 rounded-lg bg-surface border border-surface-border/70 text-xs"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] mb-0.5">
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="text-cyan text-[10px]">{p.type}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{p.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Example */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Live Example Script
                  </span>
                  <pre className="p-3.5 rounded-xl bg-[#090d14] border border-surface-border text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    <code>{doc.codeExample}</code>
                  </pre>
                </div>

                {/* Pro Tips / Edge Cases */}
                {doc.tips && doc.tips.length > 0 && (
                  <div className="p-3 rounded-xl bg-cyan/5 border border-cyan/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Kernel Pro Tip
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-300">
                      {doc.tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
