import { AIModelOption, APIKeyEntry, DEFAULT_MODELS } from './aiService';

export type TaskCategory =
  | 'FAST_PRIMITIVE'
  | 'PRECISION_FEATURE'
  | 'PARAMETRIC_MATH'
  | 'COMPLEX_ASSEMBLY'
  | 'CODE_REPAIR'
  | 'CREATIVE_EXPLORATION';

export interface TaskAnalysis {
  category: TaskCategory;
  complexityScore: number; // 1 (simple) to 5 (extreme)
  intentSummary: string;
  detectedFeatures: string[];
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
  codingScore: number; // 1-10
  reasoningScore: number; // 1-10
  speedScore: number; // 1-10
  recommendedFor: TaskCategory[];
  priorityRank: number; // Lower is higher priority
}

// Model capability knowledge base & priority ranking
export const MODEL_CAPABILITY_PROFILES: ModelCapabilityProfile[] = [
  // 1. Google Gemini Tier (Available via Free Tier API Keys)
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    isFree: true,
    codingScore: 9,
    reasoningScore: 8.5,
    speedScore: 10,
    recommendedFor: ['FAST_PRIMITIVE', 'PRECISION_FEATURE', 'CREATIVE_EXPLORATION'],
    priorityRank: 1, // Default workhorse for free tier & fast parametric CAD
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    isFree: true,
    codingScore: 9.8,
    reasoningScore: 9.9,
    speedScore: 7,
    recommendedFor: ['PARAMETRIC_MATH', 'COMPLEX_ASSEMBLY', 'CODE_REPAIR'],
    priorityRank: 2, // High reasoning for complex geometries
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    isFree: true,
    codingScore: 8.5,
    reasoningScore: 8.0,
    speedScore: 9.5,
    recommendedFor: ['FAST_PRIMITIVE', 'PRECISION_FEATURE'],
    priorityRank: 5,
  },

  // 2. OpenRouter Coding & Reasoning Champions
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'openrouter',
    isFree: false,
    codingScore: 10,
    reasoningScore: 9.8,
    speedScore: 7.5,
    recommendedFor: ['COMPLEX_ASSEMBLY', 'CODE_REPAIR', 'PARAMETRIC_MATH'],
    priorityRank: 3,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'openrouter',
    isFree: false,
    codingScore: 9.2,
    reasoningScore: 10,
    speedScore: 6,
    recommendedFor: ['PARAMETRIC_MATH', 'COMPLEX_ASSEMBLY'],
    priorityRank: 4,
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'openrouter',
    isFree: false,
    codingScore: 9.3,
    reasoningScore: 8.4,
    speedScore: 8.5,
    recommendedFor: ['PRECISION_FEATURE', 'FAST_PRIMITIVE'],
    priorityRank: 6,
  },

  // 3. OpenRouter Free Tier Specialists
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere: North Mini Code (free)',
    provider: 'openrouter',
    isFree: true,
    codingScore: 8.5,
    reasoningScore: 7.8,
    speedScore: 9,
    recommendedFor: ['FAST_PRIMITIVE', 'PRECISION_FEATURE'],
    priorityRank: 7,
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA: Nemotron 3 Nano Reasoning (free)',
    provider: 'openrouter',
    isFree: true,
    codingScore: 8.0,
    reasoningScore: 8.6,
    speedScore: 8.5,
    recommendedFor: ['PARAMETRIC_MATH', 'CODE_REPAIR'],
    priorityRank: 8,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google: Gemma 4 31B (free)',
    provider: 'openrouter',
    isFree: true,
    codingScore: 8.2,
    reasoningScore: 8.4,
    speedScore: 8.0,
    recommendedFor: ['CREATIVE_EXPLORATION', 'FAST_PRIMITIVE'],
    priorityRank: 9,
  },
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    provider: 'openrouter',
    isFree: true,
    codingScore: 7.5,
    reasoningScore: 7.5,
    speedScore: 8.0,
    recommendedFor: ['FAST_PRIMITIVE'],
    priorityRank: 10,
  },
];

/**
 * Procedural intent classifier that analyzes CAD prompts & existing script
 */
