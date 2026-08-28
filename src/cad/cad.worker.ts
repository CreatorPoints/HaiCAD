import * as replicad from 'replicad';
import initOpenCascade from 'replicad-opencascadejs';
// @ts-ignore
import ocWasmUrl from 'replicad-opencascadejs/wasm?url';

let ocInitialized = false;
let ocInitPromise: Promise<void> | null = null;
let lastShape: any = null;

async function ensureOC() {
  if (ocInitialized) return;
  if (!ocInitPromise) {
    ocInitPromise = (async () => {
      const oc = await initOpenCascade({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) {
            return ocWasmUrl || '/replicad_single.wasm';
          }
          return file;
        },
      });
      replicad.setOC(oc);
      ocInitialized = true;

      // Attach standard CSG prototype aliases to Replicad Shapes
      try {
        const dummy = (replicad.makeBaseBox as any)(2, 2, 2);
        const proto = Object.getPrototypeOf(dummy);
        if (proto) {
          if (!proto.subtract && proto.cut) {
            proto.subtract = function (...args: any[]) {
              return this.cut(...args);
            };
          }
          if (!proto.difference && proto.cut) {
            proto.difference = function (...args: any[]) {
              return this.cut(...args);
            };
          }
          if (!proto.union && proto.fuse) {
            proto.union = function (...args: any[]) {
              return this.fuse(...args);
            };
          }
          if (!proto.intersection && proto.intersect) {
            proto.intersection = function (...args: any[]) {
              return this.intersect(...args);
            };
          }
        }
      } catch (err) {
        console.warn('Could not attach CSG prototype polyfills:', err);
      }
    })();
  }
  return ocInitPromise;
}

export interface WorkerMeshOutput {
  id: string;
  name: string;
  color?: string;
  mesh: {
    triangles: number[];
    vertices: number[];
    normals: number[];
  };
  edges: {
    lines: number[];
  };
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
    dimensions: [number, number, number];
  };
}

export interface EvalResult {
  success: boolean;
  meshes?: WorkerMeshOutput[];
  error?: string;
  executionTimeMs?: number;
}

