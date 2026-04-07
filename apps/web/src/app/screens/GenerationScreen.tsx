import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { Button, ImageWithFallback } from "@skygems/ui";

import { fetchGeneration, postSelectDesign } from "../contracts/api";
import type { Generation } from "../contracts/types";
import { appRoutes } from "../lib/routes";

function PairUnveil({
  pair,
  projectId,
}: {
  pair: Generation["pairs"][0];
  projectId: string;
}) {
  const navigate = useNavigate();
  const [isSelecting, setIsSelecting] = useState(false);

  async function handleSelect() {
    setIsSelecting(true);
    try {
      await postSelectDesign(pair.designId);
      navigate(appRoutes.design(projectId, pair.designId));
    } catch {
      navigate(appRoutes.design(projectId, pair.designId));
    } finally {
      setIsSelecting(false);
    }
  }

  return (
    <div className="animate-unveil space-y-8">
      {/* Dramatic pair display */}
      <div className="mx-auto grid max-w-[960px] gap-6 sm:grid-cols-2">
        <div
          className="group overflow-hidden rounded-2xl"
          style={{
            border: "1px solid rgba(212,175,55,0.12)",
            boxShadow: "0 0 40px rgba(212,175,55,0.04)",
          }}
        >
          <div className="overflow-hidden">
            <ImageWithFallback
              src={pair.sketchArtifactUrl}
              alt={`${pair.pairLabel} sketch`}
              className="aspect-[4/3] w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
            />
          </div>
          <div
            className="px-4 py-3"
            style={{
              borderTop: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <p className="eyebrow">Sketch</p>
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
              src={pair.renderArtifactUrl}
              alt={`${pair.pairLabel} render`}
              className="aspect-[4/3] w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
            />
          </div>
          <div
            className="px-4 py-3"
            style={{
              borderTop: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <p className="eyebrow">Render</p>
          </div>
        </div>
      </div>

      {/* Select CTA */}
      {pair.status === "ready" && (
        <div className="mx-auto max-w-[960px] text-center">
          <Button
            onClick={handleSelect}
            disabled={isSelecting}
            className="btn-gold"
            style={{
              height: 48,
              minWidth: 220,
              fontSize: 14,
              borderRadius: 8,
            }}
          >
            <Sparkles className="size-4" />
            {isSelecting ? "Selecting..." : "Select This Design"}
          </Button>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Promote this pair to your workspace
          </p>
        </div>
      )}
    </div>
  );
}

function SkeletonPair() {
  return (
    <div className="mx-auto grid max-w-[960px] gap-6 sm:grid-cols-2">
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
        <div className="skeleton-shimmer aspect-[4/3]" />
        <div className="h-11" style={{ borderTop: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }} />
      </div>
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-default)" }}>
        <div className="skeleton-shimmer aspect-[4/3]" />
        <div className="h-11" style={{ borderTop: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }} />
      </div>
    </div>
  );
}

export function GenerationScreen() {
  const { generationId, projectId } = useParams();
  const [generation, setGeneration] = useState<Generation | null>(null);

  useEffect(() => {
    if (!generationId) return;

    let cancelled = false;
    let intervalId: number | undefined;

    const load = async () => {
      const next = await fetchGeneration(generationId);
      if (!cancelled) setGeneration(next);
    };

    void load();

    if (
      !generation ||
      ["queued", "processing", "running"].includes(generation.status)
    ) {
      intervalId = window.setInterval(() => void load(), 3500);
    }

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [generation?.status, generationId]);

  if (!projectId || !generation) {
    return (
      <div className="space-y-8">
        <div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your Designs
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Preparing your results...
          </p>
        </div>
        <SkeletonPair />
      </div>
    );
  }

  const isPolling = ["queued", "processing", "running"].includes(
    generation.status,
  );
  const isComplete = ["completed", "succeeded"].includes(generation.status);
  const hasPairs = generation.pairs.length > 0;

  return (
    <div className="animate-entrance space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your Designs
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {isPolling
              ? "Designing your piece..."
              : isComplete && hasPairs
                ? "Your design pair is ready. Select your favorite to continue."
                : generation.message}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="border-[var(--border-default)]"
          >
            <Link to={appRoutes.create(projectId)}>
              <ArrowLeft className="size-4" />
              Edit Config
            </Link>
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {isPolling && (
        <div
          className="mx-auto flex max-w-[960px] items-center justify-center gap-3 rounded-xl py-5"
          style={{ backgroundColor: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.08)" }}
        >
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
          <span className="text-sm font-medium text-[var(--accent-gold-light)]">
            {generation.status === "queued"
              ? "Queued for generation..."
              : "Crafting your design pair..."}
          </span>
        </div>
      )}

      {/* Pair display or skeleton */}
      {hasPairs ? (
        generation.pairs.map((pair, i) => (
          <PairUnveil
            key={`${pair.designId}-${i}`}
            pair={pair}
            projectId={projectId}
          />
        ))
      ) : isPolling ? (
        <SkeletonPair />
      ) : (
        <div className="py-16 text-center">
          <Sparkles
            className="mx-auto size-10 text-[var(--accent-gold)]"
            style={{ opacity: 0.5 }}
          />
          <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
            Waiting for results
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Your design is being created. This page will update automatically.
          </p>
        </div>
      )}

      {/* Completed status */}
      {isComplete && hasPairs && (
        <div
          className="mx-auto max-w-[960px] rounded-xl p-4 text-center text-sm font-medium"
          style={{
            backgroundColor: "rgba(76,175,80,0.06)",
            color: "var(--status-success)",
            border: "1px solid rgba(76,175,80,0.12)",
          }}
        >
          Generation complete
        </div>
      )}
    </div>
  );
}
