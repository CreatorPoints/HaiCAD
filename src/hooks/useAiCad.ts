/**
 * useAiCad - Robust, Self-Correcting React Hook for Agentic CAD Generation & Direct Editing
 * 
 * Implements:
 * 1. Live Workspace IDE Synchronization (instantly recompiles & edits code)
 * 2. Conversational Intent Understanding & Modification Memory
 * 3. Self-Correction Loop with up to 3 automated retries upon Web Worker compilation/geometry failure
 * 4. OpenRouter API integration with autonomous model cycling & tracking
 * 5. Direct User-Driven Workflows (no rigid forced extra steps on completed models)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CadPhase,
  VerificationAction,
  DesignParameters,
  AiCadMessage,
  AiCadConfig,
} from '../types/aiCadTypes';
import {
  OpenRouterService,
  getStoredOpenRouterKey,
  setStoredOpenRouterKey,
  getStoredOpenRouterModel,
  setStoredOpenRouterModel,
  DEFAULT_OPENROUTER_MODEL,
} from '../services/openRouterService';
import {
  REPLICAD_SYSTEM_CONTEXT,
  buildPlanningPrompt,
  buildPhaseCodePrompt,
  buildSelfCorrectionPrompt,
} from '../services/aiCadPrompts';
import {
  extractCodeBlock,
  extractJsonBlock,
  assembleReplicadScript,
} from '../services/aiCadCodeUtils';
import { cadClient, WorkerMeshOutput } from '../cad/cadClient';

const MAX_AUTO_RETRIES = 3;

function formatCadError(err: any): string {
  if (!err) return 'CAD Kernel compilation error';
  if (typeof err === 'string') {
    if (err.includes('[object WebAssembly.Exception]') || err.includes('WebAssembly')) {
      return 'WebAssembly Kernel Geometry Exception (invalid topological boolean cut or collapsing fillet radius)';
    }
    return err;
  }
  if (err.message) return err.message;
  if (err.name === 'RuntimeError' || String(err).includes('WebAssembly')) {
    return 'WebAssembly Kernel Geometry Exception (invalid topological boolean cut or collapsing fillet radius)';
  }
  return String(err);
}

export function useAiCad(config: AiCadConfig = {}) {
  // State Machine Phase
  const [phase, setPhase] = useState<CadPhase>('planning');

  // Stored Design Parameters
  const [designParams, setDesignParams] = useState<DesignParameters>({
    units: 'mm',
    dimensions: {},
    mountingHoles: {},
  });

  // Chat / Agent Interaction History
  const [messages, setMessages] = useState<AiCadMessage[]>([]);

  // Processing & Self-Correction States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Verification Gate State
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);
  const [pendingVerificationPhase, setPendingVerificationPhase] = useState<CadPhase | null>(null);

  // Geometry & Code Registry
  const [currentCode, setCurrentCode] = useState<string>('');
  const [meshes, setMeshes] = useState<WorkerMeshOutput[]>([]);

  // Track live IDE script content
  const currentEditorCodeRef = useRef<string>(config.currentEditorCode || '');
  useEffect(() => {
    if (config.currentEditorCode !== undefined) {
      currentEditorCodeRef.current = config.currentEditorCode;
    }
  }, [config.currentEditorCode]);

  // Phase Code Functions Store
  const phaseCodeRegistry = useRef<{
    buildBaseCode?: string;
    addCutoutsCode?: string;
    addFeaturesCode?: string;
    finalizeModelCode?: string;
  }>({});

  // Active User Intent / Prompt for the current step
  const currentStepPromptRef = useRef<string>('');

  // API Config State
  const [apiKey, setApiKeyState] = useState<string>(
    () => config.apiKey || getStoredOpenRouterKey()
  );
  const [model, setModelState] = useState<string>(
    () => config.model || getStoredOpenRouterModel() || DEFAULT_OPENROUTER_MODEL
  );

  // Keep localStorage in sync
  const setApiKey = useCallback((key: string) => {
    setStoredOpenRouterKey(key);
    setApiKeyState(key);
  }, []);

  const setModel = useCallback((newModel: string) => {
    setStoredOpenRouterModel(newModel);
    setModelState(newModel);
  }, []);

  // Update a specific design parameter
  const setDesignParam = useCallback((key: string, value: any) => {
    setDesignParams((prev) => ({
      ...prev,
      [key]: value,
      custom: {
        ...(prev.custom || {}),
        [key]: value,
      },
    }));
  }, []);

  // Append a message to history
  const addMessage = useCallback((msg: Omit<AiCadMessage, 'id' | 'timestamp'>) => {
    const newMessage: AiCadMessage = {
      ...msg,
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Fallback model cycling notification handler
  const handleModelCycle = useCallback(
    (failedModel: string, nextModel: string, reason: string) => {
      setModelState(nextModel);
      addMessage({
        role: 'ai-correction',
        content: `🔄 **Model Fallback**: \`${failedModel.split('/')[1] || failedModel}\` error (${reason}). Automatically cycling to \`${nextModel.split('/')[1] || nextModel}\`...`,
        modelUsed: nextModel,
      });
    },
    [addMessage]
  );

  /**
   * Evaluates code in CAD Web Worker with error capture
   */
  const evaluateInWorker = useCallback(async (codeToEval: string) => {
    try {
      const result = await cadClient.evaluateCode(codeToEval);
      if (result.success && result.meshes) {
        setMeshes(result.meshes);
        setLastError(null);
        return { success: true, meshes: result.meshes, error: null };
      } else {
        const err = formatCadError(result.error);
        setLastError(err);
        return { success: false, meshes: [], error: err };
      }
    } catch (err: any) {
      const errStr = formatCadError(err);
      setLastError(errStr);
      return { success: false, meshes: [], error: errStr };
    }
  }, []);

  /**
   * Core Step-by-Step Code Generator with 3-Attempt Self-Correction Loop & Model Cycling
   */
  const generateAndVerifyPhaseCode = useCallback(
    async (
      targetPhase: CadPhase,
      stepPrompt: string,
      userFeedback?: string
    ): Promise<boolean> => {
      setIsLoading(true);
      setIsCorrecting(false);
      setRetryCount(0);
      setLastError(null);

      if (stepPrompt) {
        currentStepPromptRef.current = stepPrompt;
      }

      try {
        // 1. Prepare Prompt with full context and live editor code
        const promptContent = buildPhaseCodePrompt(
          targetPhase,
          designParams,
          phaseCodeRegistry.current,
          currentStepPromptRef.current,
          userFeedback,
          currentEditorCodeRef.current
        );

        // Include recent user intent from chat history
        const relevantHistory = messages
          .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.codeSnippet))
          .slice(-6)
          .map((m) => ({
            role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
          }));

        // 2. Call OpenRouter API with automated model cycling
        const completionRes = await OpenRouterService.createChatCompletionWithFallback(
          [
            { role: 'system', content: REPLICAD_SYSTEM_CONTEXT },
            ...relevantHistory,
            { role: 'user', content: promptContent },
          ],
          { apiKey, model },
          handleModelCycle
        );

        let candidateCode = extractCodeBlock(completionRes.content);
        let usedAiModel = completionRes.usedModel;

        // 3. Self-Correction Loop (Try/Catch Web Worker Execution)
        let attempt = 0;
        let compilationSuccess = false;
        let finalAssembledScript = '';
        let lastErrorMsg = '';

        while (attempt < MAX_AUTO_RETRIES) {
          // Check if candidateCode is a full standalone script or modular function
          if (candidateCode.includes('function main') || candidateCode.includes('main(')) {
            finalAssembledScript = candidateCode;
          } else {
            const testRegistry = { ...phaseCodeRegistry.current };
            if (targetPhase === 'base') testRegistry.buildBaseCode = candidateCode;
            if (targetPhase === 'cutouts') testRegistry.addCutoutsCode = candidateCode;
            if (targetPhase === 'features') testRegistry.addFeaturesCode = candidateCode;
            if (targetPhase === 'finalizing') testRegistry.finalizeModelCode = candidateCode;

            finalAssembledScript = assembleReplicadScript(
              designParams,
              testRegistry,
              targetPhase
            );
          }

          // Evaluate candidate code in worker
          const evalResult = await evaluateInWorker(finalAssembledScript);

          if (evalResult.success) {
            compilationSuccess = true;
            setCurrentCode(finalAssembledScript);
            if (!candidateCode.includes('function main')) {
              if (targetPhase === 'base') phaseCodeRegistry.current.buildBaseCode = candidateCode;
              if (targetPhase === 'cutouts') phaseCodeRegistry.current.addCutoutsCode = candidateCode;
              if (targetPhase === 'features') phaseCodeRegistry.current.addFeaturesCode = candidateCode;
              if (targetPhase === 'finalizing') phaseCodeRegistry.current.finalizeModelCode = candidateCode;
            }
            break;
          }

          // Execution failed -> Self-Correction Trigger
          lastErrorMsg = formatCadError(evalResult.error);
          attempt += 1;
          setRetryCount(attempt);
          setIsCorrecting(true);

          addMessage({
            role: 'ai-correction',
            phase: targetPhase,
            correctionAttempt: attempt,
            error: lastErrorMsg,
            modelUsed: usedAiModel,
            content: `⚠️ Step execution error (Attempt ${attempt}/${MAX_AUTO_RETRIES}): "${lastErrorMsg}". Initiating automated self-correction...`,
          });

          if (attempt < MAX_AUTO_RETRIES) {
            // Ask AI to correct the code (with fallback cycling)
            const correctionPrompt = buildSelfCorrectionPrompt({
              error: lastErrorMsg,
              originalPrompt: currentStepPromptRef.current,
              failedCode: candidateCode,
              phase: targetPhase,
              attempt,
            });

            const correctedRes = await OpenRouterService.createChatCompletionWithFallback(
              [
                { role: 'system', content: REPLICAD_SYSTEM_CONTEXT },
                { role: 'user', content: correctionPrompt },
              ],
              { apiKey, model },
              handleModelCycle
            );

            candidateCode = extractCodeBlock(correctedRes.content);
            usedAiModel = correctedRes.usedModel;
          }
        }

        setIsCorrecting(false);

        // 4. Handle Result
        if (compilationSuccess) {
          setPhase(targetPhase);
          setNeedsVerification(true);
          setPendingVerificationPhase(targetPhase);

          addMessage({
            role: 'assistant',
            phase: targetPhase,
            codeSnippet: candidateCode,
            needsVerification: true,
            modelUsed: usedAiModel,
            content: `### 3D Model Generated ⚡\n\n\`\`\`javascript\n${candidateCode}\n\`\`\`\n\n**CAD model updated in workspace. Verify geometry? (Yes/No/Modify)**`,
            suggestedOptions: ['Yes (Looks Great)', 'Modify with Notes', 'Export STEP (.step)'],
          });
          return true;
        } else {
          // Failed 3 times: Request manual intervention
          setLastError(lastErrorMsg);
          addMessage({
            role: 'assistant',
            phase: targetPhase,
            error: lastErrorMsg,
            modelUsed: usedAiModel,
            content: `❌ **Automated Self-Correction Limit Reached**\n\nThe CAD kernel failed to compile after ${MAX_AUTO_RETRIES} attempts.\n**Error:** \`${lastErrorMsg}\`\n\nPlease provide manual instructions, adjust the parameters, or edit the script.`,
            suggestedOptions: ['Retry Step', 'Adjust Dimensions', 'Switch to Manual Edit'],
          });
          return false;
        }
      } catch (err: any) {
        const errorText = formatCadError(err);
        setLastError(errorText);
        addMessage({
          role: 'assistant',
          phase: targetPhase,
          error: errorText,
          content: `⚠️ **AI Service Error**: ${errorText}`,
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, model, designParams, messages, evaluateInWorker, addMessage, handleModelCycle]
  );

  /**
   * Handles user text input across all phases with live editor context awareness & direct code execution
   */
  const sendMessage = useCallback(
    async (userInput: string) => {
      const trimmed = userInput.trim();
      if (!trimmed) return;

      // Add user message
      addMessage({
        role: 'user',
        content: trimmed,
        phase,
      });

      // Handle active verification state if user types text while verification is pending
      if (needsVerification && pendingVerificationPhase) {
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('yes') || lower.includes('proceed') || lower.includes('looks good') || lower.includes('looks great') || lower === 'y') {
          await verifyStep('Yes');
          return;
        } else if (lower.startsWith('no') || lower.includes('regenerate') || lower === 'n') {
          await verifyStep('No');
          return;
        } else if (lower.includes('export')) {
          setPhase('export');
          setNeedsVerification(false);
          setPendingVerificationPhase(null);
          return;
        } else {
          await verifyStep('Modify', trimmed);
          return;
        }
      }

      // Analyze user input with live editor context
      setIsLoading(true);
      setLastError(null);

      try {
        const planningHistory = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-6)
          .map((m) => ({
            role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
          }));

        const responseRes = await OpenRouterService.createChatCompletionWithFallback(
          [
            { role: 'system', content: buildPlanningPrompt(currentEditorCodeRef.current) },
            ...planningHistory,
            { role: 'user', content: trimmed },
          ],
          { apiKey, model },
          handleModelCycle
        );

        const response = responseRes.content;
        const usedAiModel = responseRes.usedModel;

        // Extract any structured parameters from the response
        const jsonMeta = extractJsonBlock<{
          isReadyToGenerate?: boolean;
          parameters?: Partial<DesignParameters>;
          summary?: string;
        }>(response);

        if (jsonMeta?.parameters) {
          setDesignParams((prev) => ({
            ...prev,
            ...jsonMeta.parameters,
            dimensions: {
              ...(prev.dimensions || {}),
              ...(jsonMeta.parameters?.dimensions || {}),
            },
          }));
        }

        // Check if the response contains executable code (e.g. from a direct modification request like "remove holes")
        const rawCode = extractCodeBlock(response);
        if (rawCode && (rawCode.includes('function main') || rawCode.includes('main('))) {
          const evalResult = await evaluateInWorker(rawCode);
          if (evalResult.success) {
            setCurrentCode(rawCode);
            setPhase('export');
            setNeedsVerification(true);
            setPendingVerificationPhase('export');

            // Clean conversational text (strip json)
            const conversationalText = response
              .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '')
              .trim();

            addMessage({
              role: 'assistant',
              phase: 'export',
              codeSnippet: rawCode,
              modelUsed: usedAiModel,
              needsVerification: true,
              content: `${conversationalText}\n\n**CAD model updated in workspace. Verify geometry? (Yes/No/Modify)**`,
              suggestedOptions: ['Yes (Looks Great)', 'Modify with Notes', 'Export STEP (.step)'],
            });
            return;
          }
        }

        // Clean conversational response text (strip the JSON metadata from view)
        const conversationalText = response
          .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '')
          .trim();

        // Check if ready to generate from scratch
        if (jsonMeta?.isReadyToGenerate) {
          addMessage({
            role: 'assistant',
            phase: 'base',
            modelUsed: usedAiModel,
            content: `${conversationalText || 'Generating geometry...'}\n\n📐 **Building parametric model...**`,
          });
          currentStepPromptRef.current = trimmed;
          await generateAndVerifyPhaseCode('base', trimmed);
        } else {
          // Clarifying question or conversational answer
          addMessage({
            role: 'assistant',
            phase: phase === 'planning' ? 'planning' : phase,
            isQuestion: true,
            modelUsed: usedAiModel,
            content: conversationalText || response,
          });
        }
      } catch (err: any) {
        const errText = formatCadError(err);
        setLastError(errText);
        addMessage({
          role: 'assistant',
          phase,
          error: errText,
          content: `⚠️ **AI Service Error**: ${errText}`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      phase,
      messages,
      needsVerification,
      pendingVerificationPhase,
      apiKey,
      model,
      addMessage,
      generateAndVerifyPhaseCode,
      evaluateInWorker,
      handleModelCycle,
    ]
  );

  /**
   * Handles user verification: Yes (Model looks great), No (Regenerate), Modify (Incorporate feedback)
   */
  const verifyStep = useCallback(
    async (action: VerificationAction, feedback?: string) => {
      if (!pendingVerificationPhase) return;

      const currentVerifiedPhase = pendingVerificationPhase;
      setNeedsVerification(false);
      setPendingVerificationPhase(null);

      if (action === 'Yes') {
        setPhase('export');
        addMessage({
          role: 'user',
          content: '✅ Verified geometry: Looks great!',
          phase: 'export',
        });

        addMessage({
          role: 'assistant',
          phase: 'export',
          content: `🎉 **Parametric 3D Solid Ready!**\n\nThe model is active in your workspace IDE and compiled in the 3D viewport.\nYou can continue modifying it anytime by typing in the chat, or export directly to **STEP** or **STL**:`,
          suggestedOptions: ['Export STEP (.step)', 'Export STL (.stl)', 'Start New Design'],
        });
      } else if (action === 'No') {
        addMessage({
          role: 'user',
          content: '🔄 Geometry rejected. Regenerating model...',
          phase: currentVerifiedPhase,
        });
        await generateAndVerifyPhaseCode(
          'base',
          currentStepPromptRef.current
        );
      } else if (action === 'Modify') {
        const modifyNote = feedback || 'Please refine the geometry.';
        addMessage({
          role: 'user',
          content: `✏️ Modify request: ${modifyNote}`,
          phase: currentVerifiedPhase,
        });
        await sendMessage(modifyNote);
      }
    },
    [pendingVerificationPhase, addMessage, generateAndVerifyPhaseCode, sendMessage]
  );

  /**
   * Direct model export handler (STEP / STL)
   */
  const exportModel = useCallback(
    async (format: 'step' | 'stl') => {
      try {
        return await cadClient.exportModel(format);
      } catch (err: any) {
        setLastError(formatCadError(err));
        return null;
      }
    },
    []
  );

  /**
   * Resets AI CAD session back to initial state
   */
  const resetSession = useCallback(() => {
    setPhase('planning');
    setDesignParams({ units: 'mm', dimensions: {}, mountingHoles: {} });
    setMessages([]);
    setIsLoading(false);
    setIsCorrecting(false);
    setRetryCount(0);
    setLastError(null);
    setNeedsVerification(false);
    setPendingVerificationPhase(null);
    setCurrentCode('');
    setMeshes([]);
    phaseCodeRegistry.current = {};
    currentStepPromptRef.current = '';
  }, []);

  return {
    // State
    phase,
    designParams,
    messages,
    isLoading,
    isCorrecting,
    retryCount,
    lastError,
    needsVerification,
    pendingVerificationPhase,
    currentCode,
    meshes,
    apiKey,
    model,

    // Actions
    sendMessage,
    verifyStep,
    setApiKey,
    setModel,
    setDesignParam,
    resetSession,
    exportModel,
    evaluateInWorker,
  };
}
