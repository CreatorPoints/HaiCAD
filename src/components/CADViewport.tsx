import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WorkerMeshOutput } from '../cad/cadClient';
import { AIPingLocation } from '../services/aiService';
import { Box, Eye, Layers, Maximize2, RotateCcw, Sparkles } from 'lucide-react';

export type RenderMode = 'clay' | 'metallic' | 'wireframe' | 'xray';

export interface CADViewportHandle {
  setCameraView: (view: 'iso' | 'top' | 'front' | 'right') => void;
  resetCamera: () => void;
}

interface CADViewportProps {
  meshes: WorkerMeshOutput[];
  activePings: AIPingLocation[];
  isBuilding: boolean;
  onClearPings?: () => void;
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
      activePings,
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
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const meshGroupRef = useRef<THREE.Group | null>(null);
    const pingsGroupRef = useRef<THREE.Group | null>(null);

    // Local fallback states if not controlled
    const [localRenderMode, setLocalRenderMode] = useState<RenderMode>('clay');
    const [localShowGrid, setLocalShowGrid] = useState(true);
    const [localShowAxes, setLocalShowAxes] = useState(true);
    const [localShowEdges, setLocalShowEdges] = useState(true);

    const renderMode = controlledRenderMode !== undefined ? controlledRenderMode : localRenderMode;
    const showGrid = controlledShowGrid !== undefined ? controlledShowGrid : localShowGrid;
    const showAxes = controlledShowAxes !== undefined ? controlledShowAxes : localShowAxes;
    const showEdges = controlledShowEdges !== undefined ? controlledShowEdges : localShowEdges;

    const handleSelectRenderMode = (mode: RenderMode) => {
      if (onSelectRenderMode) onSelectRenderMode(mode);
      else setLocalRenderMode(mode);
    };

    const handleToggleGrid = () => {
      if (onToggleGrid) onToggleGrid();
      else setLocalShowGrid((v) => !v);
    };

    const handleToggleEdges = () => {
      if (onToggleEdges) onToggleEdges();
      else setLocalShowEdges((v) => !v);
    };

    // Camera Presets
    const setCameraView = (view: 'iso' | 'top' | 'front' | 'right') => {
      if (!cameraRef.current || !controlsRef.current) return;
      const target = controlsRef.current.target;
      const dist = 90;

      if (view === 'iso') {
        cameraRef.current.position.set(target.x + dist, target.y + dist, target.z + dist);
      } else if (view === 'top') {
        cameraRef.current.position.set(target.x, target.y + dist * 1.5, target.z + 0.01);
      } else if (view === 'front') {
        cameraRef.current.position.set(target.x, target.y, target.z + dist * 1.5);
      } else if (view === 'right') {
        cameraRef.current.position.set(target.x + dist * 1.5, target.y, target.z);
      }
      controlsRef.current.update();
    };

    const resetCamera = () => {
      if (!cameraRef.current || !controlsRef.current) return;
      cameraRef.current.position.set(70, 70, 70);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    };

    useImperativeHandle(ref, () => ({
      setCameraView,
      resetCamera,
    }));

