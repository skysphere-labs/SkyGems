import React, { useState, useCallback } from 'react';

export interface PipelineStep {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed';
  message: string;
  details?: string[];
}

interface UsePipelineReturn {
  status: 'idle' | 'running' | 'completed';
  steps: PipelineStep[];
  progress: number;
  logs: string[];
  results: any[];
  startPipeline: (onStep?: (step: PipelineStep) => void) => Promise<void>;
  reset: () => void;
  addLog: (message: string) => void;
}

/**
 * Custom hook for managing pipeline state and execution
 * Handles step progression, logging, and result management
 */
export const usePipeline = (): UsePipelineReturn => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  /**
   * Add a log entry with timestamp
   */
  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  /**
   * Update a specific step's status and message
   */
  const updateStep = useCallback((stepId: number, status: 'pending' | 'running' | 'completed', message: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, message } : step
      )
    );
  }, []);

  /**
   * Execute the pipeline with async step processing
   * @param onStep Optional callback when each step completes
   */
  const startPipeline = useCallback(
    async (onStep?: (step: PipelineStep) => void) => {
      setStatus('running');
      setProgress(0);
      setLogs([]);
      addLog('Pipeline initialized...');

      // Step definitions
      const pipelineSteps = [
        { id: 1, name: 'Reading Configuration' },
        { id: 2, name: 'Building Base Prompt' },
        { id: 3, name: 'Injecting Design Variations' },
        { id: 4, name: 'Optimizing Prompt for Quality' },
        { id: 5, name: 'Applying Material & Gemstone Enhancements' },
        { id: 6, name: 'Generating Design Concepts' },
        { id: 7, name: 'Checking for Duplicates' },
        { id: 8, name: 'Finalizing Unique Designs' },
        { id: 9, name: 'Saving to Design Library' },
        { id: 10, name: 'Rendering Results' },
      ];

      // Initialize steps
      setSteps(
        pipelineSteps.map((step) => ({
          ...step,
          status: 'pending' as const,
          message: 'Pending...',
          details: [],
        }))
      );

      // Process each step
      for (let i = 0; i < pipelineSteps.length; i++) {
        const stepDef = pipelineSteps[i];
        const duration = Math.random() * 900 + 300; // 300-1200ms

        // Mark as running
        updateStep(stepDef.id, 'running', `Processing ${stepDef.name.toLowerCase()}...`);
        addLog(`Starting: ${stepDef.name}`);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, duration));

        // Mark as completed
        const completedStep: PipelineStep = {
          id: stepDef.id,
          name: stepDef.name,
          status: 'completed',
          message: 'Complete',
          details: [],
        };
        updateStep(stepDef.id, 'completed', 'Complete');
        addLog(`✓ ${stepDef.name} completed`);

        // Update progress
        const newProgress = ((i + 1) / pipelineSteps.length) * 100;
        setProgress(newProgress);

        // Callback when step completes
        onStep?.(completedStep);
      }

      // Pipeline complete
      setStatus('completed');
      addLog('Pipeline completed successfully!');

      const mockResults = Array.from({ length: 4 }, (_, i) => ({
        id: `design-${Date.now()}-${i}`,
        title: `Generated Design ${i + 1}`,
        imageUrl: `https://via.placeholder.com/400x400/1A1A1A/D4AF37?text=Design+${i + 1}`,
      }));
      setResults(mockResults);
    },
    [addLog, updateStep]
  );

  /**
   * Reset pipeline to initial state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setSteps([]);
    setProgress(0);
    setLogs([]);
    setResults([]);
  }, []);

  return {
    status,
    steps,
    progress,
    logs,
    results,
    startPipeline,
    reset,
    addLog,
  };
};
