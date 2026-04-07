import { GEMSTONE_OPTIONS } from "../../contracts/constants";
import type { Gemstone } from "../../contracts/types";

export function GemstonePicker({
  value,
  onChange,
}: {
  value: Gemstone[];
  onChange: (gemstones: Gemstone[]) => void;
}) {
  const toggleGemstone = (gemstone: Gemstone) => {
    onChange(
      value.includes(gemstone)
        ? value.filter((item) => item !== gemstone)
        : [...value, gemstone],
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">Gemstones</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Multiple gemstones are supported, but plain metal is valid too.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GEMSTONE_OPTIONS.map((gemstone) => {
          const active = value.includes(gemstone.id);
          return (
            <button
              key={gemstone.id}
              type="button"
              onClick={() => toggleGemstone(gemstone.id)}
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {gemstone.label}
                </p>
                <span
                  className="inline-flex size-6 items-center justify-center rounded-full border text-xs"
                  style={{
                    borderColor: active
                      ? "rgba(212,175,55,0.32)"
                      : "rgba(255,255,255,0.08)",
                    backgroundColor: active
                      ? "rgba(212,175,55,0.18)"
                      : "transparent",
                    color: active
                      ? "var(--accent-gold)"
                      : "var(--text-muted)",
                  }}
                >
                  {active ? "•" : "+"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
