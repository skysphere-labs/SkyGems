import { JEWELRY_TYPE_OPTIONS } from "../../contracts/constants";
import type { JewelryType } from "../../contracts/types";

export function JewelryTypePicker({
  value,
  onChange,
}: {
  value: JewelryType;
  onChange: (type: JewelryType) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow">Jewelry Type</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Canonical supported types only.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {JEWELRY_TYPE_OPTIONS.map((type) => {
          const Icon = type.icon;
          const active = value === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
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
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {type.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
