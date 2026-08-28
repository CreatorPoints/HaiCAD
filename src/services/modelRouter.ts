import { AIModelOption, APIKeyEntry, DEFAULT_MODELS } from './aiService';

export type TaskMode =
  | 'REASONING' // Deep mathematical geometry, trigonometric equations, constraint solvers
  | 'CODE_IMPLEMENTATION' // Drafting, parametric feature building, boolean operations, code edits
  | 'KERNEL_REPAIR' // Fixing syntax/boolean compile failures
  | 'QUESTION_EXPLANATION'; // Conceptual engineering questions, tool tips

export interface TaskAnalysis {
  mode: TaskMode;
  complexityScore: number; // 1 (simple) to 5 (extreme)
  intentSummary: string;
  detectedFeatures: string[];
  requiresDeepReasoning: boolean;
}

export interface RoutingDecision {
  modelId: string;
  modelName: string;
  provider: 'gemini' | 'openrouter';
  isFreeTier: true; // Strictly 100% free models only
  reason: string;
  taskAnalysis: TaskAnalysis;
  customInstructions: string;
  estimatedLatency: 'instant' | 'fast' | 'moderate' | 'deliberate';
}

export interface ModelCapabilityProfile {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter';
  isFree: true; // Strictly 100% free
  isReasoningSpecialist: boolean; // STRICTLY for reasoning & math
  isCodeSpecialist: boolean; // STRICTLY for Replicad CAD coding
  speedScore: number; // 1-10
  priorityRank: number; // Lower is higher priority
  allowedModes: TaskMode[];
}

/**
 * 100% STRICT FREE TIER MODEL PROFILES
 * Uses only proven, high-quota free tier endpoints (Gemini 2.5 Flash, Gemini 3.6 Flash, Nemotron Free, Cohere Free).
 * Zero-quota / preview endpoints (like gemini-3.1-pro with limit:0) are strictly excluded.
 */
