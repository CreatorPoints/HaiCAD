import { routeOptimalModel, RoutingDecision } from './modelRouter';

export interface AIPingLocation {
  id: string;
  name: string;
  action: string;
  position: [number, number, number];
  timestamp: number;
}

export interface APIKeyEntry {
  id: string;
  provider: 'gemini' | 'openrouter';
  label: string;
  key: string;
  isActive: boolean;
  isRateLimited?: boolean;
  rateLimitedUntil?: number; // timestamp ms
  lastUsed?: number;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  lastError?: string;
  createdAt: number;
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter';
  badge: string;
  recommended?: boolean;
  isFree?: boolean;
  isCodeSuited?: boolean;
  isReasoning?: boolean;
  contextLength?: number;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface KeyRotationEvent {
  provider: 'gemini' | 'openrouter';
  fromKeyLabel: string;
  toKeyLabel: string;
  reason: string;
}

// Default curated models
// Default strictly 100% free curated models
export const DEFAULT_MODELS: AIModelOption[] = [
  {
    id: 'auto-smart',
    name: '⚡ Auto Smart Router (100% Free)',
    provider: 'gemini',
    badge: 'Autonomous',
    recommended: true,
    isFree: true,
    isCodeSuited: true,
    isReasoning: true,
    description: 'Intelligently routes every task to the optimal 100% free reasoning or code specialist model.',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (Next-Gen Free Tier)',
    provider: 'gemini',
    badge: 'Ultra Fast Workhorse',
    recommended: true,
    isCodeSuited: true,
    isReasoning: true,
    isFree: true,
    description: 'Ultra-fast, high-throughput model for instant parametric CAD generation and edits (~15 RPM / 1,500 RPD).',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Stable Free Tier)',
    provider: 'gemini',
    badge: 'Free Stable',
    isCodeSuited: true,
    isReasoning: true,
    isFree: true,
    description: 'Stable legacy Flash model for general-purpose fallback generation.',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (Hybrid Free Tier)',
    provider: 'gemini',
    badge: 'Hybrid Reasoning',
    isCodeSuited: true,
    isReasoning: true,
    isFree: true,
    description: 'Deep hybrid reasoning model for complex CSG booleans and step-by-step CAD math (~15 RPM / 1,500 RPD).',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash (Workhorse Free Tier)',
    provider: 'gemini',
    badge: 'Free Workhorse',
    isCodeSuited: true,
    isReasoning: true,
    isFree: true,
    description: 'Reliable fallback code execution and boolean solid modeling (~15 RPM / 1,500 RPD).',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite (Ultra-Fast Free Tier)',
    provider: 'gemini',
    badge: 'Free Lite',
    isCodeSuited: true,
    isFree: true,
    description: 'Ultra-fast lightweight model for parameter modifications & primitive drafting (~15 RPM / 1,500 RPD).',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite (High-Throughput Free Tier)',
    provider: 'gemini',
    badge: 'High Speed',
    isCodeSuited: true,
    isFree: true,
    description: 'High-throughput subagent model for quick geometry edits (~15 RPM / 1,500 RPD).',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Stable Free Tier)',
    provider: 'gemini',
    badge: 'Free Code',
    isCodeSuited: true,
    isReasoning: true,
    isFree: true,
    description: 'Stable legacy Flash model for general-purpose fallback generation.',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite (Low-Latency Free Tier)',
    provider: 'gemini',
    badge: 'Free Lite',
    isCodeSuited: true,
    isFree: true,
    description: 'Low-latency legacy model with fast token output.',
  },
  {
    id: 'gemma-4-31b-it',
    name: 'Gemma 4 31B (Google Open Weights Free Tier)',
    provider: 'gemini',
    badge: 'Free Gemma',
    isCodeSuited: true,
    isReasoning: true,
    isFree: true,
    description: 'Google open-weights model for mathematical & constraint reasoning (~15 RPM / 1,500 RPD).',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA Nemotron 3 Reasoning (100% Free)',
    provider: 'openrouter',
    badge: 'Free Reasoning',
    isFree: true,
    isReasoning: true,
    description: 'Free NVIDIA reasoning model on OpenRouter for geometric constraint calculations.',
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (100% Free)',
    provider: 'openrouter',
    badge: 'Free Code',
    isFree: true,
    isCodeSuited: true,
    description: 'Free code-specialized model on OpenRouter, ideal for CAD scripting at zero cost.',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B (100% Free)',
    provider: 'openrouter',
    badge: 'Free Gemma',
    isFree: true,
    isCodeSuited: true,
    description: 'Free high-parameter instruction model on OpenRouter with broad mathematical capabilities.',
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Z.ai GLM 5.2 (100% Free)',
    provider: 'openrouter',
    badge: 'Free GLM',
    isFree: true,
    isReasoning: true,
    description: 'Free high-parameter model on OpenRouter for mathematical analysis.',
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Router (100% Free)',
    provider: 'openrouter',
    badge: 'Auto Free',
    isFree: true,
    description: 'Automatically routes requests to available free models on OpenRouter.',
  },
];

