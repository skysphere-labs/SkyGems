import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PipelineColumn, PipelineNodeData } from './PipelineColumn';
import { PipelineConnections } from './PipelineConnections';
import { ProgressBar } from '../pipeline/ProgressBar';
import { LogsPanel } from '../pipeline/LogsPanel';
import { DesignCard } from '../pipeline/DesignCard';
import { ChevronRight } from 'lucide-react';

interface PipelineStageData {
  id: string;
  name: string;
  description?: string;
  steps: PipelineNodeData[];
}

interface PipelineGraphProps {
  isRunning?: boolean;
  onComplete?: (results: any[]) => void;
  designConfigs?: any;
}

/**
 * REALISTIC DELAY STRATEGY
 * Each step has a specific duration to simulate actual AI processing
 * Total pipeline time: ~6-7 seconds (simulates heavy AI computation)
 */
const STEP_DELAYS = {
  1: 500,   // Reading Configuration
  2: 600,   // Building Base Prompt
  3: 800,   // Injecting Design Variations
  4: 700,   // Optimizing Prompt
  5: 700,   // Material & Gemstone Enhancements
  6: 1200,  // Generating Design Concepts (longest - main AI work)
  7: 900,   // Checking for Duplicates
  8: 600,   // Finalizing Unique Designs
  9: 400,   // Saving to Design Library
  10: 300,  // Rendering Results
};

// Total delay across all steps: ~6.8 seconds
const TOTAL_STEP_DELAY = Object.values(STEP_DELAYS).reduce((a, b) => a + b, 0);
const BUFFER_DELAY = 800;  // Additional delay before showing results
const RESULT_FADE_DELAY = 500;  // Smooth transition delay

/**
 * DYNAMIC STEP MESSAGES
 * Rotating messages to simulate real processing
 */
const STEP_MESSAGES: Record<number, string[]> = {
  1: ['Analyzing selected inputs...', 'Processing parameters...', 'Validating configuration...'],
  2: ['Constructing base prompt...', 'Building descriptive text...', 'Structuring prompt layers...'],
  3: ['Applying variation: twisted band...', 'Exploring design structures...', 'Injecting variation elements...'],
  4: ['Enhancing prompt quality...', 'Adding creative directives...', 'Improving specifications...'],
  5: ['Adding gold reflections...', 'Enhancing material properties...', 'Applying gemstone sparkle...'],
  6: ['Generating unique concepts...', 'Creating design variations...', 'Building visual prompts...'],
  7: ['Checking for duplicates...', 'Verifying uniqueness...', 'Analyzing similarity...'],
  8: ['Finalizing output...', 'Optimizing results...', 'Preparing designs...'],
  9: ['Saving to design library...', 'Storing metadata...', 'Indexing designs...'],
  10: ['Rendering results...', 'Generating preview...', 'Processing complete!'],
};

/**
 * GitHub Actions-style pipeline graph component
 * Displays steps grouped by stages with connecting lines
 */
