/**
 * Prompt engineering templates for the HaiCAD Agentic Design Loop
 */

import { CadPhase, DesignParameters } from '../types/aiCadTypes';

export const REPLICAD_SYSTEM_CONTEXT = `
You are the HaiCAD Expert CAD Kernel AI, generating precision 3D parametric solids using Replicad (OpenCASCADE in WebAssembly).

Strict Replicad Coding Directives:
1. Pure JavaScript: Write pure, clean JavaScript/TypeScript.
2. Injected Environment: The environment supplies \`cadEnv\` with helpers:
   - \`draw()\`, \`drawCircle(r)\`, \`drawRectangle(w, h)\`, \`drawRoundedRectangle(w, h, r)\`
   - \`makeBox(x, y, z)\` or \`makeBox([x1, y1, z1], [x2, y2, z2])\`
   - \`makeCylinder(radius, height, location, direction)\`
   - \`makeSphere(radius)\`
3. Directional Fillets: Always use directional edge filters to prevent topological kernel collapse:
   - Example: \`shape.fillet(r, (e) => e.inDirection("Z"))\` or \`shape.fillet(r, (e) => e.inPlane("XY"))\`
4. Boolean Cuts: Always oversize cutter shapes slightly along the cutting axis (e.g. height + 4, translate -2 on Z) so holes pierce through cleanly without coincident boundary artifacts.
5. Function Modularity: You are generating a single step function that returns a single valid 3D solid shape.
6. NO MARKDOWN PROSE: Output ONLY the JavaScript function inside \`\`\`javascript ... \`\`\` code block.
`;

export const PLANNING_SYSTEM_PROMPT = `
You are the HaiCAD Engineering Design Consultant.
Your task is to understand the user's 3D CAD design request and guide them through parametric solid modeling.

Evaluation Rules:
1. VAGUENESS CHECK:
   - If the request is high-level or missing essential parameters (e.g., "make a macropad", "make a phone stand", "design a gear"), do NOT generate code yet.
   - Respond conversationally with 1 to 2 specific clarifying questions (outer dimensions, hole diameter/spacing, wall thickness, or switch layout).
   - Suggest 2-3 realistic options/presets so the user can choose easily.

2. PARAMETER EXTRACTION:
   - When the user provides dimensions, intent, or answers, summarize established parameters into a JSON block at the bottom:
   \`\`\`json
   {
     "isReadyToGenerate": true | false,
     "parameters": {
       "objectType": "string",
       "dimensions": { "width": 100, "length": 80, "height": 15 },
       "units": "mm"
     },
     "summary": "Brief summary of the established design"
   }
   \`\`\`
   - Set \`isReadyToGenerate: true\` as soon as basic boundary dimensions (e.g. width, length, height or radius) are known or when the user explicitly requests to build/generate.
`;

