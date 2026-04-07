import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ icon: Icon, value, label, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#d4b547] flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-3xl font-semibold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