export const AVAILABLE_MODELS = DEFAULT_MODELS;

const BASE_SYSTEM_PROMPT = `
You are HaiCAD AI, an elite 3D Parametric CAD engineer and code generator.
Your job is to generate clean, robust, and executable JavaScript code using the 'replicad' OpenCASCADE CAD library.

### Replicad Library Reference:
1. Primitives:
   - makeBox(xLen, yLen, zLen)
   - makeCylinder(radius, height)
   - makeSphere(radius)
   - makeCone(radius1, radius2, height)
   - makeTorus(radius1, radius2)

2. 2D Sketching & Drawing:
   - draw().hLine(x).vLine(y).lineTo([x, y]).line(dx, dy).close()
   - drawCircle(radius)
   - drawRoundedRectangle(width, height, radius)
   - sketch.sketchOnPlane("XY" | "XZ" | "YZ").extrude(height)
   - sketch.loftWith(otherSketch)
   - sketch.revolve([axisOrigin, axisDir])

3. 3D Boolean Operations & Transforms:
   - shape.fuse(otherShape) // Union
   - shape.cut(otherShape) // Subtraction/Drilling
   - shape.intersect(otherShape) // Intersection
   - shape.translate([dx, dy, dz])
   - shape.rotate(angleInDegrees, [pivotX, pivotY, pivotZ], [axisX, axisY, axisZ])
   - shape.scale(factor)

4. Fillets and Chamfers:
   - shape.fillet(radius, (edge) => edge.inDirection("Z"))
   - shape.chamfer(dist, (edge) => edge.inDirection("X"))
   - Always ensure fillet radius is strictly smaller than the wall/feature thickness.

5. Critical Rules & Output Contract:
   - Your response MUST contain exactly ONE executable \`\`\`javascript ... \`\`\` code block.
   - Do NOT output raw conversational text or preamble outside the code block.
   - You MUST export or define a function with this signature:
     function main({ draw, sketch, drawRoundedRectangle, drawCircle, drawRectangle, makeBox, makeCylinder, makeSphere, makeCone, makeTorus }) {
       // Code here
       return finalShape;
     }
   - The main() function MUST return a SINGLE valid fused 3D solid or compound (e.g. \`return body.fuse(cover);\`). Never return an array or object.
   - All measurements are in millimeters (mm).
   - In your code, annotate key feature locations using comments in the format:
     \`// [PING: {"name": "Feature Name", "position": [x, y, z], "action": "Short Action Description"}]\`

Example Response Format:
\`\`\`javascript
// Precision Parametric Solid
function main({ makeBox, makeCylinder }) {
  // [PING: {"name": "Base Plate", "position": [0, 0, 2], "action": "Extruding base"}]
  const base = makeBox(40, 40, 4);
  const hole = makeCylinder(3, 10).translate([0, 0, -2]);
  return base.cut(hole);
}
\`\`\`
`;

