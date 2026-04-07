interface MetalBadgeProps {
  metal: string;
  className?: string;
}

export function MetalBadge({ metal, className = '' }: MetalBadgeProps) {
  return (
    <span className={`inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] text-xs rounded-full font-medium ${className}`}>
      {metal}
    </span>
  );
}
