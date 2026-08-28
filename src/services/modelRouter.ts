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
  isFreeTier: boolean;
  reason: string;
  taskAnalysis: TaskAnalysis;
  customInstructions: string;
  estimatedLatency: 'instant' | 'fast' | 'moderate' | 'deliberate';
}

export interface ModelCapabilityProfile {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter';
  isFree: boolean;
  isReasoningSpecialist: boolean; // STRICTLY for reasoning & math
  isCodeSpecialist: boolean; // STRICTLY for Replicad CAD coding
  speedScore: number; // 1-10
  priorityRank: number; // Lower is higher priority
  allowedModes: TaskMode[];
}

/**
 * Strict Model Capability Profiles
 * - Reasoning models are ONLY used for reasoning & complex mathematical constraint derivation.
 * - Code models are ONLY used for generating / editing executable Replicad JavaScript.
 */
export const MODEL_CAPABILITY_PROFILES: ModelCapabilityProfile[] = [
  // --- Google Gemini Models ---
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 10,
    priorityRank: 1,
    allowedModes: ['CODE_IMPLEMENTATION', 'KERNEL_REPAIR', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 7,
    priorityRank: 2,
    allowedModes: ['REASONING', 'KERNEL_REPAIR', 'CODE_IMPLEMENTATION'],
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 9.5,
    priorityRank: 5,
    allowedModes: ['CODE_IMPLEMENTATION', 'QUESTION_EXPLANATION'],
  },

  // --- OpenRouter Dedicated Reasoning Specialists ---
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (Reasoning)',
    provider: 'openrouter',
    isFree: false,
    isReasoningSpecialist: true,
    isCodeSpecialist: false,
    speedScore: 6,
    priorityRank: 3,
    allowedModes: ['REASONING'],
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA Nemotron 3 Reasoning (free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: true,
    isCodeSpecialist: false,
    speedScore: 8.5,
    priorityRank: 4,
    allowedModes: ['REASONING'],
  },

  // --- OpenRouter Dedicated Code Specialists ---
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'openrouter',
    isFree: false,
    isReasoningSpecialist: true,
    isCodeSpecialist: true,
    speedScore: 7.5,
    priorityRank: 2,
    allowedModes: ['CODE_IMPLEMENTATION', 'REASONING', 'KERNEL_REPAIR'],
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'openrouter',
    isFree: false,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 8.5,
    priorityRank: 6,
    allowedModes: ['CODE_IMPLEMENTATION', 'KERNEL_REPAIR'],
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 9,
    priorityRank: 7,
    allowedModes: ['CODE_IMPLEMENTATION'],
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B (free)',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 8.0,
    priorityRank: 8,
    allowedModes: ['CODE_IMPLEMENTATION', 'QUESTION_EXPLANATION'],
  },
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    provider: 'openrouter',
    isFree: true,
    isReasoningSpecialist: false,
    isCodeSpecialist: true,
    speedScore: 8.0,
    priorityRank: 9,
    allowedModes: ['CODE_IMPLEMENTATION'],
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
[EXPERT DIRECTIVE: MATHEMATICAL REASONING & ACCURACY]
1. Exact Coordinate Calculations:
   - Compute all polar, cartesian, and trigonometric coordinates with high precision in millimeters (mm).
   - For helical, swept, or gear teeth profiles, evaluate angles using explicit Math.PI expressions.
2. Manifold Integrity:
   - Ensure all sketches form closed polygons with \`.close()\` before extruding or revolving.
3. 3D Spatial Radar Pings:
   - Place \`// [PING: {"name": "Feature Name", "position": [x, y, z], "action": "Action Description"}]\` annotations on the key calculated feature points.
`;

    case 'KERNEL_REPAIR':
      return `
[EXPERT DIRECTIVE: SELF-HEALING KERNEL REPAIR]
1. Debug the OpenCASCADE error directly. Resolve non-manifold edges, zero-thickness wall artifacts, and unclosed sketch loops.
2. Return complete, verified, executable Replicad JavaScript with \`function main(cadEnv) { ... return shape; }\`.
`;

    case 'QUESTION_EXPLANATION':
      return `
[EXPERT DIRECTIVE: CLEAR TECHNICAL EXPLANATION]
- Provide a clear, concise engineering explanation with dimensions, best practices, and code snippets where relevant.
`;

    case 'CODE_IMPLEMENTATION':
    default:
      return `
[EXPERT DIRECTIVE: CODE IMPLEMENTATION SPECIALIST]
1. Directional Edge Fillets:
   - When filleting, use directional edge filters like \`shape.fillet(r, (e) => e.inDirection("Z"))\`.
2. Clean Boolean Cuts:
   - Provide extra cutter height and offset (e.g. height + 4, translate -2 on Z) so holes cut through completely without zero-thickness artifacts.
3. Spatial Radar Markers:
   - Mark every major feature with \`// [PING: {"name": "...", "position": [x, y, z], "action": "..."}]\`.
`;
  }
}

