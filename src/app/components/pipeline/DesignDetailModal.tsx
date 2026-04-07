import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  FileImage,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DesignResult {
  id: string;
  title: string;
  imageUrl: string;
  score?: any;
}

interface DesignDetailModalProps {
  designs: DesignResult[];
  initialIndex: number;
  promptText?: string;
  likedIds: Set<string>;
  onLike: (id: string) => void;
  onClose: () => void;
  onRefine?: (designId: string, refinementPrompt: string) => void;
}

export const DesignDetailModal: React.FC<DesignDetailModalProps> = ({
  designs,
  initialIndex,
  promptText = '',
  likedIds,
  onLike,
  onClose,
  onRefine,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [refinementInput, setRefinementInput] = useState('');
  const [svgGenerating, setSvgGenerating] = useState(false);

  const current = designs[currentIndex];
  const isLiked = current ? likedIds.has(current.id) : false;
  const isPromptLong = promptText.length > 200;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev > 0 ? prev - 1 : designs.length - 1));
      else if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev < designs.length - 1 ? prev + 1 : 0));
    },
    [onClose, designs.length]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goLeft = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : designs.length - 1));
  const goRight = () => setCurrentIndex((prev) => (prev < designs.length - 1 ? prev + 1 : 0));

  const handleRefineSend = () => {
    if (refinementInput.trim() && current) {
      onRefine?.(current.id, refinementInput.trim());
      setRefinementInput('');
    }
  };

  const handleGenerateSvg = async () => {
    if (!current) return;
    setSvgGenerating(true);
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = current.imageUrl;
      a.download = `${current.title || 'design'}-vector.svg`;
      a.click();
      setSvgGenerating(false);
    }, 1000);
  };

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-8"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl border border-border flex overflow-hidden w-full"
          style={{ maxWidth: 960, maxHeight: 'calc(100vh - 80px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left — Image + Nav + Input */}
          <div className="flex-1 flex flex-col min-w-0 bg-input-background">
            {/* Image area */}
            <div className="flex-1 min-h-0 flex items-center justify-center relative p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-md flex items-center justify-center bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Left arrow */}
              {designs.length > 1 && (
                <button
                  onClick={goLeft}
                  className="absolute left-3 w-9 h-9 rounded-md flex items-center justify-center bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Image */}
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                <img
                  src={current.imageUrl}
                  alt={current.title || 'Design'}
                  className="max-w-full max-h-[calc(100vh-260px)] object-contain rounded-lg"
                />
              </motion.div>

              {/* Right arrow */}
              {designs.length > 1 && (
                <button
                  onClick={goRight}
                  className="absolute right-3 w-9 h-9 rounded-md flex items-center justify-center bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10 shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Counter */}
              {designs.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-white border border-border text-muted-foreground shadow-sm">
                  {currentIndex + 1} / {designs.length}
                </div>
              )}
            </div>

            {/* Refinement input */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500 transition-all">
                <input
                  type="text"
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.stopPropagation(); handleRefineSend(); }
                    if (e.key === 'Escape') e.stopPropagation();
                  }}
                  placeholder="What would you like to change?"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleRefineSend}
                  disabled={!refinementInput.trim()}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all disabled:opacity-30 text-white"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] mt-1 text-center text-muted-foreground">
                Requesting one change at a time will get better results
              </p>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-[260px] flex-shrink-0 border-l border-border bg-white overflow-y-auto p-4 space-y-4">
            {/* Title */}
            <div>
              <h2 className="text-sm font-semibold text-foreground">{current.title}</h2>
              {current.score && (
                <p className="text-xs mt-0.5 text-muted-foreground">
                  Score: {Math.round(current.score.totalScore)}/100
                </p>
              )}
            </div>

            {/* Prompt Details */}
            <div>
              <label className="text-xs font-medium text-foreground">Prompt Details</label>
              <div className="mt-1.5 rounded-md p-2.5 text-xs leading-relaxed bg-input-background text-foreground border border-border">
                {isPromptLong && !showFullPrompt
                  ? promptText.substring(0, 200) + '...'
                  : promptText || 'No prompt available'}
              </div>
              {isPromptLong && (
                <button
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                  className="flex items-center gap-1 mt-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  {showFullPrompt ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Show more <ChevronDown className="w-3 h-3" /></>}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleGenerateSvg}
                disabled={svgGenerating}
                className="w-full py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 border border-border bg-white text-foreground hover:bg-accent disabled:opacity-50"
              >
                <FileImage className="w-3.5 h-3.5" />
                {svgGenerating ? 'Generating...' : 'Generate SVG File'}
              </button>
              <button
                onClick={() => onLike(current.id)}
                className={`w-full py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  isLiked ? 'bg-red-50 text-red-600 border border-red-200' : 'text-white'
                }`}
                style={isLiked ? {} : { background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>

            {/* Score breakdown */}
            {current.score && (
              <div>
                <label className="text-xs font-medium text-foreground">Design Score</label>
                <div className="mt-1.5 space-y-2">
                  {Object.entries(current.score.scores || {}).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] capitalize text-muted-foreground">{key}</span>
                        <span className="text-[11px] font-medium text-foreground">{Math.round(value as number)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${value}%`,
                            background: (value as number) >= 80
                              ? '#22c55e'
                              : 'linear-gradient(to right, #7c3aed, #2563eb)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard shortcuts */}
            <div className="pt-3 border-t border-border">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Shortcuts</label>
              <div className="mt-1.5 space-y-1 text-[10px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Previous / Next</span>
                  <span className="text-foreground font-medium">← →</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Close</span>
                  <span className="text-foreground font-medium">Esc</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
