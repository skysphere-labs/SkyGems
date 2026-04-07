import { METAL_OPTIONS } from "../../contracts/constants";
import type { Metal } from "../../contracts/types";

export function MetalPicker({
  value,
  onChange,
}: {
  value: Metal;
  onChange: (metal: Metal) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">Metal</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Carry forward the old visual metal tiles, but scoped to project create.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {METAL_OPTIONS.map((metal) => {
          const active = value === metal.id;

          return (
            <button
              key={metal.id}
              type="button"
              onClick={() => onChange(metal.id)}
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
                  className="size-8 rounded-full border border-white/10"
                  style={{ background: metal.swatch }}
                />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {metal.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
