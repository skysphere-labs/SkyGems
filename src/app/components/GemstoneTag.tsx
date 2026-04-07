interface GemstoneTagProps {
  type: 'diamond' | 'ruby' | 'emerald' | 'sapphire' | 'pearl';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gemstoneConfig = {
  diamond: { emoji: '💎', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ruby: { emoji: '🔴', color: 'bg-red-50 text-red-700 border-red-200' },
  emerald: { emoji: '🟢', color: 'bg-green-50 text-green-700 border-green-200' },
  sapphire: { emoji: '🔵', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pearl: { emoji: '⚪', color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function GemstoneTag({ type, size = 'md', className = '' }: GemstoneTagProps) {
  const config = gemstoneConfig[type];
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses[size]} ${className}`}>
      <span>{config.emoji}</span>
      <span className="capitalize">{type}</span>
    </span>
  );
}
