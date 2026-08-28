/**
 * useAiCad - Robust, Self-Correcting React Hook for Agentic Step-by-Step CAD Generation
 * 
 * Implements:
 * 1. Strict State Machine: planning -> base -> cutouts -> features -> finalizing -> export
 * 2. Real-time Live IDE Script Awareness (knows what is in the editor)
 * 3. Conversational Planning & Context Awareness
 * 4. Step-by-step modular Replicad code generation & modification
 * 5. Self-Correction Loop with up to 3 automated retries upon Web Worker compilation/geometry failure
 * 6. OpenRouter API integration with autonomous model cycling & tracking
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

const PHASE_SEQUENCE: CadPhase[] = [
  'planning',
  'base',
  'cutouts',
  'features',
  'finalizing',
  'export',
];

const MAX_AUTO_RETRIES = 3;

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
        const err = result.error || 'CAD Kernel geometric compilation failed.';
        setLastError(err);
        return { success: false, meshes: [], error: err };
      }
    } catch (err: any) {
      const errStr = err?.message || String(err);
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
          // Update registry candidate
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

          // Evaluate candidate code in worker
          const evalResult = await evaluateInWorker(finalAssembledScript);

          if (evalResult.success) {
            compilationSuccess = true;
            setCurrentCode(finalAssembledScript);
            phaseCodeRegistry.current = testRegistry;
            break;
          }

          // Execution failed -> Self-Correction Trigger
          lastErrorMsg = evalResult.error || 'CAD Worker evaluation error';
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
            content: `### Step ${targetPhase.toUpperCase()} Complete ⚡\n\n\`\`\`javascript\n${candidateCode}\n\`\`\`\n\n**Step complete. Verify geometry? (Yes/No/Modify)**`,
            suggestedOptions: ['Yes (Proceed)', 'No (Regenerate)', 'Modify with Notes'],
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
        const errorText = err?.message || String(err);
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
   * Handles user text input across all phases with live editor context awareness
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
        if (lower.startsWith('yes') || lower.includes('proceed') || lower.includes('looks good') || lower === 'y') {
          await verifyStep('Yes');
          return;
        } else if (lower.startsWith('no') || lower.includes('regenerate') || lower === 'n') {
          await verifyStep('No');
          return;
        } else {
          await verifyStep('Modify', trimmed);
          return;
        }
      }

      // If in planning phase: analyze with live editor context
      if (phase === 'planning') {
        setIsLoading(true);
        setLastError(null);

        try {
          const planningHistory = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
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

          // Clean conversational response text (strip the JSON metadata from view)
          const conversationalText = response
            .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '')
            .trim();

          // Check if ready to generate/modify
          if (jsonMeta?.isReadyToGenerate) {
            addMessage({
              role: 'assistant',
              phase: 'planning',
              modelUsed: usedAiModel,
              content: `${conversationalText || 'Updating design parameters.'}\n\n📐 **Generating geometry...**`,
            });
            currentStepPromptRef.current = trimmed;
            await generateAndVerifyPhaseCode('base', trimmed);
          } else {
            // Vague input or questions needed
            addMessage({
              role: 'assistant',
              phase: 'planning',
              isQuestion: true,
              modelUsed: usedAiModel,
              content: conversationalText || response,
            });
          }
        } catch (err: any) {
          const errText = err?.message || String(err);
          setLastError(errText);
          addMessage({
            role: 'assistant',
            phase: 'planning',
            error: errText,
            content: `⚠️ **Planning Error**: ${errText}`,
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // If in intermediate phases, treat user prompt as modification or next instruction with full context
      await generateAndVerifyPhaseCode(phase, currentStepPromptRef.current, trimmed);
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
      handleModelCycle,
    ]
  );

  /**
   * Handles user verification: Yes (Proceed to next phase), No (Regenerate), Modify (Incorporate feedback)
   */
  const verifyStep = useCallback(
    async (action: VerificationAction, feedback?: string) => {
      if (!pendingVerificationPhase) return;

      const currentVerifiedPhase = pendingVerificationPhase;
      setNeedsVerification(false);
      setPendingVerificationPhase(null);

      if (action === 'Yes') {
        addMessage({
          role: 'user',
          content: '✅ Verified geometry: Looks good, proceed to next step.',
          phase: currentVerifiedPhase,
        });

        // Determine next phase in sequence
        const currentIndex = PHASE_SEQUENCE.indexOf(currentVerifiedPhase);
        const nextPhase = PHASE_SEQUENCE[currentIndex + 1] || 'export';

        if (nextPhase === 'export') {
          setPhase('export');
          addMessage({
            role: 'assistant',
            phase: 'export',
            content: `🎉 **Parametric 3D Solid Completed & Verified!**\n\nYour model is fully compiled and ready for manufacturing.\nYou can now export directly to **STEP (\`.step\`)** B-Rep solid or **STL (\`.stl\`)** 3D print mesh.`,
            suggestedOptions: ['Export STEP (.step)', 'Export STL (.stl)', 'Start New Design'],
          });
        } else {
          setPhase(nextPhase);
          addMessage({
            role: 'assistant',
            phase: nextPhase,
            content: `Moving to **Phase ${currentIndex + 1}: ${nextPhase.toUpperCase()}**... Generating procedural geometry...`,
          });
          await generateAndVerifyPhaseCode(nextPhase, currentStepPromptRef.current);
        }
      } else if (action === 'No') {
        addMessage({
          role: 'user',
          content: '🔄 Geometry rejected. Regenerating current step...',
          phase: currentVerifiedPhase,
        });
        await generateAndVerifyPhaseCode(
          currentVerifiedPhase,
          currentStepPromptRef.current
        );
      } else if (action === 'Modify') {
        const modifyNote = feedback || 'Please refine the dimensions and alignments.';
        addMessage({
          role: 'user',
          content: `✏️ Modify request: ${modifyNote}`,
          phase: currentVerifiedPhase,
        });
        await generateAndVerifyPhaseCode(
          currentVerifiedPhase,
          currentStepPromptRef.current,
          modifyNote
        );
      }
    },
    [pendingVerificationPhase, addMessage, generateAndVerifyPhaseCode]
  );

  /**
   * Direct model export handler (STEP / STL)
   */
  const exportModel = useCallback(
    async (format: 'step' | 'stl') => {
      try {
        return await cadClient.exportModel(format);
      } catch (err: any) {
        setLastError(err?.message || String(err));
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
