/**
 * OpenRouter API Client Service for HaiCAD
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterCompletionOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export const DEFAULT_OPENROUTER_MODEL = 'google/gemma-2-9b-it:free';
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
  return localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_OPENROUTER_MODEL;
}

export function setStoredOpenRouterModel(model: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_MODEL, model.trim());
}

export class OpenRouterService {
  private static BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Request chat completion from OpenRouter API
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
        'OpenRouter API Key is required. Please set your API key in the HaiCAD settings or BYOK panel.'
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
      throw new Error('Received empty response from OpenRouter API.');
    }

    return output.trim();
  }
}