// Helper to load key pool from localStorage
export const STORAGE_KEYS_POOL = 'haicad_key_pool_v1';

export function loadKeyPool(): APIKeyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_POOL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored key pool', e);
  }

  // Migrate legacy single keys if present
  const migrated: APIKeyEntry[] = [];
  const legacyGemini = localStorage.getItem('haicad_gemini_key');
  if (legacyGemini && legacyGemini.trim()) {
    migrated.push({
      id: 'gemini_legacy_' + Math.random().toString(36).substring(2, 7),
      provider: 'gemini',
      label: 'Primary Gemini Key',
      key: legacyGemini.trim(),
      isActive: true,
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      createdAt: Date.now(),
    });
  }

  const legacyOpenRouter = localStorage.getItem('haicad_openrouter_key');
  if (legacyOpenRouter && legacyOpenRouter.trim()) {
    migrated.push({
      id: 'openrouter_legacy_' + Math.random().toString(36).substring(2, 7),
      provider: 'openrouter',
      label: 'Primary OpenRouter Key',
      key: legacyOpenRouter.trim(),
      isActive: true,
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      createdAt: Date.now(),
    });
  }

  if (migrated.length > 0) {
    saveKeyPool(migrated);
  }

  return migrated;
}

export function saveKeyPool(pool: APIKeyEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS_POOL, JSON.stringify(pool));
    // Keep first active keys in legacy storage for backward compatibility
    const firstGemini = pool.find((k) => k.provider === 'gemini' && k.isActive);
    if (firstGemini) localStorage.setItem('haicad_gemini_key', firstGemini.key);
    const firstOR = pool.find((k) => k.provider === 'openrouter' && k.isActive);
    if (firstOR) localStorage.setItem('haicad_openrouter_key', firstOR.key);
  } catch (e) {
    console.error('Failed to save key pool to localStorage', e);
  }
}

// Fetch live OpenRouter models catalog and identify free & CAD-suited models
export async function fetchOpenRouterModels(): Promise<AIModelOption[]> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) {
      throw new Error(`OpenRouter models API returned status ${res.status}`);
    }
    const json = await res.json();
    const rawModels: any[] = json.data || [];

    const parsedModels: AIModelOption[] = rawModels.map((m: any) => {
      const id: string = m.id || '';
      const name: string = m.name || id;
      const desc: string = m.description || '';
      const isFree =
        id.endsWith(':free') ||
        (m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0');

      const isCodeSuited =
        id.toLowerCase().includes('code') ||
        name.toLowerCase().includes('code') ||
        name.toLowerCase().includes('coder') ||
        desc.toLowerCase().includes('code') ||
        desc.toLowerCase().includes('programming') ||
        id.includes('claude-3.7') ||
        id.includes('qwen') ||
        id.includes('deepseek');

      const isReasoning =
        id.toLowerCase().includes('r1') ||
        id.toLowerCase().includes('reasoning') ||
        desc.toLowerCase().includes('reason') ||
        (Array.isArray(m.supported_parameters) && m.supported_parameters.includes('include_reasoning'));

      let badge = 'Standard';
      if (isFree && isCodeSuited) badge = 'Free Code';
      else if (isFree && isReasoning) badge = 'Free Reasoning';
      else if (isFree) badge = 'Free Tier';
      else if (isCodeSuited) badge = 'Code Specialist';
      else if (isReasoning) badge = 'Deep Reasoning';

      return {
        id,
        name,
        provider: 'openrouter',
        badge,
        isFree,
        isCodeSuited,
        isReasoning,
        contextLength: m.context_length,
        description: desc,
        pricing: m.pricing,
      };
    });

    return parsedModels;
  } catch (err) {
    console.warn('Failed to fetch live OpenRouter models:', err);
    return [];
  }
}

