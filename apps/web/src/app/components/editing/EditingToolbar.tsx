import {
  ArrowUpCircle,
  Combine,
  Crown,
  Eraser,
  Gem,
  Image,
  Layers,
  Link,
  Maximize2,
  Minus,
  Repeat,
  RotateCcw,
  Shrink,
  Sun,
  Type,
  ZoomIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { editingToolPresets, type EditingToolPreset } from "./presets";

const iconMap: Record<string, LucideIcon> = {
  Repeat,
  Gem,
  RotateCcw,
  Image,
  Maximize2,
  Type,
  Eraser,
  Link,
  Combine,
  ZoomIn,
  Sun,
  Layers,
  Minus,
  Crown,
  Shrink,
  ArrowUpCircle,
};

interface EditingToolbarProps {
  onSelectPreset: (preset: EditingToolPreset) => void;
}

export function EditingToolbar({ onSelectPreset }: EditingToolbarProps) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">Editing Tools</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {editingToolPresets.map((preset) => {
          const Icon = iconMap[preset.icon];
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              title={preset.description}
              className="group flex items-center gap-2.5 rounded-xl border border-white/6 bg-[var(--bg-tertiary)] px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] transition-all hover:border-[rgba(212,175,55,0.28)] hover:bg-[rgba(212,175,55,0.06)] hover:text-[var(--accent-gold)]"
            >
              {Icon ? (
                <Icon className="size-4 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--accent-gold)]" />
              ) : null}
              <span className="truncate">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