/**
 * Smart Router: Routes to the optimal model based on available BYOK keys and strict task specialization
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

  // If user selected a specific manual model (not 'auto' / 'auto-smart'), respect user choice
  if (preferredMode !== 'auto' && preferredMode !== 'auto-smart') {
    const manualModel =
      availableModels.find((m) => m.id === preferredMode) ||
      DEFAULT_MODELS.find((m) => m.id === preferredMode) ||
      DEFAULT_MODELS[1]; // default to Gemini Flash

    const customInstructions = getCustomInstructions(analysis.mode, manualModel.id);

    return {
      modelId: manualModel.id,
      modelName: manualModel.name,
      provider: manualModel.provider,
      isFreeTier: Boolean(manualModel.isFree || manualModel.id.startsWith('gemini-')),
      reason: `Manual selection: ${manualModel.name} (${analysis.intentSummary})`,
      taskAnalysis: analysis,
      customInstructions,
      estimatedLatency: manualModel.id.includes('flash') ? 'instant' : 'fast',
    };
  }

  // 3. Autonomous Smart Routing with STRICT Specialization:
  const profiles = MODEL_CAPABILITY_PROFILES;

  // Filter models that are allowed for the user's configured keys
  const keyAllowedProfiles = profiles.filter((p) => {
    if (p.provider === 'gemini' && hasHealthyGeminiKey) return true;
    if (p.provider === 'openrouter' && hasHealthyOpenRouterKey) return true;
    // If no keys configured yet in pool, consider free tier models
    if (!hasHealthyGeminiKey && !hasHealthyOpenRouterKey) {
      return p.isFree;
    }
    return false;
  });

  // Filter models that match the required task mode
  let modeMatchingProfiles = keyAllowedProfiles.filter((p) => p.allowedModes.includes(analysis.mode));

  // If strict mode filtering yielded nothing for available keys, relax to any valid key-supported model
  if (modeMatchingProfiles.length === 0) {
    modeMatchingProfiles = keyAllowedProfiles;
  }

  // If still empty (no keys or matches), choose best global default based on provider key presence
  if (modeMatchingProfiles.length === 0) {
    // If user has OpenRouter key only:
    if (hasHealthyOpenRouterKey) {
      const orDefault = analysis.requiresDeepReasoning
        ? profiles.find((p) => p.id === 'deepseek/deepseek-r1') || profiles.find((p) => p.id === 'anthropic/claude-3.7-sonnet')
        : profiles.find((p) => p.id === 'qwen/qwen-2.5-coder-32b-instruct') || profiles.find((p) => p.id === 'cohere/north-mini-code:free');

      if (orDefault) {
        return {
          modelId: orDefault.id,
          modelName: orDefault.name,
          provider: 'openrouter',
          isFreeTier: orDefault.isFree,
          reason: `Auto-routed to ${orDefault.name} for ${analysis.intentSummary}`,
          taskAnalysis: analysis,
          customInstructions: getCustomInstructions(analysis.mode, orDefault.id),
          estimatedLatency: 'fast',
        };
      }
    }

    // Default to Gemini Flash
    const fallback = DEFAULT_MODELS.find((m) => m.id === 'gemini-2.5-flash') || DEFAULT_MODELS[1];
    return {
      modelId: fallback.id,
      modelName: fallback.name,
      provider: fallback.provider,
      isFreeTier: true,
      reason: `Auto-routed to ${fallback.name} for ${analysis.intentSummary}`,
      taskAnalysis: analysis,
      customInstructions: getCustomInstructions(analysis.mode, fallback.id),
      estimatedLatency: 'instant',
    };
  }

  // Sort matched profiles by priority rank (lowest rank number is highest priority)
  modeMatchingProfiles.sort((a, b) => a.priorityRank - b.priorityRank);
  const chosenProfile = modeMatchingProfiles[0];

  const customInstructions = getCustomInstructions(analysis.mode, chosenProfile.id);

  let reasonText = '';
  if (analysis.mode === 'REASONING') {
    reasonText = `Routed to ${chosenProfile.name} (Reasoning Specialist) for mathematical geometry derivation`;
  } else if (analysis.mode === 'KERNEL_REPAIR') {
    reasonText = `Routed to ${chosenProfile.name} for OpenCASCADE boolean error self-healing`;
  } else {
    reasonText = `Routed to ${chosenProfile.name} (Code Specialist) for parametric solid drafting`;
  }

  return {
    modelId: chosenProfile.id,
    modelName: chosenProfile.name,
    provider: chosenProfile.provider,
    isFreeTier: chosenProfile.isFree,
    reason: reasonText,
    taskAnalysis: analysis,
    customInstructions,
    estimatedLatency: chosenProfile.speedScore >= 9 ? 'instant' : chosenProfile.speedScore >= 7 ? 'fast' : 'moderate',
  };
}
