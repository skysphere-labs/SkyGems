/**
 * DAG Pipeline Visualization using SVG
 * 
 * Visualizes the multi-agent pipeline as a Directed Acyclic Graph
 * with real-time status updates and animated flows
 */

import React, { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { DAGNode, buildJewelryDesignDAG, updateNodeInDAG } from '../../orchestrator/DAG';
import { AgentExecutionUpdate } from '../../agents/types';

interface DAGPipelineProps {
  isRunning?: boolean;
  onNodeStatusChange?: (nodeId: string, status: string) => void;
}

interface VisualizationNode extends DAGNode {
  x: number;
  y: number;
}

/**
 * Build visualization layout for DAG
 */
function buildVisualizationLayout(): VisualizationNode[] {
  const dag = buildJewelryDesignDAG();

  const positions: Record<string, { x: number; y: number }> = {
    start: { x: 50, y: 50 },
    brief_normalizer: { x: 50, y: 130 },
    reference_retriever: { x: 50, y: 210 },
    direction_planner: { x: 50, y: 290 },
    generator_group: { x: 50, y: 420 },
    merge_generated: { x: 50, y: 500 },
    critic_council: { x: 50, y: 580 },
    merge_scored: { x: 50, y: 660 },
    ranking_engine: { x: 50, y: 740 },
    repair: { x: 50, y: 820 },
    scene: { x: 20, y: 920 },
    inspiration_writer: { x: 50, y: 920 },
    technical_pack: { x: 80, y: 920 },
    data_curator: { x: 50, y: 1000 },
    end: { x: 50, y: 1080 },
  };

  return dag.nodes.map((node) => ({
    ...node,
    ...positions[node.id],
  }));
}

/**
 * Get node color based on status
 */
function getNodeColor(status: string): string {
  switch (status) {
    case 'running':
      return '#C9A227'; // Gold
    case 'completed':
      return '#22c55e'; // Green
    case 'error':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}

/**
 * Main DAG Pipeline Component
 */
export const DAGPipeline: React.FC<DAGPipelineProps> = ({ isRunning = false, onNodeStatusChange }) => {
  const [nodes, setNodes] = useState<VisualizationNode[]>(buildVisualizationLayout());

  /**
   * Update node status when step completes
   */
  const handleStepUpdate = useCallback(
    (update: AgentExecutionUpdate) => {
      // Map step names to node IDs
      const stepToNodeId: Record<string, string> = {
        'Reading Configuration': 'brief_normalizer',
        'Retrieving References': 'reference_retriever',
        'Planning Directions': 'direction_planner',
        'Generating Concepts': 'generator_group',
        'Evaluating Designs': 'critic_council',
        'Ranking Designs': 'ranking_engine',
        'Refining Designs': 'repair',
        'Creating Scenes': 'scene',
        'Writing Inspiration': 'inspiration_writer',
        'Generating Technical Pack': 'technical_pack',
        'Learning from Data': 'data_curator',
      };

      const nodeId = stepToNodeId[update.step];
      if (nodeId) {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  status: update.status,
                  message: update.message,
                  progress: update.progress,
                }
              : node
          )
        );

        onNodeStatusChange?.(nodeId, update.status);
      }
    },
    [onNodeStatusChange]
  );

  const DAGSVGVisualization = (
    <svg width="100%" height="100%" viewBox="0 0 150 1150" className="bg-background">
      {/* Draw edges first (behind nodes) */}
      {[
        [50, 80, 50, 130],
        [50, 160, 50, 210],
        [50, 240, 50, 290],
        [50, 320, 50, 420],
        [50, 450, 50, 500],
        [50, 530, 50, 580],
        [50, 610, 50, 660],
        [50, 690, 50, 740],
        [50, 770, 50, 820],
        [50, 850, 20, 920],
        [50, 850, 50, 920],
        [50, 850, 80, 920],
        [20, 950, 50, 1000],
        [50, 950, 50, 1000],
        [80, 950, 50, 1000],
        [50, 1030, 50, 1080],
      ].map((edge, idx) => (
        <line
          key={`edge-${idx}`}
          x1={edge[0]}
          y1={edge[1]}
          x2={edge[2]}
          y2={edge[3]}
          stroke="#d1d5db"
          strokeWidth="2"
        />
      ))}

      {/* Draw nodes */}
      {nodes.map((node) => (
        <g key={node.id}>
          {/* Node circle */}
          <motion.circle
            cx={node.x}
            cy={node.y}
            r="12"
            fill={getNodeColor(node.status)}
            animate={{
              boxShadow:
                node.status === 'running'
                  ? '0 0 12px rgba(201, 162, 39, 0.6)'
                  : '0 0 0px rgba(0, 0, 0, 0)',
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Node label (positioned below) */}
          <text
            x={node.x}
            y={node.y + 25}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#374151"
            className="select-none"
          >
            {node.label.split(' ')[0]}
          </text>

          {/* Progress/status indicator */}
          {node.status === 'running' && (
            <circle cx={node.x} cy={node.y} r="16" fill="none" stroke="#C9A227" strokeWidth="1">
              <animate
                attributeName="r"
                from="14"
                to="18"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
      ))}
    </svg>
  );

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="flex-1 overflow-auto border border-border rounded-lg m-4">
        {DAGSVGVisualization}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#C9A227]" />
            <span>Running</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Error</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 pb-4 text-sm text-muted-foreground">
        Pipeline Status: {isRunning ? '🟢 Running' : '⚫ Idle'}
      </div>
    </div>
  );
};

export default DAGPipeline;
