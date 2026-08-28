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
5. Function Modularity: You are generating a single step function or a complete \`function main({ makeBox, draw, makeCylinder, drawRoundedRectangle }) { ... return shape; }\` script.
6. NO MARKDOWN PROSE OUTSIDE CODE: When asked for code, output ONLY the JavaScript function inside \`\`\`javascript ... \`\`\` code block.
`;

export function buildPlanningPrompt(currentEditorCode?: string): string {
  const codeContext = currentEditorCode && currentEditorCode.trim().length > 0
    ? `
[CURRENT ACTIVE CAD SCRIPT IN WORKSPACE IDE]:
\`\`\`javascript
${currentEditorCode.trim()}
\`\`\`
`
    : '// No existing CAD script in editor.';

  return `
You are the HaiCAD Engineering Design Consultant & Copilot.
You have real-time access to the exact CAD code currently loaded in the user's workspace IDE.
${codeContext}

EVALUATION & BEHAVIOR RULES:

1. EXISTING CODE / MODIFICATION REQUESTS:
   - If the user asks to modify, update, remove, add, or transform features of the current model (e.g., "remove holes", "make it 20mm taller", "add 4 fillets", "change screw diameter to 3mm", "make the base thicker", "chamfer edges"):
     - Inspect the [CURRENT ACTIVE CAD SCRIPT IN WORKSPACE IDE] above.
     - You ALREADY have full context of what the object is, what its dimensions are, and what cuts/holes it contains from the code.
     - Provide a brief summary of what you are changing, and output the FULL complete updated Replicad script inside a \`\`\`javascript block with \`function main({ makeBox, draw, makeCylinder, drawRoundedRectangle }) { ... return shape; }\`.
     - Include the JSON metadata block at the bottom with \`isReadyToGenerate: true\`.

2. ATTACHED VECTOR DRAWINGS (SVG) & BLUEPRINTS:
   - When an SVG vector drawing is attached, parse the viewBox, coordinates, dimensions, <rect>, <circle>, <polygon>, and <path> tags from the XML to reconstruct the precise 2D sketch and extrude into 3D CAD solids.

3. QUESTIONS / INSPECTIONS ONLY:
   - If the user is just asking a question (e.g., "what is this?", "explain the code", "what dimensions do we have?"), answer conversationally without generating default replacement shapes.

4. PARAMETER EXTRACTION:
   - Always output a structured JSON block at the bottom:
   \`\`\`json
   {
     "isReadyToGenerate": true | false,
     "parameters": {
       "objectType": "string",
       "dimensions": { "width": 100, "length": 80, "height": 15 },
       "units": "mm"
     },
     "summary": "Brief summary of the design or modification"
   }
   \`\`\`
`;
}

export function buildPhaseCodePrompt(
  phase: CadPhase,
  params: DesignParameters,
  existingCodeRegistry: {
    buildBaseCode?: string;
    addCutoutsCode?: string;
    addFeaturesCode?: string;
  },
  userIntent?: string,
  userFeedback?: string,
  currentEditorCode?: string
): string {
  const paramsJson = JSON.stringify(params, null, 2);
  const activeScript = currentEditorCode && currentEditorCode.trim().length > 0
    ? `
[CURRENT SCRIPT IN IDE]:
\`\`\`javascript
${currentEditorCode.trim()}
\`\`\`
`
    : '';

  switch (phase) {
    case 'base':
      return `
User Request / Intent: "${userIntent || params.objectType || 'Parametric Part'}"
${activeScript}
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
User Request / Intent: "${userIntent || params.objectType || 'Parametric Part'}"
${activeScript}
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
- If the user requested NO holes or to remove holes, return \`baseShape\` directly without cutting holes!
- Output ONLY the \`addCutouts\` function inside \`\`\`javascript ... \`\`\` block.
`;

    case 'features':
      return `
User Request / Intent: "${userIntent || params.objectType || 'Parametric Part'}"
${activeScript}
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
User Request / Intent: "${userIntent || params.objectType || 'Parametric Part'}"
${activeScript}
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