export const PipelineGraph: React.FC<PipelineGraphProps> = ({
  isRunning = false,
  onComplete,
  designConfigs,
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [stages, setStages] = useState<PipelineStageData[]>([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>();
  const [results, setResults] = useState<any[]>([]);
  const [likedDesigns, setLikedDesigns] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pipelineStartTimeRef = useRef<number>(0);

  // Initialize stages
  useEffect(() => {
    const initialStages: PipelineStageData[] = [
      {
        id: 'input',
        name: 'Input Processing',
        description: 'Parse and validate user configuration',
        steps: [
          {
            id: 1,
            name: 'Reading Configuration',
            status: 'pending',
            message: 'Analyzing selected inputs...',
          },
          {
            id: 2,
            name: 'Building Base Prompt',
            status: 'pending',
            message: 'Constructing base prompt...',
          },
        ],
      },
      {
        id: 'prompt-engineering',
        name: 'Prompt Engineering',
        description: 'Enhance and optimize the prompt',
        steps: [
          {
            id: 3,
            name: 'Injecting Design Variations',
            status: 'pending',
            message: 'Adding variation elements...',
          },
          {
            id: 4,
            name: 'Optimizing Prompt for Quality',
            status: 'pending',
            message: 'Enhancing quality directives...',
          },
          {
            id: 5,
            name: 'Applying Material & Gemstone Enhancements',
            status: 'pending',
            message: 'Adding material realism...',
          },
        ],
      },
      {
        id: 'generation',
        name: 'Generation',
        description: 'Generate design concepts',
        steps: [
          {
            id: 6,
            name: 'Generating Design Concepts',
            status: 'pending',
            message: 'Creating unique designs...',
          },
        ],
      },
      {
        id: 'validation',
        name: 'Validation',
        description: 'Verify and finalize designs',
        steps: [
          {
            id: 7,
            name: 'Checking for Duplicates',
            status: 'pending',
            message: 'Verifying uniqueness...',
          },
          {
            id: 8,
            name: 'Finalizing Unique Designs',
            status: 'pending',
            message: 'Preparing final output...',
          },
        ],
      },
      {
        id: 'output',
        name: 'Output',
        description: 'Save and display results',
        steps: [
          {
            id: 9,
            name: 'Saving to Design Library',
            status: 'pending',
            message: 'Storing designs...',
          },
          {
            id: 10,
            name: 'Rendering Results',
            status: 'pending',
            message: 'Preparing display...',
          },
        ],
      },
    ];

    setStages(initialStages);
  }, []);

  // Add log entry
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  /**
   * HELPER: Delay utility
   * Used to introduce realistic pauses between steps
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  /**
   * HELPER: Get dynamic message for a step
   * Cycles through realistic messages to show progress
   */
  const getDynamicMessage = (stepId: number, index: number = 0): string => {
    const messages = STEP_MESSAGES[stepId] || ['Processing...'];
    return messages[index % messages.length];
  };

  /**
   * ENHANCED: Run pipeline with realistic delays
   * - Each step has a specific delay matching the STEP_DELAYS config
   * - Dynamic messages show real processing activity
   * - Buffer delay ensures results don't appear too quickly
   * - Failsafe enforces minimum 4-6 second total pipeline time
   */
  const runPipeline = async () => {
    console.log('🚀 Pipeline started');
    setStatus('running');
    setProgress(0);
    setLogs([]);
    setShowResults(false);
    pipelineStartTimeRef.current = Date.now();
    
    addLog('Pipeline started...');
    addLog(`Total estimated time: ${(TOTAL_STEP_DELAY + BUFFER_DELAY) / 1000}s`);

    let completedSteps = 0;
    const totalSteps = stages.flatMap((s) => s.steps).length;

    // Process each stage sequentially
    for (const stageIdx in stages) {
      const stage = stages[stageIdx];

      // Process each step in stage with realistic delays
      for (const stepIdx in stage.steps) {
        const step = stage.steps[stepIdx];
        const stepDelay = STEP_DELAYS[step.id as keyof typeof STEP_DELAYS] || 500;

        // MARK AS RUNNING with initial message
        setStages((prev) =>
          prev.map((s) =>
            s.id === stage.id
              ? {
                  ...s,
                  steps: s.steps.map((st) =>
                    st.id === step.id
                      ? {
                          ...st,
                          status: 'running' as const,
                          message: getDynamicMessage(step.id, 0),
                        }
                      : st
                  ),
                }
              : s
          )
        );

        setSelectedNodeId(step.id);
        addLog(`Starting: ${step.name}`);
        console.log(`⏳ Step ${step.id}: ${step.name} (${stepDelay}ms)`);

        // SIMULATE PROCESSING with message rotation
        const messageUpdateInterval = setInterval(() => {
          const msgIndex = Math.floor(Math.random() * 3);
          setStages((prev) =>
            prev.map((s) =>
              s.id === stage.id
                ? {
                    ...s,
                    steps: s.steps.map((st) =>
                      st.id === step.id
                        ? {
                            ...st,
                            message: getDynamicMessage(step.id, msgIndex),
                          }
                        : st
                    ),
                  }
                : s
            )
          );
        }, stepDelay / 2);

        // Wait for step duration
        await delay(stepDelay);
        clearInterval(messageUpdateInterval);

        // MARK AS COMPLETED
        setStages((prev) =>
          prev.map((s) =>
            s.id === stage.id
              ? {
                  ...s,
                  steps: s.steps.map((st) =>
                    st.id === step.id
                      ? {
                          ...st,
                          status: 'completed' as const,
                          message: 'Complete',
                          duration: stepDelay / 1000,
                        }
                      : st
                  ),
                }
              : s
          )
        );

        completedSteps++;
        const newProgress = (completedSteps / totalSteps) * 100;
        setProgress(newProgress);
        addLog(`✓ ${step.name} completed`);
        console.log(`✅ Step ${step.id} completed`);

        // Occasional realism: duplicate detection message
        if (step.id === 7 && Math.random() > 0.5) {
          addLog('ℹ️ Duplicate detected, regenerating...');
          await delay(500);
        }
      }
    }

    console.log('⏸️ Pipeline steps complete, adding buffer...');
    addLog('Steps complete, preparing results...');

    // BUFFER DELAY: Ensure results don't appear instantly
    // This simulates final processing and image generation
    await delay(BUFFER_DELAY);

    // GENERATE RESULTS
    console.log('🎨 Generating design results...');
    addLog('Rendering design results...');

    const mockResults = Array.from({ length: 4 }, (_, i) => ({
      id: `design-${Date.now()}-${i}`,
      title: `Design ${i + 1}`,
      imageUrl: `https://via.placeholder.com/400x400/1A1A1A/D4AF37?text=Design+${i + 1}`,
    }));

    setResults(mockResults);

    // SMALL RESULT DELAY: Brief pause before showing results
    await delay(RESULT_FADE_DELAY);

    addLog('Pipeline completed successfully!');
    setStatus('completed');
    
    // FAILSAFE: Enforce minimum total pipeline time (4-6 seconds)
    const elapsedTime = Date.now() - pipelineStartTimeRef.current;
    const minimumTime = 4000; // 4 seconds minimum
    
    if (elapsedTime < minimumTime) {
      const additionalDelay = minimumTime - elapsedTime;
      console.log(`⏱️ Failsafe: Adding ${additionalDelay}ms to reach minimum time`);
      addLog(`Finalizing (${additionalDelay}ms)...`);
      await delay(additionalDelay);
    }

    console.log(`🎉 Pipeline complete! Total time: ${Date.now() - pipelineStartTimeRef.current}ms`);
    setShowResults(true);
    onComplete?.(mockResults);
  };

  // Trigger pipeline when isRunning changes
  useEffect(() => {
    if (isRunning && status === 'idle') {
      runPipeline();
    }
  }, [isRunning, status, stages]);

  // Idle state
  if (status === 'idle' && results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          <div className="text-5xl">✨</div>
          <h2 className="text-2xl font-bold text-gray-900">Ready to Generate</h2>
          <p className="text-gray-600">Configure your design and click Generate Designs</p>
        </div>
      </motion.div>
    );
  }

  // Running state - Graph view
  if (status === 'running') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col space-y-6 p-6 overflow-y-auto"
      >
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Generating Designs</h2>
          <p className="text-sm text-gray-600">AI pipeline processing in real-time...</p>
        </div>

        {/* Progress Bar */}
        <ProgressBar current={Math.ceil(progress / 10)} total={10} />

        {/* Pipeline Graph */}
        <div ref={containerRef} className="flex-1 overflow-x-auto bg-white rounded-lg border border-gray-200 p-8">
          <div className="relative min-h-[300px] flex items-center gap-12">
            {/* Connection Lines */}
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
              <PipelineConnections
                columnCount={stages.length}
                columnHeight={300}
                gapBetweenColumns={350}
                isActive={true}
              />
            </div>

            {/* Columns */}
            <div className="relative z-10 flex gap-12">
              {stages.map((stage, idx) => (
                <PipelineColumn
                  key={stage.id}
                  stageName={stage.name}
                  stageDescription={stage.description}
                  nodes={stage.steps}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  columnIndex={idx}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Logs Panel */}
        <LogsPanel
          logs={logs}
          isOpen={logsOpen}
          onToggle={() => setLogsOpen(!logsOpen)}
        />
      </motion.div>
    );
  }

  // Completed state - Results with fade transition
  return (
    <AnimatePresence mode="wait">
      {showResults ? (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full flex flex-col space-y-6 p-6 overflow-y-auto"
        >
          {/* Header */}
          <div className="space-y-2">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl font-bold text-gray-900"
            >
              Generation Complete ✓
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-sm text-gray-600"
            >
              {results.length} unique designs generated and saved to your library
            </motion.p>
          </div>

          {/* Results Grid - Staggered animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex-1 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto"
          >
            {results.map((result, idx) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
              >
                <DesignCard
                  {...result}
                  isLiked={likedDesigns.has(result.id)}
                  onLike={(id) => {
                    setLikedDesigns((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) {
                        next.delete(id);
                      } else {
                        next.add(id);
                      }
                      return next;
                    });
                  }}
                  onRegenerate={(id) => console.log('Regenerate:', id)}
                  onDownload={(id) => {
                    const result = results.find((r) => r.id === id);
                    if (result?.imageUrl) {
                      const a = document.createElement('a');
                      a.href = result.imageUrl;
                      a.download = `${result.title || 'design'}.jpg`;
                      a.click();
                    }
                  }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="flex gap-3 pt-4 border-t border-gray-200"
          >
            <button
              onClick={() => {
                setStatus('idle');
                setResults([]);
                setProgress(0);
                setShowResults(false);
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Generate New Designs
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Browse Gallery
            </button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <div className="text-5xl animate-pulse">✨</div>
            <h2 className="text-xl font-semibold text-gray-900">Finalizing results...</h2>
            <p className="text-sm text-gray-600">One moment while we prepare your designs</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
