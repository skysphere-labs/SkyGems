export function ComplexityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (complexity: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">Complexity</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Backend-aligned 0 to 100 range.
        </p>
      </div>
      <div className="rounded-2xl border border-white/6 bg-[var(--bg-tertiary)] p-4">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[var(--accent-gold)]"
        />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Understated</span>
          <span className="font-semibold text-[var(--accent-gold)]">{value}</span>
          <span className="text-[var(--text-secondary)]">Elaborate</span>
        </div>
      </div>
    </div>
  );
}
