interface ProgressBarProps {
  label: string;
  value: number;
  color?: 'gold' | 'green' | 'blue' | 'red';
  showPercentage?: boolean;
  className?: string;
}

const colorClasses = {
  gold: {
    text: 'text-[#C9A227]',
    gradient: 'from-[#C9A227] to-[#d4b547]',
  },
  green: {
    text: 'text-green-600',
    gradient: 'from-green-500 to-green-600',
  },
  blue: {
    text: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
  },
  red: {
    text: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
  },
};

export function ProgressBar({ 
  label, 
  value, 
  color = 'gold', 
  showPercentage = true,
  className = '' 
}: ProgressBarProps) {
  const colors = colorClasses[color];
  
  return (
    <div className={className}>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {showPercentage && (
          <span className={`text-sm font-semibold ${colors.text}`}>{value}%</span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        ></div>
      </div>
    </div>
  );
}
