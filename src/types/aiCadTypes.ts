/**
 * HaiCAD Agentic CAD State Machine & AI Types
 */

import { WorkerMeshOutput } from '../cad/cadClient';

export type CadPhase =
  | 'planning'
  | 'base'
  | 'cutouts'
  | 'features'
  | 'finalizing'
  | 'export';

export type VerificationAction = 'Yes' | 'No' | 'Modify';

export interface DesignParameters {
  objectType?: string;
  dimensions?: {
    width?: number;
    height?: number;
    length?: number;
    thickness?: number;
    radius?: number;
    [key: string]: number | undefined;
  };
  units?: 'mm' | 'in';
  mountingHoles?: {
    count?: number;
    diameter?: number;
    spacing?: number;
    [key: string]: any;
  };
  custom?: Record<string, any>;
  [key: string]: any;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'ai-correction';

export interface AiCadMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  phase?: CadPhase;
  codeSnippet?: string;
  isQuestion?: boolean;
  needsVerification?: boolean;
  correctionAttempt?: number;
  error?: string;
  suggestedOptions?: string[];
}

export interface PhaseCodeRegistry {
  params: DesignParameters;
  buildBaseCode?: string;
  addCutoutsCode?: string;
  addFeaturesCode?: string;
  finalizeModelCode?: string;
  fullAssembledCode: string;
}

export interface AiCadConfig {
  apiKey?: string;
  model?: string;
  maxRetries?: number;
  temperature?: number;
}

export interface AiCadState {
  phase: CadPhase;
  designParams: DesignParameters;
  messages: AiCadMessage[];
  isLoading: boolean;
  isCorrecting: boolean;
  retryCount: number;
  currentCode: string;
  meshes: WorkerMeshOutput[];
  lastError: string | null;
  needsVerification: boolean;
  pendingVerificationPhase: CadPhase | null;
  apiKey: string;
  model: string;
}
