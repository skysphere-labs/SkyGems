import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  const baseStyles = 'rounded-lg transition-all duration-150';
  const surfaceStyles = 'bg-[var(--bg-tertiary)] border border-[rgba(255,255,255,0.06)]';
  const hoverStyles = hover
    ? 'hover:border-[rgba(255,255,255,0.15)] hover:scale-[1.02] cursor-pointer'
    : '';

  return (
    <div className={`${baseStyles} ${surfaceStyles} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}