// Fetch live Google Gemini models catalog for the user's active API key
export async function fetchGeminiModels(providedKey?: string): Promise<AIModelOption[]> {
  const pool = loadKeyPool();
  const activeKey =
    providedKey?.trim() ||
    pool.find((k) => k.provider === 'gemini' && k.isActive)?.key ||
    localStorage.getItem('haicad_gemini_key') ||
    '';

  if (!activeKey) return [];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey.trim()}&pageSize=100`
    );
    if (!res.ok) {
      console.warn(`Gemini listModels API returned status ${res.status}`);
      return [];
    }
    const json = await res.json();
    const rawList: any[] = json.models || [];

    // Filter to generateContent text/code models, excluding specialized video/audio/embedding models
    const supported = rawList.filter(
      (m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa') &&
        !m.name.includes('tts') &&
        !m.name.includes('transcribe') &&
        !m.name.includes('veo') &&
        !m.name.includes('robotics') &&
        !m.name.includes('customtools')
    );

    const parsed: AIModelOption[] = supported.map((m: any) => {
      const id = m.name.replace('models/', '');
      const displayName = m.displayName || id;
      const isReasoning = id.includes('pro') || displayName.toLowerCase().includes('pro');
      const isCode =
        id.includes('flash') ||
        id.includes('coder') ||
        displayName.toLowerCase().includes('flash') ||
        id.includes('gemma');

      let badge = 'Free Tier';
      if (isReasoning) badge = 'Free Reasoning';
      else if (isCode) badge = 'Free Code';

      return {
        id,
        name: displayName.includes('Free') ? displayName : `${displayName} (Free Tier)`,
        provider: 'gemini' as const,
        badge,
        isFree: true,
        isCodeSuited: isCode,
        isReasoning,
        contextLength: m.inputTokenLimit,
        description:
          m.description ||
          `Official Google Generative AI model with ${m.inputTokenLimit?.toLocaleString() || '1M'} input token limit.`,
      };
    });

    return parsed;
  } catch (err) {
    console.warn('Failed to fetch real Gemini models:', err);
    return [];
  }
}

export interface GenerateCADParams {
  prompt: string;
  currentCode?: string;
  model: string;
  keyPool?: APIKeyEntry[];
  geminiKey?: string;
  openrouterKey?: string;
  onStepProgress?: (step: string) => void;
  onTokenStream?: (accumulatedText: string, newChunk: string) => void;
  onLivePing?: (ping: AIPingLocation) => void;
  onKeyRotated?: (event: KeyRotationEvent) => void;
  onKeyPoolUpdated?: (updatedPool: APIKeyEntry[]) => void;
}

export interface GenerateCADResult {
  code: string;
  rawResponse: string;
  pings: AIPingLocation[];
  steps: string[];
  usedKeyLabel?: string;
  routingDecision: RoutingDecision;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`API request to model timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

export function extractSpatialPings(text: string): AIPingLocation[] {
  const pings: AIPingLocation[] = [];
  const pingRegex = /\/\/\s*\[PING:\s*(\{[\s\S]*?\})\s*\]/g;
  let match: RegExpExecArray | null;
  while ((match = pingRegex.exec(text)) !== null) {
    try {
      const pingData = JSON.parse(match[1]);
      pings.push({
        id: 'ping_' + Math.random().toString(36).substring(2, 9),
        name: pingData.name || 'CAD Feature',
        action: pingData.action || 'Modifying geometry',
        position: Array.isArray(pingData.position) ? pingData.position : [0, 0, 0],
        timestamp: Date.now(),
      });
    } catch {}
  }
  return pings;
}

export function extractExecutableCode(textResponse: string): string {
  if (!textResponse || !textResponse.trim()) return '';

  // 1. Check for standard triple backtick code block with main()
  const codeBlockMatch = textResponse.match(/```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)(?:```|$)/);
  if (codeBlockMatch && (codeBlockMatch[1].includes('function main') || codeBlockMatch[1].includes('main('))) {
    return codeBlockMatch[1].trim();
  }

  // 2. If code block is missing or doesn't have main, search for function main
  const mainIdx = textResponse.indexOf('function main');
  if (mainIdx !== -1) {
    const fromMain = textResponse.slice(mainIdx);
    const endFence = fromMain.indexOf('```');
    if (endFence !== -1) {
      return fromMain.slice(0, endFence).trim();
    }
    return fromMain.trim();
  }

  // 3. Fallback to full code block match or raw text
  if (codeBlockMatch && codeBlockMatch[1].trim()) {
    return codeBlockMatch[1].trim();
  }

  return textResponse.trim();
}

