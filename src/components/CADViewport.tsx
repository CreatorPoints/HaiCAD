import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WorkerMeshOutput } from '../cad/cadClient';
import { Box, Eye, Layers, Maximize2, RotateCcw } from 'lucide-react';

export type RenderMode = 'lit' | 'unlit' | 'wireframe';

export interface CADViewportHandle {
  setCameraView: (view: 'iso' | 'top' | 'front' | 'right') => void;
  resetCamera: () => void;
}

interface CADViewportProps {
  meshes: WorkerMeshOutput[];
  isBuilding: boolean;
  renderMode?: RenderMode;
  onSelectRenderMode?: (mode: RenderMode) => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showAxes?: boolean;
  onToggleAxes?: () => void;
  showEdges?: boolean;
  onToggleEdges?: () => void;
}

export const CADViewport = forwardRef<CADViewportHandle, CADViewportProps>(
  (
    {
      meshes,
      isBuilding,
      renderMode: controlledRenderMode,
      onSelectRenderMode,
      showGrid: controlledShowGrid,
      onToggleGrid,
      showAxes: controlledShowAxes,
      onToggleAxes,
      showEdges: controlledShowEdges,
      onToggleEdges,
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<any>(null);
    const meshGroupRef = useRef<THREE.Group>(new THREE.Group());
    const gridRef = useRef<THREE.GridHelper | null>(null);
    const axesRef = useRef<THREE.AxesHelper | null>(null);

    // Fallback internal states if not controlled (Default: 'lit')
    const [internalRenderMode, setInternalRenderMode] = useState<RenderMode>('lit');
    const [internalShowGrid, setInternalShowGrid] = useState<boolean>(true);
    const [internalShowAxes, setInternalShowAxes] = useState<boolean>(true);
    const [internalShowEdges, setInternalShowEdges] = useState<boolean>(true);

    const activeRenderMode = controlledRenderMode !== undefined ? controlledRenderMode : internalRenderMode;
    const activeShowGrid = controlledShowGrid !== undefined ? controlledShowGrid : internalShowGrid;
    const activeShowAxes = controlledShowAxes !== undefined ? controlledShowAxes : internalShowAxes;
    const activeShowEdges = controlledShowEdges !== undefined ? controlledShowEdges : internalShowEdges;

    // Viewport Quick HUD
    const [viewOrientation, setViewOrientation] = useState<string>('ISO');

    // Imperative Handles for external triggers (e.g. from Left Tools Panel)
    useImperativeHandle(ref, () => ({
      setCameraView: (view: 'iso' | 'top' | 'front' | 'right') => {
        handleCameraPreset(view);
      },
      resetCamera: () => {
        handleCameraPreset('iso');
      },
    }));

    // Initialize Three.js Scene
    useEffect(() => {
      const currentMount = mountRef.current;
      if (!currentMount) return;

      const width = currentMount.clientWidth || 800;
      const height = currentMount.clientHeight || 600;

      // 1. Scene Setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0b0e14');
      sceneRef.current = scene;

      // 2. Camera Setup (Z-up coordinate space for CAD standard)
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
      camera.position.set(120, -120, 100);
      camera.up.set(0, 0, 1);
      cameraRef.current = camera;

      // 3. High-Quality WebGL Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height, true);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      rendererRef.current = renderer;
      currentMount.appendChild(renderer.domElement);

      // 4. Studio Lighting Rig
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(150, -100, 200);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
      fillLight.position.set(-150, 150, 100);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0x818cf8, 0.5);
      rimLight.position.set(0, 150, -100);
      scene.add(rimLight);

      // 5. CAD Precision Grid
      const grid = new THREE.GridHelper(400, 80, 0x00f0ff, 0x1e293b);
      grid.rotation.x = Math.PI / 2; // Orient to XY plane
      grid.position.z = -0.01; // Avoid z-fighting
      scene.add(grid);
      gridRef.current = grid;

      // 6. XYZ Coordinate Triad
      const axes = new THREE.AxesHelper(30);
      axes.position.set(0, 0, 0);
      scene.add(axes);
      axesRef.current = axes;

      // 7. Add Geometry Mesh Group
      scene.add(meshGroupRef.current);

      // 8. OrbitControls Setup (Hardstop engineering camera, zero glide damping)
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.target.set(0, 0, 10);
      controls.maxDistance = 1200;
      controls.minDistance = 2;
      controlsRef.current = controls;

      // 9. Render Loop
      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // 10. Robust Container ResizeObserver & Window Resize
      const handleResize = () => {
        if (!currentMount) return;
        const w = currentMount.clientWidth;
        const h = currentMount.clientHeight;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, true);
        }
      };

      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(currentMount);
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        if (currentMount && renderer.domElement) {
          currentMount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }, []);

    // Toggle Grid and Axes
    useEffect(() => {
      if (gridRef.current) gridRef.current.visible = activeShowGrid;
      if (axesRef.current) axesRef.current.visible = activeShowAxes;
    }, [activeShowGrid, activeShowAxes]);

    // Material Generator based on Render Mode (Clean CAD Shaders: Lit, Unlit, Wireframe)
    const getMaterialForMode = (mode: RenderMode, originalColor = '#3b82f6') => {
      switch (mode) {
        case 'unlit':
          return new THREE.MeshBasicMaterial({
            color: originalColor || '#38bdf8',
          });
        case 'wireframe':
          return new THREE.MeshBasicMaterial({
            color: '#00f0ff',
            wireframe: true,
          });
        case 'lit':
        default:
          return new THREE.MeshStandardMaterial({
            color: originalColor || '#3b82f6',
            roughness: 0.4,
            metalness: 0.1,
            flatShading: false,
          });
      }
    };

    // Update 3D Geometry Meshes from Web Worker Output
    useEffect(() => {
      const group = meshGroupRef.current;
      if (!group) return;

      // Clear existing geometry & prevent WebGL memory leaks
      while (group.children.length > 0) {
        const child = group.children[0] as THREE.Mesh;
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
        if (child.children) {
          child.children.forEach((c: any) => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
              if (Array.isArray(c.material)) c.material.forEach((m: any) => m.dispose());
              else c.material.dispose();
            }
          });
        }
        group.remove(child);
      }

      if (!meshes || meshes.length === 0) return;

      // Convert worker buffer to Three.js BufferGeometry
      meshes.forEach((meshData) => {
        const { mesh, edges, color, name } = meshData;
        if (!mesh || !mesh.vertices || mesh.vertices.length === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(mesh.vertices, 3)
        );
        if (mesh.normals && mesh.normals.length > 0) {
          geometry.setAttribute(
            'normal',
            new THREE.Float32BufferAttribute(mesh.normals, 3)
          );
        } else {
          geometry.computeVertexNormals();
        }
        if (mesh.triangles && mesh.triangles.length > 0) {
          geometry.setIndex(mesh.triangles);
        }

        const material = getMaterialForMode(activeRenderMode, color);
        const threeMesh = new THREE.Mesh(geometry, material);
        threeMesh.castShadow = true;
        threeMesh.receiveShadow = true;
        threeMesh.name = name || 'CAD_Part';
        group.add(threeMesh);

        // Edge Overlays (OpenCASCADE extracted Feature Lines)
        if (activeShowEdges && edges && edges.lines && edges.lines.length > 0) {
          const edgeGeom = new THREE.BufferGeometry();
          edgeGeom.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(edges.lines, 3)
          );
          const edgeMat = new THREE.LineBasicMaterial({
            color: activeRenderMode === 'wireframe' ? 0x00f0ff : 0x0f172a,
            linewidth: 1,
            transparent: true,
            opacity: 0.75,
          });
          const line = new THREE.LineSegments(edgeGeom, edgeMat);
          threeMesh.add(line);
        }
      });

      // Fit Camera to Bounding Box
      if (group.children.length > 0 && cameraRef.current && controlsRef.current) {
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 20);

        controlsRef.current.target.copy(center);
        cameraRef.current.position.set(
          center.x + maxDim * 1.5,
          center.y - maxDim * 1.5,
          center.z + maxDim * 1.2
        );
        cameraRef.current.lookAt(center);
        controlsRef.current.update();
      }
    }, [meshes, activeRenderMode, activeShowEdges]);

    // Preset Camera Orientations
    const handleCameraPreset = (preset: 'iso' | 'top' | 'front' | 'right') => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const group = meshGroupRef.current;
      if (!camera || !controls) return;

      const box = new THREE.Box3().setFromObject(group);
      const center = box.isEmpty() ? new THREE.Vector3(0, 0, 10) : box.getCenter(new THREE.Vector3());
      const size = box.isEmpty() ? new THREE.Vector3(40, 40, 40) : box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 40);

      controls.target.copy(center);

      switch (preset) {
        case 'iso':
          camera.position.set(center.x + maxDim * 1.6, center.y - maxDim * 1.6, center.z + maxDim * 1.3);
          setViewOrientation('ISO');
          break;
        case 'top':
          camera.position.set(center.x, center.y, center.z + maxDim * 2.5);
          setViewOrientation('TOP');
          break;
        case 'front':
          camera.position.set(center.x, center.y - maxDim * 2.5, center.z);
          setViewOrientation('FRONT');
          break;
        case 'right':
          camera.position.set(center.x + maxDim * 2.5, center.y, center.z);
          setViewOrientation('RIGHT');
          break;
      }
      camera.lookAt(center);
      controls.update();
    };

    return (
      <div className="relative w-full h-full bg-[#0b0e14] overflow-hidden select-none">
        {/* Three.js Canvas Mount */}
        <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Viewport Floating Top Controls Bar */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1 bg-surface/80 border border-surface-border rounded-2xl shadow-xl backdrop-blur-md z-10">
          <button
            type="button"
            onClick={() => handleCameraPreset('iso')}
            className="px-2.5 py-1 text-xs font-mono rounded-xl hover:bg-surface-subtle text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Isometric 3D View"
          >
            ISO
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset('top')}
            className="px-2.5 py-1 text-xs font-mono rounded-xl hover:bg-surface-subtle text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Top (XY) View"
          >
            TOP
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset('front')}
            className="px-2.5 py-1 text-xs font-mono rounded-xl hover:bg-surface-subtle text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Front (XZ) View"
          >
            FRONT
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset('right')}
            className="px-2.5 py-1 text-xs font-mono rounded-xl hover:bg-surface-subtle text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Right (YZ) View"
          >
            RIGHT
          </button>

          <div className="w-px h-4 bg-surface-border mx-0.5" />

          <button
            type="button"
            onClick={() => handleCameraPreset('iso')}
            className="p-1.5 rounded-xl hover:bg-surface-subtle text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reset Camera Target"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Viewport Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-1.5 bg-surface/80 border border-surface-border rounded-xl backdrop-blur-md z-10 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald" />
            <span className="text-slate-200">OpenCASCADE Engine</span>
          </div>
          <span className="text-surface-border">•</span>
          <div>
            Meshes: <span className="text-cyan font-bold">{meshes.length}</span>
          </div>
          <span className="text-surface-border">•</span>
          <div>
            View: <span className="text-white font-bold">{viewOrientation}</span>
          </div>
        </div>

        {/* Building / Compiling HUD Indicator */}
        {isBuilding && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 bg-surface/90 border border-cyan/40 rounded-full shadow-lg backdrop-blur-md animate-pulse z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
            <span className="text-xs font-mono font-medium text-cyan-glow">
              Compiling OpenCASCADE geometry...
            </span>
          </div>
        )}
      </div>
    );
  }
);
