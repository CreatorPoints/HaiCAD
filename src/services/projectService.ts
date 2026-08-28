export interface CADProject {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  code: string;
  meshCount?: number;
}

const STORAGE_PROJECTS_KEY = 'haicad_projects_v2';

const ADJECTIVES = [
  'orbital', 'hex', 'stepper', 'titanium', 'precision', 'aero', 'pneumatic',
  'modular', 'flanged', 'linear', 'dynamic', 'robotic', 'cyber', 'micro',
  'quantum', 'helical', 'carbon', 'poly', 'servo', 'vector', 'matrix'
];

const NOUNS = [
  'bracket', 'housing', 'mount', 'chassis', 'flange', 'coupler', 'sprocket',
  'gearbox', 'enclosure', 'bushing', 'arm', 'spindle', 'nozzle', 'manifold',
  'adapter', 'pulley', 'actuator', 'strut', 'linkage', 'yoke'
];

export const DEFAULT_PROJECT_CODE = `// Precision Parametric Solid (Replicad / OpenCASCADE)
const PARAMS = {
  width: 40,
  length: 40,
  thickness: 4,
  centerBore: 8,
  mountingPCD: 28,
  holeDia: 3.2,
};

function main({ makeBox, makeCylinder }) {
  // Step 1: Base Plate Extrusion
  const base = makeBox(PARAMS.width, PARAMS.length, PARAMS.thickness);

  // Step 2: Center Bore Hole
  const centerHole = makeCylinder(PARAMS.centerBore / 2, PARAMS.thickness + 4).translate([0, 0, -2]);
  let solid = base.cut(centerHole);

  // Step 3: Bolt Pitch Circle Pattern
  const r = PARAMS.mountingPCD / 2;
  const bolt = makeCylinder(PARAMS.holeDia / 2, PARAMS.thickness + 4).translate([0, 0, -2]);

  const p1 = bolt.clone().translate([r, r, 0]);
  const p2 = bolt.clone().translate([-r, r, 0]);
  const p3 = bolt.clone().translate([-r, -r, 0]);
  const p4 = bolt.clone().translate([r, -r, 0]);

  solid = solid.cut(p1).cut(p2).cut(p3).cut(p4);

  return solid;
}
`;

/**
 * Generates a procedural project name and ID
 */
export function generateProceduralName(): { id: string; name: string } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const id = `${adj}-${noun}-${num}`;
  const name = `${adj.charAt(0).toUpperCase() + adj.slice(1)} ${noun.charAt(0).toUpperCase() + noun.slice(1)} #${num}`;
  return { id, name };
}

/**
 * Direct raw read from localStorage
 */
function readRawProjects(): CADProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read projects from localStorage:', e);
  }
  return [];
}

/**
 * Direct raw write to localStorage
 */
export function saveAllProjects(projects: CADProject[]): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Failed to save projects to localStorage:', e);
  }
}

/**
 * Creates default seed project object
 */
function createSeedProject(): CADProject {
  return {
    id: 'titanium-bracket-1001',
    name: 'Titanium Bracket #1001',
    description: 'Precision parametric mounting bracket designed in Replicad OpenCASCADE',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    code: DEFAULT_PROJECT_CODE,
    meshCount: 1,
  };
}

/**
 * Loads all projects from localStorage (sorted by most recently updated)
 */
export function loadAllProjects(): CADProject[] {
  const existing = readRawProjects();
  if (existing.length > 0) {
    return existing.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  const seed = createSeedProject();
  saveAllProjects([seed]);
  return [seed];
}

/**
 * Gets a single project by ID
 */
export function getProjectById(id: string): CADProject | null {
  const projects = readRawProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * Creates and persists a new project
 */
export function createProject(customName?: string, initialCode?: string, customId?: string): CADProject {
  const procedural = generateProceduralName();
  const id = customId || procedural.id;
  const name = customName || procedural.name;

  const newProject: CADProject = {
    id,
    name,
    description: `Parametric CAD solid designed in HaiCAD Studio`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    code: initialCode || DEFAULT_PROJECT_CODE,
    meshCount: 1,
  };

  const existing = readRawProjects().filter((p) => p.id !== id);
  const updated = [newProject, ...existing];
  saveAllProjects(updated);
  return newProject;
}

/**
 * Updates a specific project in place
 */
export function updateProject(updated: CADProject): void {
  const projects = readRawProjects();
  const index = projects.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    projects[index] = { ...updated, updatedAt: Date.now() };
  } else {
    projects.unshift({ ...updated, updatedAt: Date.now() });
  }
  saveAllProjects(projects);
}

/**
 * Deletes a project by ID
 */
export function deleteProject(id: string): CADProject[] {
  const projects = readRawProjects().filter((p) => p.id !== id);
  saveAllProjects(projects);
  return projects;
}

/**
 * Renames a project by ID
 */
export function renameProject(id: string, newName: string): CADProject | null {
  const projects = readRawProjects();
  const proj = projects.find((p) => p.id === id);
  if (proj) {
    proj.name = newName.trim() || proj.name;
    proj.updatedAt = Date.now();
    saveAllProjects(projects);
    return proj;
  }
  return null;
}
