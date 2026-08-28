# HaiCAD | AI-First Parametric CAD Studio ⚡

> **HaiCAD** is a browser-native, AI-first parametric 3D CAD generator powered by Google Gemini and OpenRouter. It transforms natural language instructions into real OpenCASCADE solid geometry with live spatial radar pings, autonomous smart model routing, and multi-format exports.

![HaiCAD Studio](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- 🛸 **Dynamic Island HUD**: Floating center island with prompt inputs, live reasoning stages, autonomous model badges, and quick action chips.
- 🧠 **Autonomous Smart AI Model Router**: Procedurally analyzes prompt intent and geometric complexity (parametric math, complex assemblies, precision fillets, error fixing) to automatically route requests to the best available model on the Google Free Tier or OpenRouter with task-specific expert directives.
- 🎛️ **Left Multi-Panel Activity Bar & Drawer**:
  - 🛠️ **View Tools**: Surface shaders (Clay, Titanium, X-Ray, Wireframe), camera angles (ISO, TOP, FRONT, RIGHT), display guides, and real-time bounding box metrics.
  - 💻 **CAD Script IDE**: Integrated Monaco Editor with bi-directional 3D viewport syncing and error diagnostics.
  - 🌐 **Free AI Hub**: Live OpenRouter catalog querying and filtering for Free models (`:free`), Code Specialists, and Reasoning engines.
  - 🔑 **BYOK Vault**: Unlimited multi-key storage with **smart auto-failover & rotation** on rate limits (429) or quota exhaustion.
  - 📁 **Preset Library**: Curated parametric templates (Mounting Bracket, Flanged Pipe, Heatsink, Spur Gear).
- 📍 **Live 3D Spatial Radar Pings**: Visual coordinate beacons and pulsing radar rings highlight the exact 3D coordinates being created, cut, or filleted in real-time.
- ⚙️ **Browser-Native B-Rep CAD Engine**: Powered by OpenCASCADE & Replicad in a Web Worker (WebAssembly). Zero server compute required.
- 📦 **Multi-Format Export**: Direct client-side export to standard **STEP** (`.step` / `.stp`) and **STL** (`.stl`) for 3D printing and CAD software.
- 🔄 **Self-Healing Geometry Loop**: Automatically detects CAD compilation/boolean errors and prompts the AI for instant repair.
- 🚀 **Firebase Hosting Ready**: Configured for Firebase Free Spark Tier hosting (`h-aicad`).

---

## 🛠️ Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **CAD Kernel**: OpenCASCADE.js / Replicad (WebAssembly in Web Worker)
- **3D Graphics**: Three.js + OrbitControls
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **AI Routing & Orchestration**: Autonomous Smart Router + Google Gemini API + OpenRouter API (Direct Client-Side BYOK)
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

## 🔑 Adding API Keys (BYOK Vault)

Open the **BYOK Vault** in the left sidebar to add unlimited keys for:
1. **Google Gemini API Key**: [Get a free key from Google AI Studio](https://aistudio.google.com/app/apikey)
2. **OpenRouter API Key**: [Get a key from OpenRouter](https://openrouter.ai/keys)

Keys are saved exclusively in your browser's local storage and connect directly from your browser to the respective APIs with automatic failover and rotation.

---

## 📄 License

MIT License © 2026 Shrestangsu Dutta (CreatorPoints)
