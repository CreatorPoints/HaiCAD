/**
 * OpenRouter API Client Service for HaiCAD
 * Implements autonomous multi-model fallback & cycling across user-selected free models
 */

export interface OpenRouterContentPartText {
  type: 'text';
  text: string;
}

export interface OpenRouterContentPartImage {
  type: 'image_url';
  image_url: { url: string };
}

export type OpenRouterContentPart = OpenRouterContentPartText | OpenRouterContentPartImage;

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenRouterContentPart[];
}

export interface OpenRouterCompletionOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export type ModelCycleCallback = (
  failedModel: string,
  nextModel: string,
  errorReason: string
) => void;

export const FREE_MODELS_PRESETS = [
  'poolside/laguna-xs-2.1:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'minimax/minimax-m2.7:free',
  'minimax/minimax-m3:free',
  'dots-studio/dots-3-note-preview:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'z-ai/glm-5.2:free',
  'cohere/north-mini-code:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'liquid/lfm-2.5-2.6b:free',
  'mistralai/mistral-7b-instruct:free',
];

export const DEFAULT_OPENROUTER_MODEL = 'poolside/laguna-xs-2.1:free';
const STORAGE_KEY_API_KEY = 'haicad_openrouter_api_key';
const STORAGE_KEY_MODEL = 'haicad_openrouter_model';

export function getStoredOpenRouterKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
}

export function setStoredOpenRouterKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
}

export function getStoredOpenRouterModel(): string {
  if (typeof window === 'undefined') return DEFAULT_OPENROUTER_MODEL;
  const stored = localStorage.getItem(STORAGE_KEY_MODEL);
  if (!stored || stored.includes('gemma-2') || stored === 'openrouter/free' || stored.includes('inkling')) {
    return DEFAULT_OPENROUTER_MODEL;
  }
  return stored;
}

export function setStoredOpenRouterModel(model: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_MODEL, model.trim());
}

export class OpenRouterService {
  private static BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Request chat completion from a single specific model
   */
  static async createChatCompletion(
    messages: OpenRouterMessage[],
    options: OpenRouterCompletionOptions = {}
  ): Promise<string> {
    const apiKey = options.apiKey || getStoredOpenRouterKey();
    const model = options.model || getStoredOpenRouterModel() || DEFAULT_OPENROUTER_MODEL;
    const temperature = options.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? 2048;

    if (!apiKey) {
      throw new Error(
        'OpenRouter API Key is required. Please enter your API key in the AI settings modal (key icon).'
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': 'https://h-aicad.web.app',
      'X-Title': 'HaiCAD Parametric Studio',
    };

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `OpenRouter API error (Status ${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content;

    if (!output && output !== '') {
      throw new Error(`Received empty response from model ${model}.`);
    }

    return output.trim();
  }

  /**
   * Request chat completion with automated fallback / cycling across models
   */
  static async createChatCompletionWithFallback(
    messages: OpenRouterMessage[],
    options: OpenRouterCompletionOptions = {},
    onModelCycle?: ModelCycleCallback
  ): Promise<{ content: string; usedModel: string }> {
    const initialModel = options.model || getStoredOpenRouterModel() || DEFAULT_OPENROUTER_MODEL;

    // Create an ordered queue starting with initialModel, then other presets
    const fallbackQueue: string[] = [
      initialModel,
      ...FREE_MODELS_PRESETS.filter((m) => m !== initialModel),
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < fallbackQueue.length; i++) {
      const candidateModel = fallbackQueue[i];
      try {
        const content = await this.createChatCompletion(messages, {
          ...options,
          model: candidateModel,
        });

        // If succeeded on a fallback model, update stored preference
        if (candidateModel !== initialModel) {
          setStoredOpenRouterModel(candidateModel);
        }

        return { content, usedModel: candidateModel };
      } catch (err: any) {
        lastError = err;
        const nextModel = fallbackQueue[i + 1];

        if (nextModel && onModelCycle) {
          onModelCycle(candidateModel, nextModel, err?.message || String(err));
        }
      }
    }

    throw (
      lastError ||
      new Error('All available AI models in the fallback queue failed to respond.')
    );
  }
}
