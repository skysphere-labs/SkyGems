import { AlertCircle, CheckCircle2, Clock3, RefreshCw, Sparkle } from "lucide-react";

import { Badge } from "@skygems/ui";

import type { StageStatus } from "../../contracts/types";

const STATUS_STYLES: Record<
  StageStatus,
  { label: string; icon: typeof Clock3; background: string; color: string }
> = {
  absent: {
    label: "Absent",
    icon: Clock3,
    background: "rgba(255,255,255,0.06)",
    color: "var(--text-secondary)",
  },
  not_requested: {
    label: "Not Requested",
    icon: Clock3,
    background: "rgba(255,255,255,0.06)",
    color: "var(--text-secondary)",
  },
  queued: {
    label: "Queued",
    icon: Clock3,
    background: "rgba(100,181,246,0.14)",
    color: "var(--status-info)",
  },
  processing: {
    label: "Processing",
    icon: RefreshCw,
    background: "rgba(255,152,0,0.14)",
    color: "var(--status-warning)",
  },
  running: {
    label: "Running",
    icon: RefreshCw,
    background: "rgba(255,152,0,0.14)",
    color: "var(--status-warning)",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    background: "rgba(76,175,80,0.14)",
    color: "var(--status-success)",
  },
  succeeded: {
    label: "Succeeded",
    icon: CheckCircle2,
    background: "rgba(76,175,80,0.14)",
    color: "var(--status-success)",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    background: "rgba(239,83,80,0.14)",
    color: "var(--status-error)",
  },
  skipped: {
    label: "Skipped",
    icon: Clock3,
    background: "rgba(255,255,255,0.06)",
    color: "var(--text-secondary)",
  },
  stale: {
    label: "Stale",
    icon: Sparkle,
    background: "rgba(212,175,55,0.14)",
    color: "var(--accent-gold)",
  },
};

export function StageStatusPill({
  status,
  label,
}: {
  status: StageStatus;
  label?: string;
}) {
  const config = STATUS_STYLES[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-full border-transparent px-2.5 py-1 text-[11px]"
      style={{ backgroundColor: config.background, color: config.color }}
    >
      <Icon className="size-3" />
      {label ?? config.label}
    </Badge>
  );
}
