import React from 'react';
import { ChevronDown, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PipelineStepProps {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed';
  message: string;
  details?: string[];
  isExpanded?: boolean;
  onToggleExpand?: (id: number) => void;
}

export const PipelineStep: React.FC<PipelineStepProps> = ({
  id,
  name,
  status,
  message,
  details,
  isExpanded,
  onToggleExpand,
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
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </motion.div>
        );
      case 'running':
        return (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <Loader2 className="w-6 h-6 text-blue-500" />
          </motion.div>
        );
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-l-2 pl-6 pb-8 relative transition-all ${
        status === 'running'
          ? 'border-blue-500'
          : status === 'completed'
            ? 'border-emerald-500'
            : 'border-gray-200'
      }`}
    >
      {/* Status Icon */}
      <div className="absolute -left-3.5 top-0">
        {getStatusIcon()}
      </div>

      {/* Step Content */}
      <motion.div
        className={`rounded-lg p-4 transition-all cursor-pointer ${
          status === 'running'
            ? 'bg-blue-50 border border-blue-200 shadow-md shadow-blue-200/50'
            : status === 'completed'
              ? 'bg-emerald-50 border border-emerald-100'
              : 'bg-gray-50 border border-gray-100 hover:border-gray-200'
        }`}
        onClick={() => onToggleExpand?.(id)}
        whileHover={{ scale: 1.01 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4
              className={`font-semibold text-sm transition-colors ${
                status === 'running'
                  ? 'text-blue-900'
                  : status === 'completed'
                    ? 'text-emerald-900'
                    : 'text-gray-700'
              }`}
            >
              {id}. {name}
            </h4>
            <p
              className={`text-xs mt-1 transition-colors ${
                status === 'running'
                  ? 'text-blue-700 font-medium'
                  : status === 'completed'
                    ? 'text-emerald-700'
                    : 'text-gray-600'
              }`}
            >
              {message}
            </p>
          </div>

          {/* Expand Icon */}
          {details && details.length > 0 && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          )}
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && details && details.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <ul className="space-y-2">
                {details.map((detail, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
