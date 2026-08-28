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

        if (s.boundingBox) {
          const b = s.boundingBox;
          const min: [number, number, number] = [
            b.bounds?.[0] ?? b.min?.x ?? -10,
            b.bounds?.[1] ?? b.min?.y ?? -10,
            b.bounds?.[2] ?? b.min?.z ?? -10,
          ];
          const max: [number, number, number] = [
            b.bounds?.[3] ?? b.max?.x ?? 10,
            b.bounds?.[4] ?? b.max?.y ?? 10,
            b.bounds?.[5] ?? b.max?.z ?? 10,
          ];
          const center: [number, number, number] = [
            (min[0] + max[0]) / 2,
            (min[1] + max[1]) / 2,
            (min[2] + max[2]) / 2,
          ];
          const dimensions: [number, number, number] = [
            Math.abs(max[0] - min[0]),
            Math.abs(max[1] - min[1]),
            Math.abs(max[2] - min[2]),
          ];
          bbox = { min, max, center, dimensions };
        }

        meshes.push({
          id: `mesh_${i}`,
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
      self.postMessage({
        id,
        type: 'EVAL_ERROR',
        payload: {
          error: err?.message || String(err),
          executionTimeMs,
        },
      });
    }
    return;
  }

  if (type === 'EXPORT') {
    try {
      const { format } = payload;
      if (!lastShape) {
        throw new Error('No shape currently loaded to export.');
      }

      const shape = Array.isArray(lastShape)
        ? (lastShape[0]?.shape || lastShape[0])
        : (lastShape.shape || lastShape);

      let blob: Blob | null = null;
      let filename = `haicad_model_${Date.now()}`;

      if (format === 'step' || format === 'stp') {
        blob = shape.blobSTEP();
        filename += '.step';
      } else if (format === 'stl') {
        blob = shape.blobSTL({ binary: true });
        filename += '.stl';
      } else {
        throw new Error(`Export format ${format} is not supported directly.`);
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
