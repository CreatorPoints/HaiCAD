/**
 * Code extraction, parsing, and multi-phase script assembly utilities for HaiCAD
 */

import { CadPhase, DesignParameters, PhaseCodeRegistry } from '../types/aiCadTypes';

/**
 * Extracts pure JavaScript/TypeScript code from model output
 */
export function extractCodeBlock(rawText: string): string {
  if (!rawText) return '';

  // Match ```javascript ... ``` or ```js ... ``` or ```ts ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/i;
  const match = rawText.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // If no code fence found, strip leading/trailing quotes and trim
  return rawText.trim();
}

/**
 * Extracts structured JSON block from model output
 */
export function extractJsonBlock<T = any>(rawText: string): T | null {
  if (!rawText) return null;

  const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const match = rawText.match(jsonRegex);
  const candidate = match && match[1] ? match[1].trim() : rawText.trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // Attempt fuzzy brace extraction
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Assembles modular phase functions into a complete Replicad main script
 */
export function assembleReplicadScript(
  params: DesignParameters,
  registry: {
    buildBaseCode?: string;
    addCutoutsCode?: string;
    addFeaturesCode?: string;
    finalizeModelCode?: string;
  },
  activePhase: CadPhase
): string {
  const paramsString = JSON.stringify(params || {}, null, 2);

  // Default fallback base function if none defined yet
  const defaultBaseCode = `
function buildBase(cadEnv, params) {
  const { makeBox } = cadEnv;
  const w = params?.dimensions?.width || 50;
  const l = params?.dimensions?.length || 50;
  const h = params?.dimensions?.height || 10;
  return makeBox(w, l, h);
}
`;

  const baseFunc = registry.buildBaseCode || defaultBaseCode;
  const cutoutsFunc = registry.addCutoutsCode || '';
  const featuresFunc = registry.addFeaturesCode || '';
  const finalizeFunc = registry.finalizeModelCode || '';

  // Pipeline calls inside main
  let pipelineLogic = `
  let model = buildBase(cadEnv, PARAMS);
`;

  if (registry.addCutoutsCode && (activePhase === 'cutouts' || activePhase === 'features' || activePhase === 'finalizing' || activePhase === 'export')) {
    pipelineLogic += `
  if (typeof addCutouts === 'function') {
    model = addCutouts(cadEnv, model, PARAMS);
  }
`;
  }

  if (registry.addFeaturesCode && (activePhase === 'features' || activePhase === 'finalizing' || activePhase === 'export')) {
    pipelineLogic += `
  if (typeof addFeatures === 'function') {
    model = addFeatures(cadEnv, model, PARAMS);
  }
`;
  }

  if (registry.finalizeModelCode && (activePhase === 'finalizing' || activePhase === 'export')) {
    pipelineLogic += `
  if (typeof finalizeModel === 'function') {
    model = finalizeModel(cadEnv, model, PARAMS);
  }
`;
  }

  const script = `// HaiCAD Parametric Model (Generated Step-by-Step)
const PARAMS = ${paramsString};

// --- Step 1: Base Geometry ---
${baseFunc}

${cutoutsFunc ? `// --- Step 2: Cutouts & Cavities ---\n${cutoutsFunc}\n` : ''}
${featuresFunc ? `// --- Step 3: Features & Fillets ---\n${featuresFunc}\n` : ''}
${finalizeFunc ? `// --- Step 4: Final Polish & Tolerance ---\n${finalizeFunc}\n` : ''}

// --- Main Execution Pipeline ---
async function main(cadEnv) {
${pipelineLogic}
  return model;
}
`;

  return script.trim();
}
