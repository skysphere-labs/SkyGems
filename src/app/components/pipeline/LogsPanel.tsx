import React from 'react';
import { ChevronDown, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogsPanelProps {
  logs: string[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, isOpen = false, onToggle }) => {
  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Processing Logs</span>
          <span className="text-xs text-gray-500">({logs.length})</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      {/* Logs Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 bg-gray-900 text-gray-300 text-xs font-mono p-4 max-h-48 overflow-y-auto space-y-1"
          >
            {logs.length === 0 ? (
              <div className="text-gray-600">No logs yet...</div>
            ) : (
              logs.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-2"
                >
                  <span className="text-gray-600 flex-shrink-0">{'>'}</span>
                  <span>{log}</span>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
