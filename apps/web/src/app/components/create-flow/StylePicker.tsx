import { STYLE_OPTIONS } from "../../contracts/constants";
import type { DesignStyle } from "../../contracts/types";

export function StylePicker({
  value,
  onChange,
}: {
  value: DesignStyle;
  onChange: (style: DesignStyle) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">Style</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Rebuilt from the old create-flow vocabulary, without route drift.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {STYLE_OPTIONS.map((style) => {
          const Icon = style.icon;
          const active = value === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className="rounded-2xl border px-3 py-3 text-left transition-all"
              style={{
                borderColor: active
                  ? "rgba(212,175,55,0.28)"
                  : "rgba(255,255,255,0.06)",
                backgroundColor: active
                  ? "rgba(212,175,55,0.08)"
                  : "var(--bg-tertiary)",
              }}
            >
              <div className="flex items-center gap-3">
                <Icon className="size-4 text-[var(--accent-gold)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {style.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