export function analyzePromptTask(prompt: string, currentCode?: string): TaskAnalysis {
  const p = prompt.toLowerCase();
  const detectedFeatures: string[] = [];
  let score = 1;
  let category: TaskCategory = 'FAST_PRIMITIVE';

  // 1. Check for Code Repair / Error Fix
  if (
    p.includes('error') ||
    p.includes('fix') ||
    p.includes('failed') ||
    p.includes('self-heal') ||
    p.includes('syntax') ||
    p.includes('cannot compile')
  ) {
    category = 'CODE_REPAIR';
    score = 4;
    detectedFeatures.push('Self-Healing Geometry Bug Fix');
  }
  // 2. Check for Complex Multi-Part Assemblies & Mechanical Mechanisms
  else if (
    p.includes('assembly') ||
    p.includes('gear') ||
    p.includes('mechanism') ||
    p.includes('bearing') ||
    p.includes('interlocking') ||
    p.includes('multi-part') ||
    p.includes('case') ||
    p.includes('enclosure') ||
    p.includes('bracket with')
  ) {
    category = 'COMPLEX_ASSEMBLY';
    score = 5;
    detectedFeatures.push('Multi-Part Compound Assembly');
  }
  // 3. Check for Parametric Mathematics / Lofts / Helixes / Curves
  else if (
    p.includes('helix') ||
    p.includes('spiral') ||
    p.includes('loft') ||
    p.includes('trigonometric') ||
    p.includes('revolve') ||
    p.includes('thread') ||
    p.includes('swept') ||
    p.includes('spline') ||
    p.includes('equation')
  ) {
    category = 'PARAMETRIC_MATH';
    score = 5;
    detectedFeatures.push('Mathematical 3D Curve Formulation');
  }
  // 4. Check for Precision Features (Holes, Fillets, Chamfers, Cuts, Booleans)
  else if (
    p.includes('hole') ||
    p.includes('fillet') ||
    p.includes('chamfer') ||
    p.includes('cut') ||
    p.includes('pattern') ||
    p.includes('bolt') ||
    p.includes('m3') ||
    p.includes('m4') ||
    p.includes('m5') ||
    p.includes('countersunk') ||
    p.includes('hollow') ||
    p.includes('wall thickness') ||
    p.includes('bore')
  ) {
    category = 'PRECISION_FEATURE';
    score = 3;
    if (p.includes('fillet') || p.includes('chamfer')) detectedFeatures.push('Edge Fillet / Chamfer Filter');
    if (p.includes('hole') || p.includes('bore')) detectedFeatures.push('Precision Drilling / Boolean Cut');
    if (p.includes('pattern')) detectedFeatures.push('Polar / Cartesian Pattern Array');
  }
  // 5. Open-ended creation
  else if (p.length > 50 || p.includes('design') || p.includes('create') || p.includes('generate')) {
    category = 'CREATIVE_EXPLORATION';
    score = 3;
    detectedFeatures.push('Freeform Engineering Synthesis');
  } else {
    category = 'FAST_PRIMITIVE';
    score = 1;
    detectedFeatures.push('Basic Geometry Primitive Construction');
  }

  // Adjust score if modifying large existing script
  if (currentCode && currentCode.length > 800) {
    score = Math.min(5, score + 1);
  }

  const intentSummaries: Record<TaskCategory, string> = {
    FAST_PRIMITIVE: 'Rapid solid primitive drafting',
    PRECISION_FEATURE: 'Targeted boolean feature modification (fillet, hole, cut)',
    PARAMETRIC_MATH: 'Complex mathematical curves, lofts, or helical geometries',
    COMPLEX_ASSEMBLY: 'Multi-part mechanical assembly with dimensional tolerances',
    CODE_REPAIR: 'OpenCASCADE boolean repair and syntax debugging',
    CREATIVE_EXPLORATION: 'Full generative 3D component synthesis from specifications',
  };

  return {
    category,
    complexityScore: score,
    intentSummary: intentSummaries[category],
    detectedFeatures,
  };
}

/**
 * Task-specific custom prompt instructions injected to guarantee flawless OpenCASCADE JavaScript
 */
