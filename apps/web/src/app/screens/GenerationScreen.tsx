import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { Button, Card, CardContent } from "@skygems/ui";

import { fetchGeneration, postSelectDesign } from "../contracts/api";
import type { Generation } from "../contracts/types";
import { GenerationStatusBanner } from "../components/status/GenerationStatusBanner";
import { PairCardV1 } from "../components/status/PairCardV1";
import { appRoutes } from "../lib/routes";

export function GenerationScreen() {
  const { generationId, projectId } = useParams();
  const navigate = useNavigate();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [selectingDesignId, setSelectingDesignId] = useState<string | null>(null);

  useEffect(() => {
    if (!generationId) {
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;

    const loadGeneration = async () => {
      const nextGeneration = await fetchGeneration(generationId);
      if (!cancelled) {
        setGeneration(nextGeneration);
      }
    };

    void loadGeneration();

    if (!generation || ["queued", "processing", "running"].includes(generation.status)) {
      intervalId = window.setInterval(() => {
        void loadGeneration();
      }, 3500);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [generation?.status, generationId]);

  if (!projectId || !generation) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)] shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
        <CardContent className="py-14 text-center text-[var(--text-secondary)]">
          Loading generation state...
        </CardContent>
      </Card>
    );
  }

  const isPolling = ["queued", "processing", "running"].includes(generation.status);
  const statusCopy =
    generation.source === "live"
      ? "Polling the backend generation status endpoint."
      : "Showing the protected fallback lane while backend data is unavailable.";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[rgba(212,175,55,0.16)] bg-[linear-gradient(135deg,rgba(212,175,55,0.08)_0%,rgba(17,17,17,1)_34%,rgba(10,10,10,1)_100%)]">
        <CardContent className="relative flex flex-wrap items-center justify-between gap-5 py-8">
          <div
            className="absolute -left-12 bottom-0 size-40 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(212,175,55,0.08)" }}
          />
          <div>
            <p className="eyebrow">Generate Pair / Select</p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">
              Generation status
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Review the active generation, watch status changes land, and move the
              best pair forward into the selected-design workspace.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                generation.requestKind === "refine" ? "Refine request" : "Create request",
                generation.source === "live" ? "Live status" : "Fallback status",
                generation.id,
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    borderColor: "rgba(212,175,55,0.18)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    color: "var(--text-primary)",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to={appRoutes.create(projectId)}>
                <ArrowLeft className="size-4" />
                Back to Create
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (generationId) {
                  void fetchGeneration(generationId).then(setGeneration);
                }
              }}
            >
              <RefreshCw className={`size-4 ${isPolling ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <GenerationStatusBanner generation={generation} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] px-5 py-4">
        <p className="text-sm text-[var(--text-secondary)]">{statusCopy}</p>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{generation.readyPairs}/{generation.totalPairs} ready</span>
          {generation.lastCheckedAt ? (
            <span>Checked {new Date(generation.lastCheckedAt).toLocaleTimeString()}</span>
          ) : null}
        </div>
      </div>

      {generation.pairs.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {generation.pairs.map((pair, index) => (
            <PairCardV1
              key={`${pair.designId}-${index}`}
              pair={pair}
              pairIndex={index}
              isSelected={selectingDesignId === pair.designId}
              onSelect={
                pair.status === "ready"
                  ? async () => {
                      setSelectingDesignId(pair.designId);
                      try {
                        const design = await postSelectDesign(pair.designId);
                        navigate(appRoutes.design(projectId, design.id));
                      } finally {
                        setSelectingDesignId(null);
                      }
                    }
                  : undefined
              }
              selectHref={
                pair.status === "ready"
                  ? appRoutes.design(projectId, pair.designId)
                  : undefined
              }
              openHref={
                pair.status === "ready"
                  ? appRoutes.design(projectId, pair.designId)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <Card className="border-white/6 bg-[var(--bg-secondary)] shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto size-8 text-[var(--accent-gold)]" />
            <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
              Waiting for pair candidates
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              The request is active, but no fully resolved pair is available yet.
              Keep this workspace open while the status surface refreshes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
