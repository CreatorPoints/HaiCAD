/**
 * CAD Modeling State & Parametric Feature Tree Engine
 * Provides Onshape / FreeCAD interactive modeling, 2D sketcher, constraints, per-face editing, and direct 3D manipulation
 */

export type CadToolMode =
  | 'select'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'sketch_section'
  | 'sketch_square'
  | 'sketch_circle'
  | 'extrude'
  | 'fillet'
  | 'make_hole'
  | 'face_node'
  | 'face_cut'
  | 'constraint_horizontal'
  | 'constraint_vertical';

export interface Transform3D {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export interface FaceNodePoint {
  id: string;
  x: number;
  y: number;
  z: number;
  faceNormal?: [number, number, number];
}

export interface SketchEntity2D {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'point';
  x: number;
  y: number;
  width?: number;
  length?: number;
  radius?: number;
  x2?: number;
  y2?: number;
}

export interface SketchConstraint {
  id: string;
  type: 'horizontal' | 'vertical' | 'dimension' | 'coincident';
  entityId: string;
  targetEntityId?: string;
  value?: number;
}

export interface CadFeature {
  id: string;
  name: string;
  type:
    | 'box'
    | 'cylinder'
    | 'sketch_2d'
    | 'extrude'
    | 'hole'
    | 'fillet'
    | 'face_cut'
    | 'face_node';
  enabled: boolean;
  transform: Transform3D;
  params: {
    width?: number;
    length?: number;
    height?: number;
    radius?: number;
    filletRadius?: number;
    holeDiameter?: number;
    holeDepth?: number;
    extrudeDepth?: number;
    plane?: 'XY' | 'XZ' | 'YZ';
    sketchEntities?: SketchEntity2D[];
    sketchConstraints?: SketchConstraint[];
    faceNodes?: FaceNodePoint[];
    [key: string]: any;
  };
}

export const DEFAULT_INITIAL_FEATURES: CadFeature[] = [
  {
    id: 'feat_base_plate',
    name: 'Base Plate',
    type: 'box',
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
      width: 60,
      length: 50,
      height: 8,
      filletRadius: 2,
    },
  },
];

/**
 * Compiles visual CAD Feature Tree into clean, deterministic Replicad OpenCASCADE JavaScript
 */
export function generateReplicadCodeFromFeatures(features: CadFeature[]): string {
  if (!features || features.length === 0) {
    return `// Empty CAD Scene
function main({ makeBox }) {
  return makeBox(10, 10, 10);
}
`;
  }

  let code = `// Precision Parametric Solid (Onshape / FreeCAD Feature Tree)
function main({ makeBox, makeCylinder, makeSphere, draw, drawCircle, drawRectangle, drawRoundedRectangle }) {
  let model = null;
  const parts = [];
`;

  features.forEach((feat, index) => {
    if (!feat.enabled) return;
    const { x, y, z, rotX, rotY, rotZ } = feat.transform;

    let shapeExpr = '';

    switch (feat.type) {
      case 'box': {
        const w = feat.params.width || 50;
        const l = feat.params.length || 40;
        const h = feat.params.height || 10;
        shapeExpr = `makeBox(${w}, ${l}, ${h})`;
        if (feat.params.filletRadius && feat.params.filletRadius > 0) {
          shapeExpr += `.fillet(${feat.params.filletRadius}, (e) => e.inDirection("Z"))`;
        }
        break;
      }

      case 'cylinder': {
        const r = feat.params.radius || 15;
        const h = feat.params.height || 30;
        shapeExpr = `makeCylinder(${r}, ${h})`;
        break;
      }

      case 'sketch_2d':
      case 'extrude': {
        const plane = feat.params.plane || 'XY';
        const depth = feat.params.extrudeDepth || feat.params.height || 10;
        const entities = feat.params.sketchEntities || [];

        if (entities.length > 0) {
          const first = entities[0];
          if (first.type === 'rectangle') {
            shapeExpr = `drawRectangle(${first.width || 40}, ${first.length || 30}).sketchOnPlane("${plane}").extrude(${depth})`;
          } else if (first.type === 'circle') {
            shapeExpr = `drawCircle(${first.radius || 20}).sketchOnPlane("${plane}").extrude(${depth})`;
          } else {
            shapeExpr = `drawRectangle(40, 40).sketchOnPlane("${plane}").extrude(${depth})`;
          }
        } else {
          shapeExpr = `drawRectangle(40, 40).sketchOnPlane("${plane}").extrude(${depth})`;
        }
        break;
      }

      case 'hole': {
        const d = feat.params.holeDiameter || 5;
        const depth = feat.params.holeDepth || 20;
        const r = d / 2;
        shapeExpr = `makeCylinder(${r}, ${depth + 4})`;
        break;
      }

      case 'face_cut': {
        const nodes = feat.params.faceNodes || [];
        if (nodes.length >= 3) {
          const xs = nodes.map((n) => n.x);
          const ys = nodes.map((n) => n.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const w = Math.max(maxX - minX, 2);
          const l = Math.max(maxY - minY, 2);
          shapeExpr = `makeBox(${w}, ${l}, 20).translate([${(minX + maxX) / 2}, ${(minY + maxY) / 2}, -5])`;
        } else {
          shapeExpr = `makeCylinder(3, 20).translate([0, 0, -5])`;
        }
        break;
      }

      default:
        shapeExpr = `makeBox(20, 20, 20)`;
    }

    // Apply translations
    if (x !== 0 || y !== 0 || z !== 0) {
      shapeExpr += `.translate([${x}, ${y}, ${z}])`;
    }

    // Apply rotations
    if (rotZ !== 0) shapeExpr += `.rotate(${rotZ}, [0, 0, 0], [0, 0, 1])`;
    if (rotX !== 0) shapeExpr += `.rotate(${rotX}, [0, 0, 0], [1, 0, 0])`;
    if (rotY !== 0) shapeExpr += `.rotate(${rotY}, [0, 0, 0], [0, 1, 0])`;

    const varName = `feat_${index}_${feat.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (feat.type === 'hole' || feat.type === 'face_cut') {
      code += `  // Subtractive Feature: ${feat.name}\n  const ${varName} = ${shapeExpr};\n  if (model) { model = model.cut(${varName}); }\n\n`;
    } else {
      code += `  // Additive Feature: ${feat.name}\n  const ${varName} = ${shapeExpr};\n  if (!model) { model = ${varName}; } else { model = model.fuse(${varName}); }\n\n`;
    }
  });

  code += `  return model || makeBox(20, 20, 20);\n}\n`;
  return code;
}