export function getCustomInstructions(category: TaskCategory, modelId: string): string {
  switch (category) {
    case 'PRECISION_FEATURE':
      return `
[EXPERT DIRECTIVE: PRECISION FEATURES & FILLETS]
1. Fillet & Chamfer Rules:
   - When adding fillets or chamfers, ALWAYS use directional edge filters: \`shape.fillet(radius, (edge) => edge.inDirection("Z"))\` or \`edge.atDistance(d, "Z")\`.
   - Never apply blanket fillets to all edges if it might cause OpenCASCADE kernel self-intersection.
2. Holes & Cutouts:
   - When drilling holes, translate the cutter cylinder with extra clearance (e.g. height + 4, translate -2 on axis) to avoid zero-thickness non-manifold boolean artifacts.
3. Coordinate Spatial Pings:
   - You MUST add \`// [PING: {"name": "Feature", "position": [x, y, z], "action": "Description"}]\` above each new hole, cut, or fillet!
`;

    case 'PARAMETRIC_MATH':
      return `
[EXPERT DIRECTIVE: MATHEMATICAL CURVATURE & LOFTS]
1. Exact Coordinate Math:
   - Calculate all trigonometry points precisely in millimeters.
   - For rotational patterns, compute \`x = radius * Math.cos(angle)\` and \`y = radius * Math.sin(angle)\`.
2. Closed Profiles:
   - Always verify that \`draw()\` sketches end with \`.close()\` before \`.sketchOnPlane().extrude()\` or revolving.
3. Spatial Pings:
   - Mark the origin and key curvature focal points with \`// [PING: ...]\`.
`;

    case 'COMPLEX_ASSEMBLY':
      return `
[EXPERT DIRECTIVE: MULTI-PART ASSEMBLY]
1. Assembly Return Structure:
   - Return either a merged solid via \`.fuse()\` or an array of named parts:
     \`return [{ name: "Part 1", shape: shape1, color: "#38bdf8" }, { name: "Part 2", shape: shape2, color: "#94a3b8" }];\`
2. Clearance & Tolerances:
   - Maintain 0.2mm to 0.4mm slip clearances between interlocking solid components.
3. Spatial Pings:
   - Place a \`// [PING: ...]\` tag at the mating centroid of each major component.
`;

    case 'CODE_REPAIR':
      return `
[EXPERT DIRECTIVE: SELF-HEALING KERNEL REPAIR]
1. Debugging Protocol:
   - Inspect the OpenCASCADE failure carefully. Common issues: non-manifold edges, zero-thickness walls, overlapping boolean cuts, or missing \`.close()\` on sketches.
   - Ensure the code defines a clean \`function main({ draw, drawCircle, makeBox, makeCylinder, makeSphere }) { ... return shape; }\`.
2. Output verified, clean, error-free Replicad JavaScript only.
`;

    case 'CREATIVE_EXPLORATION':
    case 'FAST_PRIMITIVE':
    default:
      return `
[EXPERT DIRECTIVE: ROBUST PARAMETRIC DRAFTING]
- Generate clean, mathematically sound Replicad code.
- Ensure all measurements are in millimeters (mm).
- Include informative \`// [PING: {"name": "Feature", "position": [x, y, z], "action": "Action"}]\` markers on major features.
`;
  }
}

/**
 * Intelligent Router: Evaluates prompt, key pool, and model capabilities to select the optimal model
 */
