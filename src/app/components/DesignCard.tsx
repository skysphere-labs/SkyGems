import { ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DesignCardProps {
  id: number;
  name: string;
  image: string;
  metal: string;
  gemstones?: ReactNode;
  favorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  actions?: ReactNode;
  className?: string;
}

export function DesignCard({
  id,
  name,
  image,
  metal,
  gemstones,
  favorite = false,
  onToggleFavorite,
  actions,
  className = '',
}: DesignCardProps) {
  return (
    <div className={`group relative bg-card rounded-2xl border border-border overflow-hidden hover:border-[#C9A227] hover:shadow-xl transition-all ${className}`}>
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted relative">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Hover Overlay with Actions */}
        {actions && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            {actions}
          </div>
        )}
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(id)}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg"
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-[#C9A227] transition-colors">
          {name}
        </h3>
        
        {gemstones && (
          <div className="mb-3">
            {gemstones}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] text-xs rounded-full font-medium">
            {metal}
          </span>
          <Link
            to={`/app/preview/${id}`}
            className="text-sm font-medium text-[#C9A227] hover:underline"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
