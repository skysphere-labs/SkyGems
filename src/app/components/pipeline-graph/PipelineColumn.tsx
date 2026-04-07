import React from 'react';
import { motion } from 'motion/react';
import { PipelineNode } from './PipelineNode';

export interface PipelineNodeData {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  duration?: number;
}

interface PipelineColumnProps {
  stageName: string;
  stageDescription?: string;
  nodes: PipelineNodeData[];
  selectedNodeId?: number;
  onSelectNode?: (id: number) => void;
  onRetryNode?: (id: number) => void;
  columnIndex?: number;
}

/**
 * Pipeline stage column containing grouped nodes
 * Represents a logical phase in the pipeline (e.g., "Input Processing", "Validation")
 */
export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stageName,
  stageDescription,
  nodes,
  selectedNodeId,
  onSelectNode,
  onRetryNode,
  columnIndex = 0,
}) => {
  const getCompletedCount = () => nodes.filter((n) => n.status === 'completed').length;
  const getTotalCount = () => nodes.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: columnIndex * 0.1, duration: 0.4 }}
      className="flex flex-col min-w-max"
    >
      {/* Column Header */}
      <div className="mb-4 px-4">
        <h3 className="text-sm font-bold text-gray-900 mb-1">{stageName}</h3>
        {stageDescription && (
          <p className="text-xs text-gray-600 mb-2">{stageDescription}</p>
        )}
        {nodes.length > 1 && (
          <div className="text-xs text-gray-500 font-medium">
            {getCompletedCount()} of {getTotalCount()} completed
          </div>
        )}
      </div>

      {/* Nodes Container with Background */}
      <div className="relative bg-gradient-to-b from-gray-50/50 to-gray-50/20 border border-gray-200 rounded-2xl p-4 space-y-3 min-h-[150px] flex flex-col justify-center">
        {/* Subtle corner accent */}
        <div className="absolute top-0 right-0 w-1 h-8 bg-gradient-to-b from-blue-400 to-transparent rounded-bl-lg opacity-50"></div>

        {/* Nodes */}
        <div className="space-y-3 relative z-10">
          {nodes.map((node, idx) => (
            <PipelineNode
              key={node.id}
              {...node}
              isSelected={selectedNodeId === node.id}
              onSelect={onSelectNode}
              onRetry={onRetryNode}
            />
          ))}
        </div>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-sm">No steps in this stage</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
