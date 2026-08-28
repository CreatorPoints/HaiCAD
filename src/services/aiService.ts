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
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Free Tier)',
    provider: 'gemini',
    badge: 'Free Code',
    recommended: true,
    isCodeSuited: true,
    isFree: true,
    description: 'Fastest Google multi-modal model for real-time CAD code generation (Google AI Studio Free Quota).',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (Free Tier)',
    provider: 'gemini',
    badge: 'Free Reasoning',
    isCodeSuited: true,
    isReasoning: true,
    isFree: true,
    description: 'Premier Google reasoning model for complex geometric constraints and math (Google AI Studio Free Quota).',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Free Tier)',
    provider: 'gemini',
    badge: 'Free Reliable',
    isCodeSuited: true,
    isFree: true,
    description: 'Reliable Google model with strong parametric syntax support (Google AI Studio Free Quota).',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA Nemotron 3 Reasoning (100% Free)',
    provider: 'openrouter',
    badge: 'Free Reasoning',
    isFree: true,
    isReasoning: true,
    description: 'Free NVIDIA reasoning model for geometric constraint calculations and math.',
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
    description: 'Free high-parameter instruction model with broad mathematical capabilities.',
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

5. Output Format Requirement:
   - Always return valid JavaScript.
   - You MUST export or define a \`function main({ draw, sketch, drawRoundedRectangle, drawCircle, drawRectangle, makeBox, makeCylinder, makeSphere, makeCone, makeTorus }) { ... return shape; }\`
   - All measurements are in millimeters (mm).
   - In your code, annotate key feature locations using comments in the format:
     \`// [PING: {"name": "Feature Name", "position": [x, y, z], "action": "Short Action Description"}]\`
     This allows HaiCAD's 3D viewport to display live dynamic radar pings at those exact coordinates!

6. Output ONLY the code inside a standard markdown code block:
\`\`\`javascript
// CAD Code here
function main({ makeBox, makeCylinder }) {
  // [PING: {"name": "Base Plate", "position": [0, 0, 2], "action": "Extruding base"}]
  const base = makeBox(40, 40, 4);
  return base;
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

export interface GenerateCADParams {
  prompt: string;
  currentCode?: string;
  model: string;
  keyPool?: APIKeyEntry[];
  geminiKey?: string;
  openrouterKey?: string;
  onStepProgress?: (step: string) => void;
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

  onStepProgress?.(`Autonomous Routing: ${routingDecision.reason}...`);

  // Get active keys for this provider
  const now = Date.now();
  const providerKeys = keyPool.filter((k) => k.provider === provider && k.isActive);

  if (providerKeys.length === 0) {
    const providerName = provider === 'gemini' ? 'Google Gemini' : 'OpenRouter';
    throw new Error(
      `No active API keys found for ${providerName} to run ${routingDecision.modelName}. Please add an API key in the BYOK panel on the left.`
    );
  }

  // Sort keys: healthy keys first (not rate limited or rate limit expired), then least recently failed
  const sortedKeys = [...providerKeys].sort((a, b) => {
    const aLimited = a.isRateLimited && (a.rateLimitedUntil || 0) > now;
    const bLimited = b.isRateLimited && (b.rateLimitedUntil || 0) > now;
    if (!aLimited && bLimited) return -1;
    if (aLimited && !bLimited) return 1;
    return (a.failedCalls || 0) - (b.failedCalls || 0);
  });

  let userContent = `User Request: ${prompt}`;
  if (currentCode && currentCode.trim().length > 0) {
    userContent = `Current CAD Code:\n\`\`\`javascript\n${currentCode}\n\`\`\`\n\nModify or update the CAD model according to this instruction: ${prompt}`;
  }

  // Combine base system prompt with task-specific custom directives
  const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${routingDecision.customInstructions}`;

  let textResponse = '';
  let successfulKey: APIKeyEntry | null = null;
  const errorsEncountered: Array<{ keyLabel: string; error: string }> = [];

  // Key failover loop
  for (let i = 0; i < sortedKeys.length; i++) {
    const candidateKey = sortedKeys[i];
    const keyLabel = candidateKey.label || `Key #${i + 1}`;

    onStepProgress?.(
      sortedKeys.length > 1
        ? `Connecting to ${routingDecision.modelName} via ${keyLabel} (${i + 1}/${sortedKeys.length})...`
        : `Connecting to ${routingDecision.modelName}...`
    );

    try {
      candidateKey.totalCalls = (candidateKey.totalCalls || 0) + 1;
      candidateKey.lastUsed = Date.now();

      if (provider === 'gemini') {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${candidateKey.key.trim()}`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${fullSystemPrompt}\n\n${userContent}` }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
            },
          }),
        });

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

        const data = await res.json();
        textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        // OpenRouter
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${candidateKey.key.trim()}`,
            'HTTP-Referer': window.location.origin || 'https://haicad.studio',
            'X-Title': 'HaiCAD Studio',
          },
          body: JSON.stringify({
            model: effectiveModel,
            messages: [
              { role: 'system', content: fullSystemPrompt },
              { role: 'user', content: userContent },
            ],
            temperature: 0.2,
          }),
        });

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

        const data = await res.json();
        textResponse = data.choices?.[0]?.message?.content || '';
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
      if (i < sortedKeys.length - 1) {
        const nextKey = sortedKeys[i + 1];
        const reason = isRateLimit ? 'Rate limit / 429 hit' : `API error (${errMsg.slice(0, 40)})`;
        onKeyRotated?.({
          provider,
          fromKeyLabel: keyLabel,
          toKeyLabel: nextKey.label,
          reason,
        });
        onStepProgress?.(`Key '${keyLabel}' rate limited. Auto-switching to '${nextKey.label}'...`);
        // Small backoff before next key
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  if (!successfulKey || !textResponse) {
    const errorDetails = errorsEncountered.map((e) => `• [${e.keyLabel}]: ${e.error}`).join('\n');
    throw new Error(
      `All ${provider.toUpperCase()} API keys failed or were rate-limited:\n${errorDetails}\n\nPlease add more keys in the BYOK panel or wait for cooldown.`
    );
  }

  // Parse code block
  let extractedCode = textResponse;
  const codeBlockMatch = textResponse.match(/```(?:javascript|js|typescript|ts)?([\s\S]*?)```/);
  if (codeBlockMatch) {
    extractedCode = codeBlockMatch[1].trim();
  }

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
  const lines = extractedCode.split('\n');
  lines.forEach((line) => {
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
