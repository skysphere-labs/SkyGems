import { AlertCircle, ArrowRight, Layers2, Sparkles } from "lucide-react";
import { Link } from "react-router";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  ImageWithFallback,
  Skeleton,
} from "@skygems/ui";

import type { PairCandidate } from "../../contracts/types";
import { StageStatusPill } from "./StageStatusPill";

function PairMediaSlot({
  label,
  url,
  status,
}: {
  label: string;
  url?: string;
  status: PairCandidate["status"];
}) {
  if (status === "failed") {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-dashed border-[rgba(239,83,80,0.24)] bg-[rgba(239,83,80,0.08)] p-6 text-center">
        <div>
          <AlertCircle className="mx-auto size-6 text-[var(--status-error)]" />
          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
            Asset failed
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Retry once backend generation wiring lands.
          </p>
        </div>
      </div>
    );
  }

  if (!url) {
    return <Skeleton className="aspect-[4/5] rounded-2xl" />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/6 bg-[var(--bg-primary)]">
      <ImageWithFallback
        src={url}
        alt={label}
        className="aspect-[4/5] h-full w-full object-cover"
      />
    </div>
  );
}

export function PairCardV1({
  pair,
  pairIndex,
  isSelected = false,
  selectHref,
  openHref,
}: {
  pair: PairCandidate;
  pairIndex: number;
  isSelected?: boolean;
  selectHref?: string;
  openHref?: string;
}) {
  return (
    <Card
      className="overflow-hidden border-white/6 bg-[var(--bg-secondary)] shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
      style={{
        boxShadow: isSelected ? "0 0 0 1px rgba(212,175,55,0.4)" : undefined,
      }}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Pair {String(pairIndex + 1).padStart(2, "0")}</p>
            <CardTitle className="mt-2 text-base text-[var(--text-primary)]">
              {pair.designDna.jewelryType} / {pair.designDna.style}
            </CardTitle>
          </div>
          <StageStatusPill
            status={
              pair.status === "ready"
                ? "ready"
                : pair.status === "partial"
                  ? "processing"
                  : pair.status === "failed"
                    ? "failed"
                    : "queued"
            }
            label={isSelected ? "selected" : pair.status}
          />
        </div>
        <Badge
          variant="outline"
          className="rounded-full border-white/6 bg-[rgba(255,255,255,0.02)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]"
        >
          {pair.designDna.fingerprintSha256}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Sketch
            </p>
            <PairMediaSlot
              label={`${pair.pairLabel} sketch`}
              url={pair.sketchArtifactUrl}
              status={pair.status}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Render
            </p>
            <PairMediaSlot
              label={`${pair.pairLabel} render`}
              url={pair.renderArtifactUrl}
              status={pair.status}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-white/6 bg-transparent text-[var(--text-secondary)]">
            {pair.designDna.metal}
          </Badge>
          {pair.designDna.gemstones.map((gem) => (
            <Badge
              key={gem}
              variant="outline"
              className="rounded-full border-white/6 bg-transparent text-[var(--text-secondary)]"
            >
              {gem}
            </Badge>
          ))}
          <Badge variant="outline" className="rounded-full border-white/6 bg-transparent text-[var(--text-secondary)]">
            {pair.designDna.style}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        {pair.status === "ready" && selectHref ? (
          <Button asChild={!isSelected} disabled={isSelected}>
            {isSelected ? (
              <span>
                <Sparkles className="size-4" />
                Selected Pair
              </span>
            ) : (
              <Link to={selectHref}>
                <Sparkles className="size-4" />
                Select Pair
              </Link>
            )}
          </Button>
        ) : pair.status === "failed" ? (
          <Button variant="outline" disabled>
            <AlertCircle className="size-4" />
            Needs retry
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <Layers2 className="size-4" />
            Waiting for both assets
          </Button>
        )}

        {openHref ? (
          <Button asChild variant="ghost">
            <Link to={openHref}>
              Open
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" disabled>
            Open when ready
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