export function routeOptimalModel(params: {
  prompt: string;
  currentCode?: string;
  keyPool: APIKeyEntry[];
  availableModels?: AIModelOption[];
  preferredMode?: 'auto' | string;
}): RoutingDecision {
  const { prompt, currentCode, keyPool, availableModels = DEFAULT_MODELS, preferredMode = 'auto' } = params;

  // 1. Analyze task
  const analysis = analyzePromptTask(prompt, currentCode);

  // 2. Check active healthy keys
  const now = Date.now();
  const hasHealthyGeminiKey = keyPool.some(
    (k) => k.provider === 'gemini' && k.isActive && (!k.isRateLimited || (k.rateLimitedUntil || 0) <= now)
  );
  const hasHealthyOpenRouterKey = keyPool.some(
    (k) => k.provider === 'openrouter' && k.isActive && (!k.isRateLimited || (k.rateLimitedUntil || 0) <= now)
  );

  // If user selected a specific manual model (not 'auto'), respect their choice
  if (preferredMode !== 'auto' && preferredMode !== 'auto-smart') {
    const manualModel =
      availableModels.find((m) => m.id === preferredMode) ||
      DEFAULT_MODELS.find((m) => m.id === preferredMode) ||
      DEFAULT_MODELS[0];

    const customInstructions = getCustomInstructions(analysis.category, manualModel.id);

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

  // 3. Autonomous Smart Routing Engine: Find best model profile matching task and available keys
  const profiles = MODEL_CAPABILITY_PROFILES;

  // Candidate models based on available keys
  const candidates = profiles.filter((p) => {
    if (p.provider === 'gemini' && hasHealthyGeminiKey) return true;
    if (p.provider === 'openrouter' && hasHealthyOpenRouterKey) return true;
    // If no keys configured yet, assume Gemini free tier or OpenRouter free models
    if (!hasHealthyGeminiKey && !hasHealthyOpenRouterKey) {
      return p.isFree;
    }
    return false;
  });

  // If no candidates found, fallback to default Gemini Flash
  if (candidates.length === 0) {
    const fallback = DEFAULT_MODELS[0];
    return {
      modelId: fallback.id,
      modelName: fallback.name,
      provider: fallback.provider,
      isFreeTier: true,
      reason: `Auto-routed to ${fallback.name} for ${analysis.intentSummary}`,
      taskAnalysis: analysis,
      customInstructions: getCustomInstructions(analysis.category, fallback.id),
      estimatedLatency: 'instant',
    };
  }

  // Score candidates for this specific task
  let bestCandidate = candidates[0];
  let bestScore = -1;

  for (const c of candidates) {
    let score = 0;

    // Weight coding vs reasoning based on task category
    if (analysis.category === 'PARAMETRIC_MATH' || analysis.category === 'COMPLEX_ASSEMBLY') {
      score = c.reasoningScore * 1.5 + c.codingScore * 1.2 + c.speedScore * 0.4;
    } else if (analysis.category === 'CODE_REPAIR') {
      score = c.codingScore * 2.0 + c.reasoningScore * 1.0 + c.speedScore * 0.5;
    } else if (analysis.category === 'FAST_PRIMITIVE') {
      score = c.speedScore * 2.0 + c.codingScore * 1.0 + (c.isFree ? 2 : 0);
    } else {
      // PRECISION_FEATURE / CREATIVE
      score = c.codingScore * 1.4 + c.speedScore * 1.0 + c.reasoningScore * 1.0;
    }

    // Boost if in recommended category list
    if (c.recommendedFor.includes(analysis.category)) {
      score += 2.5;
    }

    // Favor free tier speed if simplicity <= 2
    if (analysis.complexityScore <= 2 && c.id === 'gemini-2.5-flash') {
      score += 3.0;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = c;
    }
  }

  const customInstructions = getCustomInstructions(analysis.category, bestCandidate.id);

  let reasonText = '';
  if (analysis.category === 'COMPLEX_ASSEMBLY' || analysis.category === 'PARAMETRIC_MATH') {
    reasonText = `Routed to ${bestCandidate.name} for high-reasoning geometric constraint computation`;
  } else if (analysis.category === 'CODE_REPAIR') {
    reasonText = `Routed to ${bestCandidate.name} for specialized OpenCASCADE syntax repair`;
  } else {
    reasonText = `Routed to ${bestCandidate.name} for ultra-fast parametric drafting on Free Tier`;
  }

  return {
    modelId: bestCandidate.id,
    modelName: bestCandidate.name,
    provider: bestCandidate.provider,
    isFreeTier: bestCandidate.isFree,
    reason: reasonText,
    taskAnalysis: analysis,
    customInstructions,
    estimatedLatency: bestCandidate.speedScore >= 9 ? 'instant' : bestCandidate.speedScore >= 7 ? 'fast' : 'moderate',
  };
}
