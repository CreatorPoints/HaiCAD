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
6. NO MARKDOWN PROSE: When generating code, output ONLY the JavaScript function inside \`\`\`javascript ... \`\`\` code block. Do NOT include markdown summaries or conversational chatter outside the code block.
`;

export const PLANNING_SYSTEM_PROMPT = `
You are the HaiCAD Engineering Design Consultant.
Your task is to analyze user prompts for 3D CAD modeling requests.

Evaluation Rules:
1. VAGUENESS CHECK:
   - If the request is high-level, vague, or missing essential manufacturing parameters (e.g., "make a macropad", "make a phone stand", "design a gear", "mounting plate"), do NOT generate any CAD code.
   - Instead, respond politely and conversationally with 1 to 2 very specific engineering clarifying questions (such as outer dimensions, mounting hole diameters/spacing, wall thickness, or component clearance).
   - Suggest 2-3 common default presets if applicable (e.g., "e.g., 3x3 layout with 19.05mm switch spacing, or 4x4 layout?").

2. PARAMETER EXTRACTION:
   - When the user provides dimensions or answers, summarize what parameters are now established into a structured JSON block at the bottom:
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
   - Set \`isReadyToGenerate: true\` ONLY when enough key dimensions are defined to build the base geometry.
`;

export function buildPhaseCodePrompt(
  phase: CadPhase,
  params: DesignParameters,
  existingCodeRegistry: {
    buildBaseCode?: string;
    addCutoutsCode?: string;
    addFeaturesCode?: string;
  },
  userFeedback?: string
): string {
  const paramsJson = JSON.stringify(params, null, 2);

  switch (phase) {
    case 'base':
      return `
Design Parameters:
${paramsJson}

${userFeedback ? `User Modification Request: ${userFeedback}\n` : ''}
Task: Generate the Step 1 base function: \`function buildBase(cadEnv, params)\`
Requirements:
- Create the primary outer boundary solid for the ${params.objectType || 'part'}.
- Use \`params\` dimensions (or sensible defaults from the params provided).
- Output ONLY the \`buildBase\` function inside \`\`\`javascript ... \`\`\` block.

Example structure:
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
Design Parameters:
${paramsJson}

Existing Base Code:
${existingCodeRegistry.buildBaseCode || '// Base shape generated'}

${userFeedback ? `User Modification Request: ${userFeedback}\n` : ''}
Task: Generate the Step 2 cutout function: \`function addCutouts(cadEnv, baseShape, params)\`
Requirements:
- Cut internal cavities, component pockets, screw bores, mounting slots, or through-holes from \`baseShape\`.
- Remember to oversize cutters and use \`.cut(cutterShape)\`.
- Return the modified solid.
- Output ONLY the \`addCutouts\` function inside \`\`\`javascript ... \`\`\` block.

Example structure:
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
Design Parameters:
${paramsJson}

Existing Functions:
Base:
${existingCodeRegistry.buildBaseCode || ''}
Cutouts:
${existingCodeRegistry.addCutoutsCode || ''}

${userFeedback ? `User Modification Request: ${userFeedback}\n` : ''}
Task: Generate the Step 3 feature enhancement function: \`function addFeatures(cadEnv, currentShape, params)\`
Requirements:
- Add structural ribs, bosses, snaps, chamfers, or safe directional fillets (e.g. \`shape.fillet(r, (e) => e.inDirection("Z"))\`).
- Return the updated solid.
- Output ONLY the \`addFeatures\` function inside \`\`\`javascript ... \`\`\` block.
`;

    case 'finalizing':
      return `
Design Parameters:
${paramsJson}

Existing Model Pipeline:
Base + Cutouts + Features already defined.

${userFeedback ? `User Modification Request: ${userFeedback}\n` : ''}
Task: Generate the Step 4 finalization function: \`function finalizeModel(cadEnv, currentShape, params)\`
Requirements:
- Apply final edge deburring, edge chamfers, orientation transforms, or tolerance checks.
- Return the final production-ready solid.
- Output ONLY the \`finalizeModel\` function inside \`\`\`javascript ... \`\`\` block.
`;

    default:
      return `Generate Replicad code for phase: ${phase} based on parameters: ${paramsJson}`;
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
1. Analyze the exact error above (e.g. undefined helper, bad boolean cutter orientation, invalid fillet edge filter, or missing return).
2. Fix the code to ensure it executes cleanly without errors.
3. If a fillet failed, reduce the radius or use directional filters like \`(e) => e.inDirection("Z")\`.
4. Return ONLY the corrected function inside \`\`\`javascript ... \`\`\` with NO additional markdown commentary outside the block.
`;
}