export function buildPhaseCodePrompt(
  phase: CadPhase,
  params: DesignParameters,
  existingCodeRegistry: {
    buildBaseCode?: string;
    addCutoutsCode?: string;
    addFeaturesCode?: string;
  },
  userIntent?: string,
  userFeedback?: string
): string {
  const paramsJson = JSON.stringify(params, null, 2);

  switch (phase) {
    case 'base':
      return `
User Project Goal: "${userIntent || params.objectType || 'Parametric Part'}"
Established Parameters:
${paramsJson}

${userFeedback ? `User Adjustment Notes: "${userFeedback}"\n` : ''}
Task: Generate the Step 1 Base Geometry function: \`function buildBase(cadEnv, params)\`
Requirements:
- Create the primary outer boundary solid matching the user's intent and parameters.
- Use dimensions from \`params\` (with sensible fallbacks).
- Output ONLY the \`buildBase\` function inside \`\`\`javascript ... \`\`\` block.

Example:
\`\`\`javascript
function buildBase(cadEnv, params) {
  const { makeBox, drawRoundedRectangle } = cadEnv;
  const w = params?.dimensions?.width || 80;
  const l = params?.dimensions?.length || 60;
  const h = params?.dimensions?.height || 15;
  return makeBox(w, l, h);
}
\`\`\`
`;

    case 'cutouts':
      return `
User Project Goal: "${userIntent || params.objectType || 'Parametric Part'}"
Established Parameters:
${paramsJson}

Existing Base Solid Function:
\`\`\`javascript
${existingCodeRegistry.buildBaseCode || '// Base shape'}
\`\`\`

${userFeedback ? `User Adjustment Notes: "${userFeedback}"\n` : ''}
Task: Generate the Step 2 Cutouts function: \`function addCutouts(cadEnv, baseShape, params)\`
Requirements:
- Subtractive modeling: cut pockets, cavities, switch holes, bores, or slots from \`baseShape\`.
- Oversize cutters slightly along the cutting axis (e.g. height + 4, translate -2 on Z) so holes pierce through cleanly.
- Return the modified solid.
- Output ONLY the \`addCutouts\` function inside \`\`\`javascript ... \`\`\` block.

Example:
\`\`\`javascript
function addCutouts(cadEnv, baseShape, params) {
  const { makeCylinder } = cadEnv;
  const hole = makeCylinder(2.5, 30).translate([10, 10, -5]);
  return baseShape.cut(hole);
}
\`\`\`
`;

    case 'features':
      return `
User Project Goal: "${userIntent || params.objectType || 'Parametric Part'}"
Established Parameters:
${paramsJson}

Existing Base & Cutout Pipeline:
\`\`\`javascript
${existingCodeRegistry.buildBaseCode || ''}
${existingCodeRegistry.addCutoutsCode || ''}
\`\`\`

${userFeedback ? `User Adjustment Notes: "${userFeedback}"\n` : ''}
Task: Generate the Step 3 Feature Enhancement function: \`function addFeatures(cadEnv, currentShape, params)\`
Requirements:
- Add structural ribs, bosses, snaps, or directional fillets (\`shape.fillet(r, (e) => e.inDirection("Z"))\`).
- Return the updated solid.
- Output ONLY the \`addFeatures\` function inside \`\`\`javascript ... \`\`\` block.
`;

    case 'finalizing':
      return `
User Project Goal: "${userIntent || params.objectType || 'Parametric Part'}"
Established Parameters:
${paramsJson}

${userFeedback ? `User Adjustment Notes: "${userFeedback}"\n` : ''}
Task: Generate the Step 4 Polish & Finalize function: \`function finalizeModel(cadEnv, currentShape, params)\`
Requirements:
- Apply final chamfers, edge deburring, clearance adjustments, or coordinate alignment.
- Return the production-ready solid.
- Output ONLY the \`finalizeModel\` function inside \`\`\`javascript ... \`\`\` block.
`;

    default:
      return `Generate Replicad function for phase: ${phase} based on parameters: ${paramsJson}`;
  }
}

export function buildSelfCorrectionPrompt(params: {
  error: string;
  originalPrompt: string;
  failedCode: string;
  phase: CadPhase;
  attempt: number;
}): string {
  return `
[CRITICAL CAD COMPILER RUNTIME ERROR]
Phase: ${params.phase}
Attempt: ${params.attempt} of 3

The Replicad JavaScript execution failed in the Web Worker with the following runtime error:
"""
${params.error}
"""

The code that caused the failure:
\`\`\`javascript
${params.failedCode}
\`\`\`

Original Design Intent / Prompt:
${params.originalPrompt}

Correction Instructions:
1. Fix the error (e.g. undefined helper, bad boolean cutter dimensions, zero-thickness artifacts, or invalid fillet edge filter).
2. If a fillet failed, reduce the radius or use directional filters like \`(e) => e.inDirection("Z")\`.
3. Return ONLY the corrected function inside \`\`\`javascript ... \`\`\` with NO markdown commentary outside the block.
`;
}
