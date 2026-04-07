import {
  ChevronRight,
  FileText,
  Layers,
  Pen,
  Ruler,
  WandSparkles,
} from "lucide-react";

import {
  Button,
  ImageWithFallback,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@skygems/ui";

import type { Design } from "../../contracts/types";
import { StageStatusPill } from "../status/StageStatusPill";

const JEWELRY_IMAGES = [
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
  "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&q=80",
  "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
];

interface DesignDetailDrawerProps {
  design: Design | null;
  open: boolean;
  onClose: () => void;
  onSwitchToTab: (tab: "pipeline" | "export") => void;
}

interface PipelineRow {
  label: string;
  icon: typeof Ruler;
  stageKey: keyof Design["stages"];
}

const PIPELINE_ROWS: PipelineRow[] = [
  { label: "Spec", icon: Ruler, stageKey: "spec" },
  { label: "Technical Sheet", icon: FileText, stageKey: "technicalSheet" },
  { label: "SVG", icon: Pen, stageKey: "svg" },
  { label: "CAD", icon: Layers, stageKey: "cad" },
];

export function DesignDetailDrawer({
  design,
  open,
  onClose,
  onSwitchToTab,
}: DesignDetailDrawerProps) {
  if (!design) return null;

  const dna = design.designDna;

  const dnaChips: { label: string; value: string }[] = [
    { label: "Type", value: dna.jewelryType },
    { label: "Metal", value: dna.metal },
    { label: "Style", value: dna.style },
    {
      label: "Gemstones",
      value: dna.gemstones.length > 0 ? dna.gemstones.join(", ") : "none",
    },
    { label: "Selection", value: design.selectionState },
  ];

  const handlePipelineRowClick = () => {
    onSwitchToTab("pipeline");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[480px] overflow-y-auto !max-w-none border-l p-0"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle
            className="text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            {design.displayName}
          </SheetTitle>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {design.promptSummary}
          </p>
        </SheetHeader>

        <div className="space-y-5 px-6 pb-6">
          {/* Sketch + Render pair */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="group overflow-hidden rounded-lg border"
              style={{ borderColor: "rgba(212,175,55,0.12)" }}
            >
              <div className="overflow-hidden">
                <ImageWithFallback
                  src={JEWELRY_IMAGES[0]}
                  alt={`${design.displayName} sketch`}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <p
                className="py-1.5 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--accent-gold)", backgroundColor: "var(--bg-tertiary)" }}
              >
                Sketch
              </p>
            </div>
            <div
              className="group overflow-hidden rounded-lg border"
              style={{ borderColor: "rgba(212,175,55,0.12)" }}
            >
              <div className="overflow-hidden">
                <ImageWithFallback
                  src={JEWELRY_IMAGES[1]}
                  alt={`${design.displayName} render`}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <p
                className="py-1.5 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--accent-gold)", backgroundColor: "var(--bg-tertiary)" }}
              >
                Render
              </p>
            </div>
          </div>

          {/* Design DNA chips */}
          <div className="flex flex-wrap gap-2">
            {dnaChips.map((chip) => (
              <span
                key={chip.label}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {chip.label}: {chip.value}
              </span>
            ))}
          </div>

          <Separator
            className="opacity-40"
            style={{ backgroundColor: "var(--border-default)" }}
          />

          {/* Production Pipeline */}
          <div>
            <h3
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Production Pipeline
            </h3>
            <div
              className="overflow-hidden rounded-lg"
              style={{ border: "1px solid var(--border-default)" }}
            >
              {PIPELINE_ROWS.map((row, idx) => {
                const stage = design.stages[row.stageKey];
                const Icon = row.icon;
                const isLast = idx === PIPELINE_ROWS.length - 1;

                return (
                  <button
                    key={row.stageKey}
                    type="button"
                    onClick={handlePipelineRowClick}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderBottom: isLast
                        ? "none"
                        : "1px solid var(--border-default)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-tertiary)";
                    }}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {row.label}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <StageStatusPill status={stage.status} />
                      <ChevronRight
                        className="size-4"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary text for each stage */}
            <div className="mt-2 space-y-1">
              {PIPELINE_ROWS.map((row) => {
                const stage = design.stages[row.stageKey];
                if (!stage.summary) return null;
                return (
                  <p
                    key={row.stageKey}
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {row.label}: {stage.summary}
                  </p>
                );
              })}
            </div>
          </div>

          <Separator
            className="opacity-40"
            style={{ backgroundColor: "var(--border-default)" }}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
                backgroundColor: "transparent",
              }}
            >
              <WandSparkles className="size-4" />
              Refine
            </Button>
            <Button
              className="btn-gold flex-1 rounded-lg hover:opacity-90"
              onClick={() => {
                onSwitchToTab("pipeline");
                onClose();
              }}
            >
              Open Pipeline
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
