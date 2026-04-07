import React from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PipelineNodeProps {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  duration?: number;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onRetry?: (id: number) => void;
}

/**
 * Individual pipeline node/step component
 * Displays as a rounded card with status indicator
 */
export const PipelineNode: React.FC<PipelineNodeProps> = ({
  id,
  name,
  status,
  message,
  duration,
  isSelected,
  onSelect,
  onRetry,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          </motion.div>
        );
      case 'running':
        return (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
          </motion.div>
        );
      case 'failed':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          </motion.div>
        );
      default:
        return <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />;
    }
  };

  const getNodeStyles = () => {
    let baseStyles = 'px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer ';

    if (status === 'completed') {
      return baseStyles + 'border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:shadow-md';
    } else if (status === 'running') {
      return (
        baseStyles +
        'border-blue-400 bg-blue-50 hover:border-blue-500 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50'
      );
    } else if (status === 'failed') {
      return baseStyles + 'border-red-200 bg-red-50 hover:border-red-400 hover:shadow-md';
    }
    return baseStyles + 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:shadow-sm';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      {/* Main Node Card */}
      <button
        onClick={() => onSelect?.(id)}
        className={`flex items-center gap-3 text-left ${getNodeStyles()} ${
          isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
        }`}
      >
        {/* Status Icon */}
        {getStatusIcon()}

        {/* Node Content */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>
          {message && (
            <div className="text-xs text-gray-600 truncate mt-0.5">
              {message}
            </div>
          )}
          {duration && status === 'completed' && (
            <div className="text-xs text-gray-500 mt-0.5">
              Completed in {duration.toFixed(2)}s
            </div>
          )}
        </div>

        {/* Retry Icon (for failed status) */}
        {status === 'failed' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry?.(id);
            }}
            className="p-1 hover:bg-red-200 rounded-full transition-colors"
            title="Retry step"
          >
            <ChevronRight className="w-4 h-4 text-red-600" />
          </button>
        )}
      </button>

      {/* Tooltip on Hover */}
      {status === 'running' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Processing...
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      )}
    </motion.div>
  );
};
