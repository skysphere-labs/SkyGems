import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  Pen,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, ImageWithFallback } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design, StageStatus } from "../contracts/types";
import { RefineDrawer } from "../components/RefineDrawer";
import { appRoutes } from "../lib/routes";

const STAGE_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText; description: string }
> = {
  spec: {
    label: "Specification",
    icon: FileText,
    description:
      "Dimensions, materials, and gemstone parameters for this design.",
  },
  technicalSheet: {
    label: "Technical Sheet",
    icon: Layers,
    description: "Production-ready manufacturing specifications.",
  },
  svg: {
    label: "SVG Export",
    icon: Pen,
    description: "Scalable vector views with annotations.",
  },
  cad: {
    label: "CAD Files",
    icon: Download,
    description: "Manufacturing-ready 3D/2D files (STEP, STL, DXF).",
  },
};

function stageStatusStyle(status: StageStatus) {
  switch (status) {
    case "ready":
    case "succeeded":
      return {
        dot: "var(--status-success)",
        label: "Ready",
        bg: "rgba(76,175,80,0.1)",
      };
    case "processing":
    case "running":
      return {
        dot: "var(--status-info)",
        label: "Processing",
        bg: "rgba(100,181,246,0.1)",
      };
    case "queued":
      return {
        dot: "var(--status-info)",
        label: "Queued",
        bg: "rgba(100,181,246,0.08)",
      };
    case "failed":
      return {
        dot: "var(--status-error)",
        label: "Failed",
        bg: "rgba(239,83,80,0.1)",
      };
    case "stale":
      return {
        dot: "var(--accent-gold)",
        label: "Stale",
        bg: "rgba(212,175,55,0.1)",
      };
    default:
      return {
        dot: "var(--text-muted)",
        label: "Not started",
        bg: "rgba(255,255,255,0.03)",
      };
  }
}

function PipelineStage({
  stageKey,
  status,
  summary,
  href,
  index,
  isLast,
}: {
  stageKey: string;
  status: StageStatus;
  summary: string;
  href: string;
  index: number;
  isLast: boolean;
}) {
  const config = STAGE_CONFIG[stageKey];
  const style = stageStatusStyle(status);
  const Icon = config.icon;
  const isReady = status === "ready" || status === "succeeded";
  const isProcessing = status === "processing" || status === "running";

  return (
    <div className="relative flex gap-4">
      {/* Vertical connector */}
      <div className="flex flex-col items-center">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: isReady
              ? "rgba(212,175,55,0.15)"
              : "rgba(255,255,255,0.04)",
            border: isReady ? "1px solid rgba(212,175,55,0.3)" : "1px solid var(--border-default)",
          }}
        >
          {isReady ? (
            <CheckCircle2
              className="size-5"
              style={{ color: "var(--accent-gold)" }}
            />
          ) : isProcessing ? (
            <div className="size-5 animate-spin rounded-full border-2 border-[var(--status-info)] border-t-transparent" />
          ) : (
            <Icon className="size-5 text-[var(--text-muted)]" />
          )}
        </div>
        {!isLast && (
          <div
            className="mt-1 w-px flex-1"
            style={{
              backgroundColor: isReady
                ? "rgba(212,175,55,0.2)"
                : "var(--border-default)",
              minHeight: 24,
            }}
          />
        )}
      </div>

      {/* Stage content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {config.label}
          </h3>
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: style.bg, color: style.dot }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{
                backgroundColor: style.dot,
                animation: isProcessing
                  ? "pulse-status 1.5s ease-in-out infinite"
                  : "none",
              }}
            />
            {style.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{summary}</p>
        <div className="mt-3">
          <Button
            asChild
            variant={isReady ? "default" : "outline"}
            className={
              isReady
                ? ""
                : "border-[var(--border-default)]"
            }
            style={
              isReady
                ? {
                    background: "var(--accent-gold)",
                    color: "var(--text-inverse)",
                  }
                : {}
            }
          >
            <Link to={href}>
              {isReady ? "View" : "Open"}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SelectedDesignScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);

  useEffect(() => {
    if (!designId) return;
    fetchDesign(designId).then(setDesign);
  }, [designId]);

  if (!design || !projectId) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Loading your design...
        </p>
      </div>
    );
  }

  const stages = [
    {
      key: "spec",
      status: design.stages.spec.status,
      summary: design.stages.spec.summary,
      href: appRoutes.spec(projectId, design.id),
    },
    {
      key: "technicalSheet",
      status: design.stages.technicalSheet.status,
      summary: design.stages.technicalSheet.summary,
      href: appRoutes.technicalSheet(projectId, design.id),
    },
    {
      key: "svg",
      status: design.stages.svg.status,
      summary: design.stages.svg.summary,
      href: appRoutes.svg(projectId, design.id),
    },
    {
      key: "cad",
      status: design.stages.cad.status,
      summary: design.stages.cad.summary,
      href: appRoutes.cad(projectId, design.id),
    },
  ];

  return (
    <div className="animate-entrance space-y-10">
      {/* Hero Pair Viewer — the emotional center */}
      <div className="-mx-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="group overflow-hidden rounded-2xl"
            style={{
              border: "1px solid rgba(212,175,55,0.12)",
              boxShadow: "0 0 40px rgba(212,175,55,0.04)",
            }}
          >
            <div className="overflow-hidden">
              <ImageWithFallback
                src={design.sketch.url}
                alt={design.sketch.alt}
                className="aspect-[4/3] w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderTop: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <p className="eyebrow">Sketch</p>
              <p className="text-xs text-[var(--text-muted)]">
                Form and construction
              </p>
            </div>
          </div>
          <div
            className="group overflow-hidden rounded-2xl"
            style={{
              border: "1px solid rgba(212,175,55,0.12)",
              boxShadow: "0 0 40px rgba(212,175,55,0.04)",
            }}
          >
            <div className="overflow-hidden">
              <ImageWithFallback
                src={design.render.url}
                alt={design.render.alt}
                className="aspect-[4/3] w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderTop: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <p className="eyebrow">Render</p>
              <p className="text-xs text-[var(--text-muted)]">
                Material and finish
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Design info + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {design.displayName}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {design.promptSummary}
          </p>
          {design.selectedAt && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Selected {design.selectedAt}
            </p>
          )}
        </div>
        <RefineDrawer design={design} />
      </div>

      {/* Design DNA tags */}
      <div className="flex flex-wrap gap-2">
        {[
          design.designDna.jewelryType,
          design.designDna.metal,
          design.designDna.style,
          ...design.designDna.gemstones,
        ].map((tag) => (
          <span
            key={tag}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.12)",
              color: "var(--text-primary)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Production Pipeline — vertical connected rail */}
      <div>
        <p className="eyebrow mb-6">Production Pipeline</p>
        <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          {stages.map((stage, i) => (
            <PipelineStage
              key={stage.key}
              stageKey={stage.key}
              status={stage.status}
              summary={stage.summary}
              href={stage.href}
              index={i}
              isLast={i === stages.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Lineage */}
      {design.lineageNotes.length > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <p className="eyebrow mb-3">Design History</p>
          <div className="space-y-1.5">
            {design.lineageNotes.map((note) => (
              <p key={note} className="text-sm text-[var(--text-secondary)]">
                {note}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
