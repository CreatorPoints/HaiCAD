import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// @ts-ignore
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { WorkerMeshOutput } from '../cad/cadClient';
import { RotateCcw, Crosshair } from 'lucide-react';
import { CadToolMode, Transform3D, FaceNodePoint } from '../cad/cadModelingState';

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
  toolMode?: CadToolMode;
  onUpdateTransform?: (transform: Partial<Transform3D>) => void;
  onAddFaceNode?: (node: FaceNodePoint) => void;
  snapGridSize?: number;
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
      toolMode = 'select',
      onUpdateTransform,
      onAddFaceNode,
      snapGridSize = 1,
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<any>(null);
    const transformControlsRef = useRef<any>(null);
    const meshGroupRef = useRef<THREE.Group>(new THREE.Group());
    const nodesGroupRef = useRef<THREE.Group>(new THREE.Group());
    const gridRef = useRef<THREE.GridHelper | null>(null);
    const axesRef = useRef<THREE.AxesHelper | null>(null);

    const [internalRenderMode, setInternalRenderMode] = useState<RenderMode>('lit');
    const [internalShowGrid, setInternalShowGrid] = useState<boolean>(true);
    const [internalShowAxes, setInternalShowAxes] = useState<boolean>(true);
    const [internalShowEdges, setInternalShowEdges] = useState<boolean>(true);

    const activeRenderMode = controlledRenderMode !== undefined ? controlledRenderMode : internalRenderMode;
    const activeShowGrid = controlledShowGrid !== undefined ? controlledShowGrid : internalShowGrid;
    const activeShowAxes = controlledShowAxes !== undefined ? controlledShowAxes : internalShowAxes;
    const activeShowEdges = controlledShowEdges !== undefined ? controlledShowEdges : internalShowEdges;

    const [viewOrientation, setViewOrientation] = useState<string>('ISO');
    const [hoveredFacePoint, setHoveredFacePoint] = useState<[number, number, number] | null>(null);

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

      // 3. WebGL Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height, true);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      currentMount.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 4. Studio CAD Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
      mainLight.position.set(150, -100, 200);
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0x90b0ff, 0.7);
      fillLight.position.set(-120, 150, 80);
      scene.add(fillLight);

      const bottomRimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
      bottomRimLight.position.set(0, 0, -100);
      scene.add(bottomRimLight);

      // 5. Engineering Workplane Grid (XY Plane)
      const grid = new THREE.GridHelper(300, 30, 0x00f0ff, 0x1e293b);
      grid.rotation.x = Math.PI / 2;
      grid.position.set(0, 0, 0);
      scene.add(grid);
      gridRef.current = grid;

      // 6. XYZ Coordinate Triad
      const axes = new THREE.AxesHelper(35);
      axes.position.set(0, 0, 0);
      scene.add(axes);
      axesRef.current = axes;

      // 7. Add Geometry & Nodes Groups
      scene.add(meshGroupRef.current);
      scene.add(nodesGroupRef.current);

      // 8. OrbitControls Setup (Hardstop engineering camera, zero glide damping)
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.target.set(0, 0, 10);
      controls.maxDistance = 1200;
      controls.minDistance = 2;
      controlsRef.current = controls;

      // 9. TransformControls Setup (3D Gizmo for Move / Rotate / Scale)
      const transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.size = 0.75;
      transformControls.addEventListener('dragging-changed', (event: any) => {
        controls.enabled = !event.value;
      });

      transformControls.addEventListener('change', () => {
        if (transformControls.object && onUpdateTransform) {
          const pos = transformControls.object.position;
          const rot = transformControls.object.rotation;
          const scl = transformControls.object.scale;

          let posX = Math.round(pos.x * 10) / 10;
          let posY = Math.round(pos.y * 10) / 10;
          let posZ = Math.round(pos.z * 10) / 10;

          if (snapGridSize > 0) {
            posX = Math.round(posX / snapGridSize) * snapGridSize;
            posY = Math.round(posY / snapGridSize) * snapGridSize;
            posZ = Math.round(posZ / snapGridSize) * snapGridSize;
          }

          onUpdateTransform({
            x: posX,
            y: posY,
            z: posZ,
            rotX: Math.round(rot.x * (180 / Math.PI)),
            rotY: Math.round(rot.y * (180 / Math.PI)),
            rotZ: Math.round(rot.z * (180 / Math.PI)),
            scaleX: Math.round(scl.x * 100) / 100,
            scaleY: Math.round(scl.y * 100) / 100,
            scaleZ: Math.round(scl.z * 100) / 100,
          });
        }
      });

      scene.add(transformControls as any);
      transformControlsRef.current = transformControls;

      // 10. Resize Observer
      const handleResize = () => {
        if (!currentMount || !renderer || !camera) return;
        const w = currentMount.clientWidth;
        const h = currentMount.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, true);
      };

      const resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(currentMount);
      window.addEventListener('resize', handleResize);

      // 11. Render Loop
      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
        cancelAnimationFrame(animationFrameId);
        controls.dispose();
        transformControls.dispose();
        if (currentMount && renderer.domElement) {
          currentMount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }, []);

    // Update Gizmo mode (Move / Rotate / Scale / Off)
    useEffect(() => {
      const tc = transformControlsRef.current;
      const group = meshGroupRef.current;
      if (!tc) return;

      if (toolMode === 'move') {
        tc.setMode('translate');
        if (group && group.children.length > 0) {
          tc.attach(group);
        }
      } else if (toolMode === 'rotate') {
        tc.setMode('rotate');
        if (group && group.children.length > 0) {
          tc.attach(group);
        }
      } else if (toolMode === 'scale') {
        tc.setMode('scale');
        if (group && group.children.length > 0) {
          tc.attach(group);
        }
      } else {
        tc.detach();
      }
    }, [toolMode, meshes]);

    // Material Generator based on Render Mode (Lit, Unlit, Wireframe)
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

      // Dispose existing
      while (group.children.length > 0) {
        const obj = group.children[0] as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
        group.remove(obj);
      }

      if (!meshes || meshes.length === 0) return;

      meshes.forEach((meshOut) => {
        const { mesh: meshData, edges: edgeData, color } = meshOut;
        if (!meshData.vertices || meshData.vertices.length === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(meshData.vertices, 3)
        );

        if (meshData.normals && meshData.normals.length > 0) {
          geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(meshData.vertices, 3)
          );
          geometry.setAttribute(
            'normal',
            new THREE.Float32BufferAttribute(meshData.normals, 3)
          );
        } else {
          geometry.computeVertexNormals();
        }

        if (meshData.triangles && meshData.triangles.length > 0) {
          geometry.setIndex(meshData.triangles);
        }

        const material = getMaterialForMode(activeRenderMode, color);
        const threeMesh = new THREE.Mesh(geometry, material);
        threeMesh.name = meshOut.name || 'CADPart';

        // Add Feature Edge Lines
        if (activeShowEdges && edgeData && edgeData.lines && edgeData.lines.length > 0) {
          const edgeGeom = new THREE.BufferGeometry();
          edgeGeom.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(edgeData.lines, 3)
          );
          const edgeMat = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            linewidth: 1.5,
            transparent: true,
            opacity: 0.85,
          });
          const lineSegments = new THREE.LineSegments(edgeGeom, edgeMat);
          threeMesh.add(lineSegments);
        }

        group.add(threeMesh);
      });

      // Recalculate camera framing on initial load
      if (group.children.length > 0 && cameraRef.current && controlsRef.current) {
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        controlsRef.current.target.copy(center);
      }
    }, [meshes, activeRenderMode, activeShowEdges]);

    // Handle Mouse Raycasting for Face Selection & Per-Face Node Placement
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (toolMode !== 'face_node') return;
      const mount = mountRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!mount || !camera || !scene) return;

      const rect = mount.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(meshGroupRef.current.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const pt = hit.point;
        const normal = hit.face ? [hit.face.normal.x, hit.face.normal.y, hit.face.normal.z] : [0, 0, 1];

        // Create visual node sphere marker
        const nodeSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xa855f7 })
        );
        nodeSphere.position.copy(pt);
        nodesGroupRef.current.add(nodeSphere);

        if (onAddFaceNode) {
          onAddFaceNode({
            id: 'node_' + Date.now(),
            x: Math.round(pt.x * 10) / 10,
            y: Math.round(pt.y * 10) / 10,
            z: Math.round(pt.z * 10) / 10,
            faceNormal: normal as [number, number, number],
          });
        }
      }
    };

    // Camera Preset Helper
    const handleCameraPreset = (preset: 'iso' | 'top' | 'front' | 'right') => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const target = controls.target.clone();
      const dist = 140;

      switch (preset) {
        case 'top':
          camera.position.set(target.x, target.y, target.z + dist);
          camera.up.set(0, 1, 0);
          setViewOrientation('TOP (XY)');
          break;
        case 'front':
          camera.position.set(target.x, target.y - dist, target.z);
          camera.up.set(0, 0, 1);
          setViewOrientation('FRONT (XZ)');
          break;
        case 'right':
          camera.position.set(target.x + dist, target.y, target.z);
          camera.up.set(0, 0, 1);
          setViewOrientation('RIGHT (YZ)');
          break;
        case 'iso':
        default:
          camera.position.set(target.x + 100, target.y - 100, target.z + 90);
          camera.up.set(0, 0, 1);
          setViewOrientation('ISO (3D)');
          break;
      }
      camera.lookAt(target);
      controls.update();
    };

    return (
      <div
        className="relative w-full h-full bg-[#0b0e14] overflow-hidden select-none"
        onPointerDown={handlePointerDown}
      >
        {/* Three.js Canvas Mount */}
        <div
          ref={mountRef}
          className={`w-full h-full absolute inset-0 ${
            toolMode === 'face_node' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
          }`}
        />

        {/* Viewport Floating Top Camera Presets */}
        <div className="absolute top-3 right-3 flex items-center gap-1 p-1 bg-surface/85 border border-surface-border rounded-xl shadow-xl backdrop-blur-md z-10">
          <button
            type="button"
            onClick={() => handleCameraPreset('iso')}
            className="px-2 py-0.5 text-xs font-mono rounded-lg hover:bg-surface-subtle text-slate-300 hover:text-white transition-all"
            title="Isometric 3D View"
          >
            ISO
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset('top')}
            className="px-2 py-0.5 text-xs font-mono rounded-lg hover:bg-surface-subtle text-slate-300 hover:text-white transition-all"
            title="Top (XY) View"
          >
            TOP
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset('front')}
            className="px-2 py-0.5 text-xs font-mono rounded-lg hover:bg-surface-subtle text-slate-300 hover:text-white transition-all"
            title="Front (XZ) View"
          >
            FRONT
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset('right')}
            className="px-2 py-0.5 text-xs font-mono rounded-lg hover:bg-surface-subtle text-slate-300 hover:text-white transition-all"
            title="Right (YZ) View"
          >
            RIGHT
          </button>

          <div className="w-px h-3 bg-surface-border mx-0.5" />

          <button
            type="button"
            onClick={() => handleCameraPreset('iso')}
            className="p-1 rounded-lg hover:bg-surface-subtle text-slate-400 hover:text-white transition-all"
            title="Reset Camera"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Viewport Bottom Status Bar */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2.5 px-3 py-1 bg-surface/85 border border-surface-border rounded-lg backdrop-blur-md z-10 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald" />
            <span className="text-slate-200">CAD Kernel</span>
          </div>
          <span className="text-surface-border">•</span>
          <div>
            Tool: <strong className="text-cyan uppercase">{toolMode}</strong>
          </div>
          <span className="text-surface-border">•</span>
          <div>
            View: <span className="text-white font-bold">{viewOrientation}</span>
          </div>
        </div>

        {/* Per-Face Node Mode HUD Notice */}
        {toolMode === 'face_node' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-purple-950/90 border border-purple-500/50 rounded-full shadow-lg text-purple-200 text-xs font-mono backdrop-blur-md z-20 animate-bounce">
            <Crosshair className="w-3.5 h-3.5 text-purple-400" />
            <span>Click on any 3D face to add a node & create cuts</span>
          </div>
        )}

        {/* Compiling HUD Indicator */}
        {isBuilding && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 bg-surface/90 border border-cyan/40 rounded-full shadow-lg backdrop-blur-md animate-pulse z-20">
            <div className="w-2 h-2 rounded-full bg-cyan animate-ping" />
            <span className="text-xs font-mono font-medium text-cyan">
              Compiling CAD geometry...
            </span>
          </div>
        )}
      </div>
    );
  }
);