export const MODEL_CAPABILITY_PROFILES: ModelCapabilityProfile[] = [
  // --- 1. OpenRouter 100% Free Tier Models (Lowest to Highest Model Number) ---
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Meta Llama 3.1 8B (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 10,
    priorityRank: 1, // OpenRouter Lowest Number Model (8B)
    allowedModes: ['CODE_IMPLEMENTATION', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'mistralai/mistral-small-24b-instruct-2501:free',
    name: 'Mistral Small 24B (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 9.5,
    priorityRank: 2, // OpenRouter 24B Model
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'KERNEL_REPAIR', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA Nemotron 3 Reasoning (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: false,
    speedScore: 8.5,
    priorityRank: 3, // OpenRouter 30B Reasoning Model
    allowedModes: ['REASONING', 'KERNEL_REPAIR'],
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 9.0,
    priorityRank: 4, // OpenRouter 31B Model
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 9.5,
    priorityRank: 5, // OpenRouter Code Specialist
    allowedModes: ['CODE_IMPLEMENTATION', 'KERNEL_REPAIR'],
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 8.5,
    priorityRank: 6, // OpenRouter 70B Model
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'KERNEL_REPAIR', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Z.ai GLM 5.2 (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: false,
    speedScore: 8.0,
    priorityRank: 7, // OpenRouter High-Parameter Reasoning
    allowedModes: ['REASONING'],
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Router (100% Free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 8.0,
    priorityRank: 8,
    allowedModes: ['CODE_IMPLEMENTATION', 'QUESTION_EXPLANATION'],
  },

  // --- 2. Google Gemini Free Tier Models (Lowest to Highest Model Number: 2.5 -> 3.1 -> 3.5 -> 3.6 -> 3.7) ---
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite (Low-Latency Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 10,
    priorityRank: 9, // Lowest Gemini Number
    allowedModes: ['CODE_IMPLEMENTATION'],
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Stable Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 9.8,
    priorityRank: 10, // Gemini 2.5 Flash
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite (High-Throughput Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 9.9,
    priorityRank: 11, // Gemini 3.1
    allowedModes: ['CODE_IMPLEMENTATION'],
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite (Ultra-Fast Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 9.9,
    priorityRank: 12, // Gemini 3.5 Lite
    allowedModes: ['CODE_IMPLEMENTATION', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash (Workhorse Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 9.5,
    priorityRank: 13, // Gemini 3.5 Flash
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'KERNEL_REPAIR'],
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (Next-Gen Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 10,
    priorityRank: 14, // Gemini 3.6 Flash
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'KERNEL_REPAIR', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (Hybrid Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 9.5,
    priorityRank: 15, // Gemini 3.7 Flash
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'KERNEL_REPAIR', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'gemma-4-31b-it',
    name: 'Gemma 4 31B (Google Open Weights Free Tier)',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 8.5,
    priorityRank: 16,
    allowedModes: ['REASONING', 'CODE_IMPLEMENTATION', 'QUESTION_EXPLANATION'],
  },
];

/**
 * Procedural intent classifier:
 * Strictly segregates prompts into REASONING, CODE_IMPLEMENTATION, KERNEL_REPAIR, or QUESTION_EXPLANATION.
 */
export function analyzePromptTask(prompt: string, currentCode?: string): TaskAnalysis {
  const p = prompt.toLowerCase().trim();
  const detectedFeatures: string[] = [];

  // 1. Check for Question / Information requests
  if (
    p.startsWith('what is') ||
    p.startsWith('how to') ||
    p.startsWith('explain') ||
    p.startsWith('why ') ||
    p.endsWith('?')
  ) {
    return {
      mode: 'QUESTION_EXPLANATION',
      complexityScore: 2,
      intentSummary: 'Engineering inquiry & parametric documentation',
      detectedFeatures: ['Knowledge Explanation Request'],
      requiresDeepReasoning: false,
    };
  }

  // 2. Check for Self-Healing / Error Repair
  if (
    p.includes('error') ||
    p.includes('fix') ||
    p.includes('failed') ||
    p.includes('self-heal') ||
    p.includes('syntax') ||
    p.includes('cannot compile')
  ) {
    return {
      mode: 'KERNEL_REPAIR',
      complexityScore: 4,
      intentSummary: 'OpenCASCADE compilation & boolean kernel debug',
      detectedFeatures: ['Self-Healing Geometry Repair'],
      requiresDeepReasoning: true,
    };
  }

  // 3. Check for Strict Reasoning (Math equations, complex trigonometry, curves, gears, mechanical tolerances)
  const mathKeywords = [
    'helix',
    'spiral',
    'loft',
    'trigonometric',
    'revolve',
    'thread',
    'swept',
    'spline',
    'equation',
    'gear',
    'pitch',
    'module',
    'involute',
    'bearing',
    'assembly',
    'clearance',
    'interlocking',
  ];

  const hasMathKeyword = mathKeywords.some((kw) => p.includes(kw));
  if (hasMathKeyword) {
    if (p.includes('gear') || p.includes('involute')) detectedFeatures.push('Involute Gear Geometry Derivation');
    if (p.includes('helix') || p.includes('spiral')) detectedFeatures.push('Helical Curve Formulations');
    if (p.includes('loft') || p.includes('swept')) detectedFeatures.push('Non-Linear Profile Interpolation');
    if (p.includes('assembly') || p.includes('clearance')) detectedFeatures.push('Multi-Part Clearance Tolerancing');

    return {
      mode: 'REASONING',
      complexityScore: 5,
      intentSummary: 'Complex geometric constraint & mathematical formulation',
      detectedFeatures,
      requiresDeepReasoning: true,
    };
  }

  // 4. Code Implementation (Standard solid modeling, boolean cuts, holes, fillets)
  if (p.includes('fillet') || p.includes('chamfer')) detectedFeatures.push('Directional Edge Fillet Filter');
  if (p.includes('hole') || p.includes('bore') || p.includes('cut')) detectedFeatures.push('Boolean Subtraction Cut');
  if (p.includes('pattern') || p.includes('array')) detectedFeatures.push('Polar / Cartesian Pattern Array');
  if (detectedFeatures.length === 0) detectedFeatures.push('Parametric Solid Construction');

  return {
    mode: 'CODE_IMPLEMENTATION',
    complexityScore: p.includes('pattern') || p.includes('fillet') ? 3 : 2,
    intentSummary: 'Precision parametric CAD script implementation',
    detectedFeatures,
    requiresDeepReasoning: false,
  };
}

/**
 * Task-specific prompt directives injected depending on mode
 */
export function getCustomInstructions(mode: TaskMode, modelId: string): string {
  switch (mode) {
    case 'REASONING':
      return `
[STRICT EXPERT DIRECTIVE: MATHEMATICAL REASONING SPECIALIST]
0. Agentic CAD Workflow:
   - Step 1: Provide your geometric derivation, trigonometric calculations, and CSG boolean assembly plan inside a <thought> ... </thought> block.
   - Step 2: Output the complete, modular Replicad JavaScript inside exactly one \`\`\`javascript ... \`\`\` code block.
   - Start the code with \`const PARAMS = { ... };\` declaring all dimensions.
   - Structure code into sequential steps with comments: \`// Step 1: ...\`, \`// Step 2: ...\`.
   - The main() function MUST return a single fused 3D solid (e.g. \`return body.fuse(cover);\`).
1. Exact Coordinate Calculations:
   - Compute all polar, cartesian, and trigonometric coordinates with high precision in millimeters (mm).
   - For helical, swept, or gear teeth profiles, evaluate angles using explicit Math.PI expressions.
2. Manifold Integrity:
   - Ensure all sketches form closed polygons with \`.close()\` before extruding or revolving.
   - For arrays and cutouts, maintain positive wall thickness (at least 1.5mm) between features.
3. 3D Spatial Radar Pings:
   - Place \`// [PING: {"name": "Feature Name", "position": [x, y, z], "action": "Action Description"}]\` annotations on the key calculated feature points.
`;

    case 'KERNEL_REPAIR':
      return `
[STRICT EXPERT DIRECTIVE: SELF-HEALING KERNEL REPAIR]
0. Agentic CAD Workflow:
   - Step 1: Explain the root cause of the OpenCASCADE error inside a <thought> ... </thought> block.
   - Step 2: Output ONLY the fixed executable code in a single \`\`\`javascript ... \`\`\` code block.
1. Debug the OpenCASCADE error directly. Resolve non-manifold edges, zero-thickness wall artifacts, and unclosed sketch loops.
2. Return complete, verified, executable Replicad JavaScript with \`function main({ draw, drawCircle, drawRoundedRectangle, makeBox, makeCylinder, makeSphere }) { ... return shape; }\`.
`;

    case 'QUESTION_EXPLANATION':
      return `
[STRICT EXPERT DIRECTIVE: CLEAR TECHNICAL EXPLANATION]
- Provide a clear, concise engineering explanation with dimensions, best practices, and code snippets where relevant.
`;

    case 'CODE_IMPLEMENTATION':
    default:
      return `
[STRICT EXPERT DIRECTIVE: CODE IMPLEMENTATION SPECIALIST]
0. Agentic CAD Workflow:
   - Step 1: Provide your geometric planning and CSG strategy inside a <thought> ... </thought> block.
   - Step 2: Output the complete, modular Replicad JavaScript inside exactly one \`\`\`javascript ... \`\`\` code block.
   - Start the code with \`const PARAMS = { ... };\` declaring all dimensions.
   - Structure code into progressive steps with comments: \`// Step 1: Base profile\`, \`// Step 2: Cuts and pockets\`, \`// Step 3: Fastener bores\`, \`// Step 4: Fillets\`.
   - The main() function MUST return a single valid 3D solid (e.g. \`return basePlate;\`).
1. Directional Edge Fillets:
   - When filleting, use directional edge filters like \`shape.fillet(r, (e) => e.inDirection("Z"))\` or safe radii.
2. Clean Boolean Cuts:
   - Provide extra cutter height and offset (e.g. height + 4, translate -2 on Z) so holes cut through completely without zero-thickness artifacts.
3. Spatial Radar Markers:
   - Mark every major feature with \`// [PING: {"name": "...", "position": [x, y, z], "action": "..."}]\`.
`;
  }
}

/**
 * Smart Router: ALWAYS and STRICTLY routes to 100% Free models!
 */
export function routeOptimalModel(params: {
  prompt: string;
  currentCode?: string;
  keyPool: APIKeyEntry[];
  availableModels?: AIModelOption[];
  preferredMode?: 'auto' | string;
}): RoutingDecision {
  const { prompt, currentCode, keyPool, availableModels = DEFAULT_MODELS, preferredMode = 'auto' } = params;

  // 1. Analyze prompt intent
  const analysis = analyzePromptTask(prompt, currentCode);

  // 2. Check active healthy keys in BYOK pool
  const now = Date.now();
  const hasHealthyGeminiKey = keyPool.some(
    (k) => k.provider === 'gemini' && k.isActive && (!k.isRateLimited || (k.rateLimitedUntil || 0) <= now)
  );
  const hasHealthyOpenRouterKey = keyPool.some(
    (k) => k.provider === 'openrouter' && k.isActive && (!k.isRateLimited || (k.rateLimitedUntil || 0) <= now)
  );

  // Filter available candidate models: ONLY STRICTLY 100% FREE MODELS
  const profiles = MODEL_CAPABILITY_PROFILES.filter((p) => p.isFree);

  // If user selected a specific manual model, check if valid or fallback to free equivalent
  if (preferredMode !== 'auto' && preferredMode !== 'auto-smart') {
    const manualModel =
      profiles.find((m) => m.id === preferredMode) ||
      availableModels.find((m) => m.id === preferredMode && (m.isFree || m.id.endsWith(':free') || m.id.startsWith('gemini-'))) ||
      profiles[0];

    const customInstructions = getCustomInstructions(analysis.mode, manualModel.id);

    return {
      modelId: manualModel.id,
      modelName: manualModel.name,
      provider: manualModel.provider,
      isFreeTier: true,
      reason: `Manual 100% Free Selection: ${manualModel.name} (${analysis.intentSummary})`,
      taskAnalysis: analysis,
      customInstructions,
      estimatedLatency: manualModel.id.includes('flash') ? 'instant' : 'fast',
    };
  }

  // 3. Filter candidates strictly by user's active keys
  const keyAllowedProfiles = profiles.filter((p) => {
    if (p.provider === 'gemini' && hasHealthyGeminiKey) return true;
    if (p.provider === 'openrouter' && hasHealthyOpenRouterKey) return true;
    if (!hasHealthyGeminiKey && !hasHealthyOpenRouterKey) return true; // default pool
    return false;
  });

  // 4. Strict Mode Filtering
  let modeMatchingProfiles = keyAllowedProfiles.filter((p) => {
    if (analysis.mode === 'REASONING') {
      return p.isReasoningSpecialist === true && p.allowedModes.includes('REASONING');
    }
    if (analysis.mode === 'CODE_IMPLEMENTATION') {
      return p.isCodeSpecialist === true && p.allowedModes.includes('CODE_IMPLEMENTATION');
    }
    return p.allowedModes.includes(analysis.mode);
  });

  if (modeMatchingProfiles.length === 0) {
    modeMatchingProfiles = keyAllowedProfiles;
  }

  // Sort by priority rank
  modeMatchingProfiles.sort((a, b) => a.priorityRank - b.priorityRank);
  const chosenProfile = modeMatchingProfiles[0] || profiles[0];

  const customInstructions = getCustomInstructions(analysis.mode, chosenProfile.id);

  let reasonText = '';
  if (analysis.mode === 'REASONING') {
    reasonText = `Strictly routed to ${chosenProfile.name} for mathematical geometry derivation`;
  } else if (analysis.mode === 'KERNEL_REPAIR') {
    reasonText = `Strictly routed to ${chosenProfile.name} for OpenCASCADE debugging`;
  } else {
    reasonText = `Strictly routed to ${chosenProfile.name} (Free Tier Workhorse) for parametric solid drafting`;
  }

  return {
    modelId: chosenProfile.id,
    modelName: chosenProfile.name,
    provider: chosenProfile.provider,
    isFreeTier: true,
    reason: reasonText,
    taskAnalysis: analysis,
    customInstructions,
    estimatedLatency: chosenProfile.speedScore >= 9 ? 'instant' : chosenProfile.speedScore >= 7 ? 'fast' : 'moderate',
  };
}