async function readGeminiSSEStream(
  response: Response,
  onChunk?: (accumulated: string, chunk: string) => void,
  onLivePing?: (ping: AIPingLocation) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Gemini response stream is not readable');

  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (chunkText) {
          accumulatedText += chunkText;
          onChunk?.(accumulatedText, chunkText);

          if (chunkText.includes('// [PING:') && onLivePing) {
            const pings = extractSpatialPings(accumulatedText);
            const latestPing = pings[pings.length - 1];
            if (latestPing) onLivePing(latestPing);
          }
        }
      } catch {
        // partial json frame ignored
      }
    }
  }

  return accumulatedText;
}

async function readOpenRouterSSEStream(
  response: Response,
  onChunk?: (accumulated: string, chunk: string) => void,
  onLivePing?: (ping: AIPingLocation) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('OpenRouter response stream is not readable');

  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const chunkText = parsed.choices?.[0]?.delta?.content || '';
        if (chunkText) {
          accumulatedText += chunkText;
          onChunk?.(accumulatedText, chunkText);

          if (chunkText.includes('// [PING:') && onLivePing) {
            const pings = extractSpatialPings(accumulatedText);
            const latestPing = pings[pings.length - 1];
            if (latestPing) onLivePing(latestPing);
          }
        }
      } catch {
        // partial json ignored
      }
    }
  }

  return accumulatedText;
}

