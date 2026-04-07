import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { Button, Card, CardContent, Progress } from "@skygems/ui";

import type { Generation } from "../../contracts/types";

const STATUS_CONFIG: Record<
  Generation["status"],
  {
    icon: typeof LoaderCircle;
    title: string;
    tone: string;
    background: string;
  }
> = {
  queued: {
    icon: LoaderCircle,
    title: "Queued for generation",
    tone: "var(--status-info)",
    background: "rgba(100,181,246,0.12)",
  },
  processing: {
    icon: LoaderCircle,
    title: "Pair generation in progress",
    tone: "var(--status-warning)",
    background: "rgba(255,152,0,0.12)",
  },
  running: {
    icon: LoaderCircle,
    title: "Pair generation in progress",
    tone: "var(--status-warning)",
    background: "rgba(255,152,0,0.12)",
  },
  completed: {
    icon: CheckCircle2,
    title: "Generation complete",
    tone: "var(--status-success)",
    background: "rgba(76,175,80,0.12)",
  },
  succeeded: {
    icon: CheckCircle2,
    title: "Generation complete",
    tone: "var(--status-success)",
    background: "rgba(76,175,80,0.12)",
  },
  failed: {
    icon: AlertCircle,
    title: "Generation failed",
    tone: "var(--status-error)",
    background: "rgba(239,83,80,0.12)",
  },
  canceled: {
    icon: AlertCircle,
    title: "Generation canceled",
    tone: "var(--text-secondary)",
    background: "rgba(255,255,255,0.06)",
  },
};

export function GenerationStatusBanner({
  generation,
  onRetry,
}: {
  generation: Generation;
  onRetry?: () => void;
}) {
  const config = STATUS_CONFIG[generation.status];
  const Icon = config.icon;
  const progressValue =
    generation.totalPairs === 0
      ? 0
      : Math.round((generation.readyPairs / generation.totalPairs) * 100);

  return (
    <Card
      className="border-white/6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]"
      style={{ backgroundColor: config.background }}
    >
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "rgba(0,0,0,0.16)", color: config.tone }}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {config.title}
                </h2>
                {generation.source ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.22)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                    {generation.source === "live" ? "Live" : "Fallback"}
                  </span>
                ) : null}
                {generation.reconnecting ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.22)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                    <RefreshCw className="size-3" />
                    Reconnecting
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {generation.message}
              </p>
            </div>
          </div>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Ready pairs</span>
            <span>
              {generation.readyPairs}/{generation.totalPairs}
            </span>
          </div>
          <Progress value={progressValue} />
        </div>
      </CardContent>
    </Card>
  );
}