// Friendly wrapper helpers for AI / User code
function createCADEnv() {
  const customMakeBox = (...args: any[]) => {
    if (args.length === 3 && typeof args[0] === 'number') {
      const [x, y, z] = args;
      return (replicad.makeBaseBox as any)(x, y, z);
    }
    if (args.length === 2 && Array.isArray(args[0]) && Array.isArray(args[1])) {
      return (replicad.makeBox as any)(args[0], args[1]);
    }
    if (args.length === 1 && typeof args[0] === 'number') {
      return (replicad.makeBaseBox as any)(args[0], args[0], args[0]);
    }
    return (replicad.makeBaseBox as any)(args[0] || 10, args[1] || 10, args[2] || 10);
  };

  const customMakeCylinder = (radius: number, height: number, location?: any, direction?: any) => {
    return replicad.makeCylinder(radius, height, location, direction);
  };

  const customMakeSphere = (radius: number) => {
    return replicad.makeSphere(radius);
  };

  return {
    ...replicad,
    draw: replicad.draw,
    drawCircle: replicad.drawCircle,
    drawRectangle: replicad.drawRectangle,
    drawRoundedRectangle: replicad.drawRoundedRectangle,
    makeBox: customMakeBox,
    makeBaseBox: replicad.makeBaseBox,
    makeCylinder: customMakeCylinder,
    makeSphere: customMakeSphere,
  };
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  if (type === 'INIT') {
    try {
      await ensureOC();
      self.postMessage({ id, type: 'INIT_SUCCESS' });
    } catch (err: any) {
      self.postMessage({ id, type: 'INIT_ERROR', error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'EVAL') {
    const startTime = performance.now();
    try {
      await ensureOC();

      const { code } = payload;
      const cadEnv = createCADEnv();

      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const runner = new AsyncFunction(
        'cadEnv',
        `
        "use strict";
        const {
          draw,
          drawCircle,
          drawRectangle,
          drawRoundedRectangle,
          makeBox,
          makeBaseBox,
          makeCylinder,
          makeSphere,
          makeCompound,
          makeHelix,
        } = cadEnv;

        ${code}

        if (typeof main === 'function') {
          return await main(cadEnv);
        }
        throw new Error("Your code must define a 'main(cadEnv)' function that returns a shape or array of shapes.");
        `
      );

      const result = await runner(cadEnv);
      lastShape = result;

      // Handle either single shape or array of shapes / named shapes
      const shapesToProcess: Array<{ shape: any; name: string; color?: string }> = [];

      if (Array.isArray(result)) {
        result.forEach((item, index) => {
          if (item && item.shape) {
            shapesToProcess.push({
              shape: item.shape,
              name: item.name || `Part_${index + 1}`,
              color: item.color,
            });
          } else if (item) {
            shapesToProcess.push({
              shape: item,
              name: `Part_${index + 1}`,
            });
          }
        });
      } else if (result && result.shape) {
        shapesToProcess.push({
          shape: result.shape,
          name: result.name || 'Model',
          color: result.color,
        });
      } else if (result) {
        shapesToProcess.push({
          shape: result,
          name: 'Model',
        });
      } else {
        throw new Error("The 'main' function did not return any shape.");
      }

      const meshes: WorkerMeshOutput[] = [];

      for (let i = 0; i < shapesToProcess.length; i++) {
        const item = shapesToProcess[i];
        const s = item.shape;

        if (typeof s.mesh !== 'function') {
          throw new Error(`Returned item [${item.name}] is not a valid 3D CAD Shape.`);
        }

        const meshData = s.mesh({ tolerance: 0.1, angularTolerance: 0.2 });
        let edgeData = { lines: [] as number[] };
        try {
          if (typeof s.meshEdges === 'function') {
            edgeData = s.meshEdges({ tolerance: 0.1, angularTolerance: 0.2 });
          }
        } catch (edgeErr) {
          console.warn('Could not extract edges for shape:', edgeErr);
        }

        let bbox = {
          min: [-10, -10, -10] as [number, number, number],
          max: [10, 10, 10] as [number, number, number],
          center: [0, 0, 0] as [number, number, number],
          dimensions: [20, 20, 20] as [number, number, number],
        };

        try {
          if (typeof s.boundingBox === 'function') {
            const b = s.boundingBox();
            if (b) {
              const min: [number, number, number] = [
                b.bounds?.min?.x ?? -10,
                b.bounds?.min?.y ?? -10,
                b.bounds?.min?.z ?? -10,
              ];
              const max: [number, number, number] = [
                b.bounds?.max?.x ?? 10,
                b.bounds?.max?.y ?? 10,
                b.bounds?.max?.z ?? 10,
              ];
              const dimensions: [number, number, number] = [
                max[0] - min[0],
                max[1] - min[1],
                max[2] - min[2],
              ];
              const center: [number, number, number] = [
                min[0] + dimensions[0] / 2,
                min[1] + dimensions[1] / 2,
                min[2] + dimensions[2] / 2,
              ];
              bbox = { min, max, center, dimensions };
            }
          }
        } catch (bboxErr) {
          console.warn('Could not compute exact bounding box:', bboxErr);
        }

        meshes.push({
          id: `mesh_${i}_${Date.now()}`,
          name: item.name,
          color: item.color,
          mesh: {
            triangles: Array.from(meshData.triangles || []),
            vertices: Array.from(meshData.vertices || []),
            normals: Array.from(meshData.normals || []),
          },
          edges: {
            lines: Array.from(edgeData.lines || []),
          },
          boundingBox: bbox,
        });
      }

      const executionTimeMs = performance.now() - startTime;

      self.postMessage({
        id,
        type: 'EVAL_SUCCESS',
        payload: {
          meshes,
          executionTimeMs,
        },
      });
    } catch (err: any) {
      const executionTimeMs = performance.now() - startTime;
      const errorStr = err?.message || String(err);
      self.postMessage({
        id,
        type: 'EVAL_ERROR',
        payload: {
          error: errorStr,
          executionTimeMs,
        },
      });
    }
    return;
  }

  if (type === 'EXPORT') {
    const { format } = payload;
    try {
      await ensureOC();

      if (!lastShape) {
        throw new Error('No compiled shape in memory to export. Build your model first.');
      }

      let primaryShape = lastShape;
      if (Array.isArray(lastShape)) {
        primaryShape = lastShape[0]?.shape || lastShape[0];
      } else if (lastShape && lastShape.shape) {
        primaryShape = lastShape.shape;
      }

      let blob: Blob;
      let filename = `model_${Date.now()}.${format}`;

      if (format === 'step' || format === 'stp') {
        if (typeof primaryShape.exportSTEP === 'function') {
          const stepContent = primaryShape.exportSTEP();
          blob = new Blob([stepContent], { type: 'application/step' });
        } else if (typeof primaryShape.blobSTEP === 'function') {
          blob = primaryShape.blobSTEP();
        } else {
          throw new Error('Shape does not support STEP export.');
        }
      } else if (format === 'stl') {
        if (typeof primaryShape.blobSTL === 'function') {
          blob = primaryShape.blobSTL({ tolerance: 0.05, angularTolerance: 0.1 });
        } else if (typeof primaryShape.exportSTL === 'function') {
          const stlContent = primaryShape.exportSTL({ tolerance: 0.05, angularTolerance: 0.1 });
          blob = new Blob([stlContent], { type: 'model/stl' });
        } else {
          throw new Error('Shape does not support STL export.');
        }
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      self.postMessage({
        id,
        type: 'EXPORT_SUCCESS',
        payload: {
          blob,
          filename,
        },
      });
    } catch (err: any) {
      self.postMessage({
        id,
        type: 'EXPORT_ERROR',
        payload: {
          error: err?.message || String(err),
        },
      });
    }
  }
};