    // Initialize Three.js Scene
    useEffect(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#090d16');
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
      camera.position.set(70, 70, 70);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      rendererRef.current = renderer;

      container.replaceChildren(renderer.domElement);

      // Orbit Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxDistance = 800;
      controls.minDistance = 2;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
      dirLight1.position.set(60, 100, 80);
      dirLight1.castShadow = true;
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.7);
      dirLight2.position.set(-60, -40, -60);
      scene.add(dirLight2);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.5);
      scene.add(hemiLight);

      // Grid & Ground
      const gridHelper = new THREE.GridHelper(200, 40, 0x3b82f6, 0x1e293b);
      gridHelper.position.y = -0.01;
      (gridHelper.material as THREE.Material).opacity = 0.45;
      (gridHelper.material as THREE.Material).transparent = true;
      gridHelper.name = 'grid';
      scene.add(gridHelper);

      // Coordinate Axes
      const axesHelper = new THREE.AxesHelper(25);
      axesHelper.name = 'axes';
      scene.add(axesHelper);

      // Groups
      const meshGroup = new THREE.Group();
      scene.add(meshGroup);
      meshGroupRef.current = meshGroup;

      const pingsGroup = new THREE.Group();
      scene.add(pingsGroup);
      pingsGroupRef.current = pingsGroup;

      // Animation Loop
      let animationFrameId: number;
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        controls.update();

        // Animate 3D Spatial Pings
        if (pingsGroupRef.current) {
          pingsGroupRef.current.children.forEach((child) => {
            if (child.name === 'radar-ring') {
              const ringMesh = child as THREE.Mesh;
              const scale = 1 + (Math.sin(elapsedTime * 4) + 1) * 0.4;
              ringMesh.scale.set(scale, scale, scale);
              if (ringMesh.material instanceof THREE.Material) {
                ringMesh.material.opacity = 0.8 - (scale - 1) * 0.7;
              }
            }
            if (child.name === 'ping-beacon') {
              child.position.y += Math.sin(elapsedTime * 6) * 0.03;
            }
          });
        }

        renderer.render(scene, camera);
      };

      animate();

      // Precision Resize Observer: handles sidebar/chat panel collapse & window resizing instantly
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        const w = containerRef.current.clientWidth || 1;
        const h = containerRef.current.clientHeight || 1;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h, true);
      };

      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);

      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    }, []);

    // Update Geometry & Edges when meshes change
    useEffect(() => {
      if (!meshGroupRef.current || !sceneRef.current) return;
      const group = meshGroupRef.current;

      // Clear old meshes
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }

      if (meshes.length === 0) return;

      const overallBox = new THREE.Box3();

      meshes.forEach((item) => {
        const { triangles, vertices, normals } = item.mesh;
        if (vertices.length === 0) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        if (normals.length > 0) {
          geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        } else {
          geometry.computeVertexNormals();
        }
        if (triangles.length > 0) {
          geometry.setIndex(triangles);
        }

        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          overallBox.union(geometry.boundingBox);
        }

        // Material based on current render mode
        let material: THREE.Material;
        if (renderMode === 'clay') {
          material = new THREE.MeshStandardMaterial({
            color: item.color || 0xd1d5db,
            roughness: 0.35,
            metalness: 0.15,
            side: THREE.DoubleSide,
          });
        } else if (renderMode === 'metallic') {
          material = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.2,
            metalness: 0.85,
            side: THREE.DoubleSide,
          });
        } else if (renderMode === 'wireframe') {
          material = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            wireframe: true,
          });
        } else {
          // X-Ray
          material = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            transmission: 0.85,
            opacity: 1,
            transparent: true,
            roughness: 0.1,
            ior: 1.4,
            side: THREE.DoubleSide,
          });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        // Render crisp CAD edge lines
        if (showEdges && item.edges?.lines && item.edges.lines.length > 0) {
          const edgeGeom = new THREE.BufferGeometry();
          edgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(item.edges.lines, 3));
          const edgeMat = new THREE.LineBasicMaterial({
            color: renderMode === 'wireframe' ? 0x0284c7 : 0x0f172a,
            linewidth: 1.5,
            transparent: true,
            opacity: 0.7,
          });
          const lineSegments = new THREE.LineSegments(edgeGeom, edgeMat);
          group.add(lineSegments);
        }
      });

      // Auto-frame camera on first build
      if (!overallBox.isEmpty() && cameraRef.current && controlsRef.current) {
        const center = new THREE.Vector3();
        overallBox.getCenter(center);
        controlsRef.current.target.copy(center);
      }
    }, [meshes, renderMode, showEdges]);

    // Update Live 3D Spatial Pings
    useEffect(() => {
      if (!pingsGroupRef.current) return;
      const pingsGroup = pingsGroupRef.current;

      // Clear old pings
      while (pingsGroup.children.length > 0) {
        const obj = pingsGroup.children[0];
        pingsGroup.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      }

      if (activePings.length === 0) return;

      activePings.forEach((ping) => {
        const [px, py, pz] = ping.position;

        // 1. Radar expanding ring
        const ringGeom = new THREE.RingGeometry(1.5, 2.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.set(px, py + 0.5, pz);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.name = 'radar-ring';
        pingsGroup.add(ringMesh);

        // 2. Glowing Core Beacon Sphere
        const sphereGeom = new THREE.SphereGeometry(1.2, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.5,
        });
        const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
        sphereMesh.position.set(px, py + 1.2, pz);
        sphereMesh.name = 'ping-beacon';
        pingsGroup.add(sphereMesh);

        // 3. Vertical laser beam indicator
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(px, py, pz),
          new THREE.Vector3(px, py + 12, pz),
        ]);
        const lineMat = new THREE.LineDashedMaterial({
          color: 0x06b6d4,
          dashSize: 1,
          gapSize: 0.5,
          transparent: true,
          opacity: 0.8,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        pingsGroup.add(line);
      });
    }, [activePings]);

    // Toggle Grid & Axes
    useEffect(() => {
      if (!sceneRef.current) return;
      const grid = sceneRef.current.getObjectByName('grid');
      if (grid) grid.visible = showGrid;
      const axes = sceneRef.current.getObjectByName('axes');
      if (axes) axes.visible = showAxes;
    }, [showGrid, showAxes]);

    return (
      <div className="relative w-full h-full overflow-hidden select-none bg-background">
        {/* 3D Canvas Mount Point */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating Top-Right Viewport Display Helpers */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-surface/80 backdrop-blur-md p-1.5 rounded-xl border border-surface-border shadow-lg z-10">
          <button
            type="button"
            onClick={handleToggleGrid}
            title="Toggle Ground Grid"
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              showGrid ? 'bg-primary/20 text-primary border border-primary/40' : 'text-slate-400 hover:bg-surface-subtle'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleEdges}
            title="Toggle Sharp CAD Edges"
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              showEdges ? 'bg-primary/20 text-primary border border-primary/40' : 'text-slate-400 hover:bg-surface-subtle'
            }`}
          >
            <Box className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetCamera}
            title="Reset Camera View"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-subtle transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Building / Compiling HUD Indicator */}
        {isBuilding && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 bg-surface/90 border border-cyan/40 rounded-full shadow-lg backdrop-blur-md animate-pulse z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
            <span className="text-xs font-mono font-medium text-cyan-glow">
              Compiling CAD OpenCASCADE geometry...
            </span>
          </div>
        )}

        {/* Active 3D Spatial Radar Overlay Badge (when live pings are active) */}
        {activePings.length > 0 && (
          <div className="absolute bottom-28 left-6 flex flex-col gap-2 max-w-sm pointer-events-none z-10">
            {activePings.map((ping) => (
              <div
                key={ping.id}
                className="flex items-center gap-2.5 p-2.5 bg-surface/95 border border-cyan/40 rounded-xl shadow-island-active backdrop-blur-md animate-subtle-float"
              >
                <div className="p-1.5 rounded-lg bg-cyan/20 text-cyan">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{ping.name}</span>
                    <span className="text-[10px] font-mono text-cyan-glow bg-cyan/10 px-1.5 py-0.5 rounded">
                      [{ping.position.map((p) => p.toFixed(0)).join(', ')}]
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300">{ping.action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
