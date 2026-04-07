import React from 'react';
import { Heart, RotateCcw, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface DesignCardProps {
  id: string;
  imageUrl: string;
  title?: string;
  isLiked?: boolean;
  onClick?: () => void;
  onLike?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export const DesignCard: React.FC<DesignCardProps> = ({
  id,
  imageUrl,
  title,
  isLiked = false,
  onClick,
  onLike,
  onRegenerate,
  onDownload,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="group rounded-lg overflow-hidden border transition-all cursor-pointer"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
    >
      {/* Image Container — no forced aspect ratio, show full image */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <img
          src={imageUrl}
          alt={title || 'Generated Design'}
          className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-200"
        />

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-3 gap-2">
          <button
            onClick={() => onLike?.(id)}
            className="p-2 rounded-md transition-all"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
            title="Like"
          >
            <Heart
              className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
              style={{ color: isLiked ? 'var(--status-error)' : 'var(--text-primary)' }}
            />
          </button>
          <button
            onClick={() => onRegenerate?.(id)}
            className="p-2 rounded-md transition-all"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-gold)' }}
            title="Regenerate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload?.(id)}
            className="p-2 rounded-md transition-all"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--status-success)' }}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
