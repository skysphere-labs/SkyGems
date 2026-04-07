import { useState } from "react";
import { CheckCircle2, Grid2X2, ImageIcon, List, X } from "lucide-react";

import { ImageWithFallback } from "@skygems/ui";

import type { Design } from "../../contracts/types";

const JEWELRY_IMAGES = [
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
  "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&q=80",
  "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
  "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80",
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
  "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=600&q=80",
  "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
];

interface CanvasGalleryProps {
  designs: Design[];
  selectedDesignId: string | null;
  onDesignClick: (design: Design) => void;
  isGenerating: boolean;
}

export function CanvasGallery({
  designs,
  selectedDesignId,
  onDesignClick,
  isGenerating,
}: CanvasGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const selectedDesign = designs.find((d) => d.id === selectedDesignId) ?? null;

  if (designs.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div
          className="flex size-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <ImageIcon className="size-8" style={{ color: "var(--text-muted)" }} />
        </div>
        <div className="text-center">
          <p
            className="text-lg font-medium"
            style={{ color: "var(--text-primary)", fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            No designs yet
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Configure and generate from the Create tab
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Hero pair viewer — shown when a design is selected */}
      {selectedDesign && (
        <HeroPairViewer
          design={selectedDesign}
          onDismiss={() => onDesignClick(selectedDesign)}
        />
      )}

      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-center gap-3">
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Creations
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
            }}
          >
            {designs.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className="rounded-md p-1.5 transition-colors"
            style={{
              color:
                viewMode === "grid"
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              backgroundColor:
                viewMode === "grid"
                  ? "var(--bg-tertiary)"
                  : "transparent",
            }}
            title="Grid view"
          >
            <Grid2X2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className="rounded-md p-1.5 transition-colors"
            style={{
              color:
                viewMode === "list"
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              backgroundColor:
                viewMode === "list"
                  ? "var(--bg-tertiary)"
                  : "transparent",
            }}
            title="List view"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Gallery grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {/* Skeleton card when generating */}
          {isGenerating && <SkeletonCard />}

          {designs.map((design, index) => (
            <DesignCard
              key={design.id}
              design={design}
              imageUrl={JEWELRY_IMAGES[index % JEWELRY_IMAGES.length]}
              isSelected={design.id === selectedDesignId}
              onClick={() => onDesignClick(design)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Hero Pair Viewer ─────────────────────────────────────────────────── */

function HeroPairViewer({
  design,
  onDismiss,
}: {
  design: Design;
  onDismiss: () => void;
}) {
  const sketchUrl = design.sketch.url || JEWELRY_IMAGES[0];
  const renderUrl = design.render.url || JEWELRY_IMAGES[1];

  return (
    <div
      className="relative shrink-0 border-b"
      style={{
        borderColor: "var(--border-default)",
        background: "linear-gradient(180deg, rgba(212,175,55,0.03) 0%, var(--bg-primary) 100%)",
      }}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-4 top-4 z-10 rounded-full p-1.5 transition-colors"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-muted)",
        }}
        title="Close hero view"
      >
        <X className="size-4" />
      </button>

      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* Design label */}
        <div className="mb-4 text-center">
          <p className="eyebrow mb-1">Selected Design</p>
          <h2
            className="text-xl font-semibold"
            style={{
              color: "var(--text-primary)",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {design.displayName}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {design.promptSummary}
          </p>
        </div>

        {/* Sketch + Render pair */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="group overflow-hidden rounded-xl border transition-all"
            style={{
              borderColor: "rgba(212,175,55,0.15)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            }}
          >
            <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <ImageWithFallback
                src={sketchUrl}
                alt={`${design.displayName} sketch`}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div
              className="flex items-center justify-center py-2"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--accent-gold)" }}>
                Sketch
              </span>
            </div>
          </div>

          <div
            className="group overflow-hidden rounded-xl border transition-all"
            style={{
              borderColor: "rgba(212,175,55,0.15)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            }}
          >
            <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <ImageWithFallback
                src={renderUrl}
                alt={`${design.displayName} render`}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div
              className="flex items-center justify-center py-2"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--accent-gold)" }}>
                Render
              </span>
            </div>
          </div>
        </div>

        {/* Design DNA chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {[
            design.designDna.jewelryType,
            design.designDna.metal,
            design.designDna.style,
            ...design.designDna.gemstones,
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "rgba(212,175,55,0.08)",
                color: "var(--accent-gold)",
                border: "1px solid rgba(212,175,55,0.15)",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Card ────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--border-default)" }}
    >
      <div
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        <div
          className="skeleton-shimmer absolute inset-0"
        />
      </div>
      <div className="space-y-2 p-3" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div
          className="h-4 w-3/4 animate-pulse rounded"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        />
        <div
          className="h-3 w-1/2 animate-pulse rounded"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        />
      </div>
    </div>
  );
}

/* ── Design Card ──────────────────────────────────────────────────────── */

function DesignCard({
  design,
  imageUrl,
  isSelected,
  onClick,
}: {
  design: Design;
  imageUrl: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl text-left transition-all"
      style={{
        border: isSelected
          ? "2px solid var(--accent-gold)"
          : "1px solid var(--border-default)",
        boxShadow: isSelected
          ? "0 0 16px rgba(212,175,55,0.15)"
          : "none",
      }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={design.displayName}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
          }}
        >
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Click to view
          </span>
        </div>

        {/* Selected badge */}
        {design.selectionState === "selected" && (
          <div
            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--accent-gold)" }}
          >
            <CheckCircle2 className="size-4 text-black" />
          </div>
        )}
      </div>

      {/* Card footer */}
      <div
        className="space-y-1 p-3"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <p
          className="truncate text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {design.displayName}
        </p>
        <p
          className="truncate text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {design.designDna.jewelryType} &middot; {design.designDna.metal} &middot;{" "}
          {design.designDna.style}
        </p>
      </div>
    </button>
  );
}