// Generate CAD code with automatic failover and key rotation
export async function generateCADCode(params: GenerateCADParams): Promise<GenerateCADResult> {
  const {
    prompt,
    currentCode,
    model: requestedModel,
    keyPool: providedKeyPool,
    geminiKey,
    openrouterKey,
    onStepProgress,
    onTokenStream,
    onLivePing,
    onKeyRotated,
    onKeyPoolUpdated,
  } = params;

  // Resolve key pool
  let keyPool: APIKeyEntry[] = providedKeyPool && providedKeyPool.length > 0 ? [...providedKeyPool] : loadKeyPool();

  // If pool is empty, build ephemeral pool from single keys if provided
  if (keyPool.length === 0) {
    if (geminiKey && geminiKey.trim()) {
      keyPool.push({
        id: 'ephemeral_gemini',
        provider: 'gemini',
        label: 'Gemini Key',
        key: geminiKey.trim(),
        isActive: true,
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        createdAt: Date.now(),
      });
    }
    if (openrouterKey && openrouterKey.trim()) {
      keyPool.push({
        id: 'ephemeral_openrouter',
        provider: 'openrouter',
        label: 'OpenRouter Key',
        key: openrouterKey.trim(),
        isActive: true,
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        createdAt: Date.now(),
      });
    }
  }

  // Autonomous Smart Model Routing: analyze prompt and select best model + custom directives
  const routingDecision = routeOptimalModel({
    prompt,
    currentCode,
    keyPool,
    preferredMode: requestedModel,
  });

  const effectiveModel = routingDecision.modelId;
  const provider = routingDecision.provider;

  console.log('[HaiCAD AI] Autonomous Routing:', routingDecision);
  onStepProgress?.(`Autonomous Routing: ${routingDecision.reason}...`);

  // 1. Gather all active keys across all providers
  const now = Date.now();
  const primaryProvider: 'gemini' | 'openrouter' = routingDecision.provider;
  const secondaryProvider: 'gemini' | 'openrouter' = primaryProvider === 'gemini' ? 'openrouter' : 'gemini';

  const primaryKeys = keyPool.filter((k) => k.provider === primaryProvider && k.isActive);
  const secondaryKeys = keyPool.filter((k) => k.provider === secondaryProvider && k.isActive);

  if (primaryKeys.length === 0 && secondaryKeys.length === 0) {
    throw new Error(
      `No active API keys found. Please add a Google Gemini or OpenRouter API key in the BYOK panel on the left.`
    );
  }

  const sortFn = (a: APIKeyEntry, b: APIKeyEntry) => {
    const aLimited = a.isRateLimited && (a.rateLimitedUntil || 0) > now;
    const bLimited = b.isRateLimited && (b.rateLimitedUntil || 0) > now;
    if (!aLimited && bLimited) return -1;
    if (aLimited && !bLimited) return 1;
    return (a.failedCalls || 0) - (b.failedCalls || 0);
  };

  primaryKeys.sort(sortFn);
  secondaryKeys.sort(sortFn);

  // If primary has no healthy keys and secondary does, prioritize secondary
  const primaryHealthy = primaryKeys.filter((k) => !k.isRateLimited || (k.rateLimitedUntil || 0) <= now);
  const secondaryHealthy = secondaryKeys.filter((k) => !k.isRateLimited || (k.rateLimitedUntil || 0) <= now);

  let candidateAttempts: Array<{ key: APIKeyEntry; provider: 'gemini' | 'openrouter'; isCrossProvider: boolean }> = [];

  if (primaryHealthy.length > 0 || secondaryHealthy.length === 0) {
    candidateAttempts = [
      ...primaryKeys.map((k) => ({ key: k, provider: primaryProvider, isCrossProvider: false })),
      ...secondaryKeys.map((k) => ({ key: k, provider: secondaryProvider, isCrossProvider: true })),
    ];
  } else {
    // Primary is rate limited, secondary is ready!
    candidateAttempts = [
      ...secondaryKeys.map((k) => ({ key: k, provider: secondaryProvider, isCrossProvider: true })),
      ...primaryKeys.map((k) => ({ key: k, provider: primaryProvider, isCrossProvider: false })),
    ];
  }

  let userContent = `User Request: ${prompt}`;
  if (currentCode && currentCode.trim().length > 0) {
    userContent = `Current CAD Code:\n\`\`\`javascript\n${currentCode}\n\`\`\`\n\nModify or update the CAD model according to this instruction: ${prompt}`;
  }

  // Combine base system prompt with task-specific custom directives
  const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${routingDecision.customInstructions}`;

  let textResponse = '';
  let successfulKey: APIKeyEntry | null = null;
  const errorsEncountered: Array<{ keyLabel: string; error: string }> = [];

  // Key failover loop (supports intra-provider & cross-provider automatic failover)
  for (let i = 0; i < candidateAttempts.length; i++) {
    const attempt = candidateAttempts[i];
    const candidateKey = attempt.key;
    const currentProvider = attempt.provider;
    const keyLabel = candidateKey.label || `${currentProvider === 'gemini' ? 'Gemini' : 'OpenRouter'} Key #${i + 1}`;

    // Determine model to use for this attempt
    let activeModelForAttempt = effectiveModel;
    if (currentProvider !== primaryProvider) {
      // Cross-provider failover model selection
      if (currentProvider === 'openrouter') {
        activeModelForAttempt =
          routingDecision.taskAnalysis.mode === 'REASONING'
            ? 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
            : 'cohere/north-mini-code:free';
      } else {
        activeModelForAttempt = 'gemini-3.6-flash';
      }
    }

    if (attempt.isCrossProvider) {
      onStepProgress?.(
        `Cross-provider failover: Switching to ${currentProvider === 'openrouter' ? 'OpenRouter' : 'Google Gemini'} (${activeModelForAttempt}) via ${keyLabel}...`
      );
    } else {
      onStepProgress?.(
        candidateAttempts.length > 1
          ? `Connecting to ${activeModelForAttempt} via ${keyLabel} (${i + 1}/${candidateAttempts.length})...`
          : `Connecting to ${activeModelForAttempt}...`
      );
    }

    try {
      candidateKey.totalCalls = (candidateKey.totalCalls || 0) + 1;
      candidateKey.lastUsed = Date.now();

      if (currentProvider === 'gemini') {
        let modelToCall = activeModelForAttempt;
        let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:streamGenerateContent?alt=sse&key=${candidateKey.key.trim()}`;
        let res = await fetchWithTimeout(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${fullSystemPrompt}\n\n${userContent}` }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
            },
          }),
        }, 25000);

        // If model hit limit:0, rate limit (429), or error, auto-cascade through verified working free tier flash endpoints
        if (!res.ok) {
          const fallbackModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.7-flash'];
          for (const fallbackModel of fallbackModels) {
            if (fallbackModel === modelToCall) continue;
            onStepProgress?.(`Auto-fallback to ${fallbackModel} (Free Tier)...`);
            modelToCall = fallbackModel;
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:streamGenerateContent?alt=sse&key=${candidateKey.key.trim()}`;
            res = await fetchWithTimeout(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `${fullSystemPrompt}\n\n${userContent}` }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 4096,
                },
              }),
            }, 25000);
            if (res.ok) break;
          }
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson.error?.message || `Gemini API HTTP ${res.status}`;
          const isRateLimit = res.status === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate');

          throw {
            status: res.status,
            message: errMsg,
            isRateLimit,
          };
        }

        textResponse = await readGeminiSSEStream(res, onTokenStream, onLivePing);
      } else {
        // OpenRouter SSE Stream
        let modelToCall = activeModelForAttempt;
        let res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${candidateKey.key.trim()}`,
            'HTTP-Referer': window.location.origin || 'https://haicad.studio',
            'X-Title': 'HaiCAD Studio',
          },
          body: JSON.stringify({
            model: modelToCall,
            stream: true,
            messages: [
              { role: 'system', content: fullSystemPrompt },
              { role: 'user', content: userContent },
            ],
            temperature: 0.2,
          }),
        }, 25000);

        // If OpenRouter model fails, cascade through other free OpenRouter models
        if (!res.ok) {
          const fallbackORModels = [
            'cohere/north-mini-code:free',
            'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
            'google/gemma-4-31b-it:free',
            'openrouter/free',
          ];
          for (const fallbackModel of fallbackORModels) {
            if (fallbackModel === modelToCall) continue;
            onStepProgress?.(`Auto-fallback to OpenRouter ${fallbackModel}...`);
            modelToCall = fallbackModel;
            res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${candidateKey.key.trim()}`,
                'HTTP-Referer': window.location.origin || 'https://haicad.studio',
                'X-Title': 'HaiCAD Studio',
              },
              body: JSON.stringify({
                model: modelToCall,
                stream: true,
                messages: [
                  { role: 'system', content: fullSystemPrompt },
                  { role: 'user', content: userContent },
                ],
                temperature: 0.2,
              }),
            }, 25000);
            if (res.ok) break;
          }
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson.error?.message || `OpenRouter API HTTP ${res.status}`;
          const isRateLimit =
            res.status === 429 ||
            errMsg.toLowerCase().includes('rate limit') ||
            errMsg.toLowerCase().includes('credits') ||
            errMsg.toLowerCase().includes('quota');

          throw {
            status: res.status,
            message: errMsg,
            isRateLimit,
          };
        }

        textResponse = await readOpenRouterSSEStream(res, onTokenStream, onLivePing);
      }

      // If we made it here, call succeeded!
      successfulKey = candidateKey;
      candidateKey.successCalls = (candidateKey.successCalls || 0) + 1;
      candidateKey.isRateLimited = false;
      candidateKey.rateLimitedUntil = undefined;
      candidateKey.lastError = undefined;

      // Update pool and break loop
      saveKeyPool(keyPool);
      onKeyPoolUpdated?.([...keyPool]);
      break;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isRateLimit = err?.isRateLimit || err?.status === 429 || errMsg.toLowerCase().includes('rate');

      candidateKey.failedCalls = (candidateKey.failedCalls || 0) + 1;
      candidateKey.lastError = errMsg;

      if (isRateLimit) {
        // Mark rate limited with 60s cooldown
        candidateKey.isRateLimited = true;
        candidateKey.rateLimitedUntil = Date.now() + 60 * 1000;
      }

      errorsEncountered.push({ keyLabel, error: errMsg });
      saveKeyPool(keyPool);
      onKeyPoolUpdated?.([...keyPool]);

      // If there are more keys, trigger rotation notification and retry
      if (i < candidateAttempts.length - 1) {
        const nextAttempt = candidateAttempts[i + 1];
        const nextKey = nextAttempt.key;
        const nextLabel = nextKey.label || `${nextAttempt.provider === 'gemini' ? 'Gemini' : 'OpenRouter'} Key #${i + 2}`;
        const reason = isRateLimit ? 'Rate limit / 429 hit' : `API error (${errMsg.slice(0, 40)})`;
        onKeyRotated?.({
          provider: nextAttempt.provider,
          fromKeyLabel: keyLabel,
          toKeyLabel: nextLabel,
          reason,
        });
        onStepProgress?.(`Key '${keyLabel}' rate limited. Auto-switching to '${nextLabel}'...`);
        // Small backoff before next key
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  if (!successfulKey || !textResponse) {
    const errorDetails = errorsEncountered.map((e) => `• [${e.keyLabel}]: ${e.error}`).join('\n');
    throw new Error(
      `All available API keys across providers failed or were rate-limited:\n${errorDetails}\n\nPlease add more keys in the BYOK panel or wait for cooldown.`
    );
  }

  // Parse code block with robust extractor
  let extractedCode = extractExecutableCode(textResponse);

  // Parse pings from code
  const pings: AIPingLocation[] = [];
  const pingRegex = /\/\/\s*\[PING:\s*(\{[\s\S]*?\})\s*\]/g;
  let match;
  while ((match = pingRegex.exec(extractedCode)) !== null) {
    try {
      const pingData = JSON.parse(match[1]);
      const pingObj: AIPingLocation = {
        id: 'ping_' + Math.random().toString(36).substring(2, 9),
        name: pingData.name || 'CAD Feature',
        action: pingData.action || 'Modifying geometry',
        position: Array.isArray(pingData.position) ? pingData.position : [0, 0, 0],
        timestamp: Date.now(),
      };
      pings.push(pingObj);
      onLivePing?.(pingObj);
    } catch {
      // ignore parse error
    }
  }

  // Parse human readable steps
  const steps: string[] = [];
  const lines: string[] = extractedCode.split('\n');
  lines.forEach((line: string) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') && !trimmed.includes('[PING:')) {
      const stepText = trimmed.replace(/^\/\/\s*(\d+\.|\*|-)?\s*/, '').trim();
      if (stepText.length > 3) {
        steps.push(stepText);
      }
    }
  });

  return {
    code: extractedCode,
    rawResponse: textResponse,
    pings,
    steps: steps.length > 0 ? steps : ['Generating parametric geometry', 'Applying 3D constraints'],
    usedKeyLabel: successfulKey.label,
    routingDecision,
  };
}

// Quick validation function for a single API key
export async function validateAPIKey(
  provider: 'gemini' | 'openrouter',
  key: string
): Promise<{ valid: boolean; message: string }> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, message: 'Key cannot be empty' };
  }

  try {
    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { valid: false, message: json.error?.message || `HTTP status ${res.status}` };
      }
      return { valid: true, message: 'Gemini API Key is valid & connected' };
    } else {
      // OpenRouter test
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { valid: false, message: json.error?.message || `HTTP status ${res.status}` };
      }
      const data = await res.json();
      const label = data.data?.label || 'Key verified';
      const limit = data.data?.limit !== null ? ` (Limit: $${data.data?.limit})` : '';
      return { valid: true, message: `OpenRouter Key verified: ${label}${limit}` };
    }
  } catch (err: any) {
    return { valid: false, message: err?.message || 'Network request failed' };
  }
}
