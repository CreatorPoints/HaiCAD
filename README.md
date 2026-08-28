# HaiCAD | Parametric 3D CAD Studio ⚡

> **HaiCAD** is a high-performance, browser-native parametric 3D CAD Studio powered by OpenCASCADE and WebAssembly. It provides real-time solid geometry modeling, multi-project workspace management, code-driven parametric modeling, and client-side STEP/STL exports.

---

## ✨ Features

- 🗂️ **Multi-Project Studio Architecture**:
  - **Root Project Dashboard (`/`)**: Manage, create, search, rename, and delete CAD projects with procedural engineering slugs.
  - **Isolated Workspaces (`/project/<id>`)**: Each project runs with isolated geometry states, OpenCASCADE scripts, and configurations.
- ⚙️ **Browser-Native B-Rep CAD Kernel**:
  - Powered by **OpenCASCADE.js** and **Replicad** running in dedicated Web Workers via WebAssembly.
  - 100% client-side computation with zero server overhead.
- 💻 **Integrated Monaco CAD Script IDE**:
  - Full-featured code editor with syntax highlighting, automatic layout, error diagnostics, and instant live code execution.
- 🎨 **Interactive 3D Viewport**:
  - Rendered with Three.js and customizable shaders: **Clay**, **Metallic**, **Wireframe**, and **X-Ray**.
  - Camera orientation presets: **ISO**, **Top (XY)**, **Front (XZ)**, **Right (YZ)**.
  - Coordinate axes, precision grid, and edge feature-line overlays.
- 📦 **1-Click Multi-Format CAD Export**:
  - Direct client-side export to standard **STEP (`.step`)** B-Rep solids and **STL (`.stl`)** 3D printing meshes.
- 🚀 **Ultra-Fast Builds & Firebase Hosting Ready**:
  - Optimized Vite bundler setup building in under 30 seconds.
  - Fully configured for instant deployment to Firebase Hosting (`https://h-aicad.web.app`).

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **CAD Kernel**: OpenCASCADE.js / Replicad (WebAssembly in Web Worker)
- **3D Graphics**: Three.js + OrbitControls
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Routing & State**: HTML5 History API + LocalStorage Project Persistence
- **Hosting**: Firebase Hosting (`https://h-aicad.web.app`)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

---

## 📄 License

MIT License © 2026 Shrestangsu Dutta (CreatorPoints)
