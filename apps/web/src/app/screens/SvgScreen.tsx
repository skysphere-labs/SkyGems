import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Play } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle, ImageWithFallback } from "@skygems/ui";

import { fetchDesign, postStartSvg } from "../contracts/api";
import type { Design } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function SvgScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!designId) {
      return;
    }

    fetchDesign(designId).then(setDesign);
  }, [designId]);

  const handleGenerate = useCallback(async () => {
    if (!designId) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await postStartSvg(designId);
      if (result.workflowStatus === "succeeded") {
        const refreshed = await fetchDesign(designId);
        setDesign(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "SVG generation failed.");
    } finally {
      setGenerating(false);
    }
  }, [designId]);

  if (!projectId || !design) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-12 text-center text-[var(--text-secondary)]">
          Loading SVG review...
        </CardContent>
      </Card>
    );
  }

  const hasSvgViews = design.svgViews.length > 0;
  const svgReady = design.stages.svg.status === "ready" || design.stages.svg.status === "succeeded";
  const techSheetReady = design.stages.technicalSheet.status === "ready" || design.stages.technicalSheet.status === "succeeded";

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">SVG</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Vector review workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Review named vector views and annotations before CAD handoff.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!hasSvgViews && techSheetReady && (
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    Generate SVG
                  </>
                )}
              </Button>
            )}
            {svgReady && (
              <Button asChild>
                <Link to={appRoutes.cad(projectId, design.id)}>
                  Continue to CAD
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="py-4 text-sm text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      {!hasSvgViews && !generating && (
        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <CardContent className="py-12 text-center text-[var(--text-secondary)]">
            {techSheetReady
              ? "No SVG views have been generated yet. Click \"Generate SVG\" to create front, side, and top views."
              : "A completed technical sheet is required before SVG generation. Complete the tech sheet stage first."}
          </CardContent>
        </Card>
      )}

      {hasSvgViews && (
        <div className="grid gap-4 xl:grid-cols-3">
          {design.svgViews.map((view) => (
            <Card key={view.viewId} className="border-white/6 bg-[var(--bg-secondary)]">
              <CardHeader>
                <CardTitle className="text-lg text-[var(--text-primary)]">
                  {view.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)]">
                  <ImageWithFallback
                    src={view.asset.url}
                    alt={view.asset.alt}
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  {view.annotations.map((annotation) => (
                    <div
                      key={annotation}
                      className="rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                    >
                      {annotation}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
