import { RENDER_MODE_OPTIONS } from "../../contracts/constants";
import type { RenderMode } from "../../contracts/types";

export function RenderModePicker({
  value,
  onChange,
}: {
  value: RenderMode;
  onChange: (mode: RenderMode) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">Render Mode</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Choose how the generated pair is presented.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {RENDER_MODE_OPTIONS.map((mode) => {
          const Icon = mode.icon;
          const active = value === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
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
                <div
                  className="flex size-10 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: active
                      ? "rgba(212,175,55,0.18)"
                      : "rgba(255,255,255,0.04)",
                  }}
                >
                  <Icon className="size-5 text-[var(--accent-gold)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {mode.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-4 text-[var(--text-muted)]">
                    {mode.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
