import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, ImageWithFallback } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design } from "../contracts/types";
import { StageStatusPill } from "../components/status/StageStatusPill";
import { appRoutes } from "../lib/routes";

export function SvgScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);

  useEffect(() => {
    if (!designId) return;
    fetchDesign(designId).then(setDesign);
  }, [designId]);

  if (!projectId || !design) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Loading vector views...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-entrance space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="eyebrow">SVG Export</p>
            <StageStatusPill status={design.stages.svg.status} />
          </div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Vector Views
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Review vector output and annotations before CAD export.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="border-[var(--border-default)]"
          >
            <Link to={appRoutes.technicalSheet(projectId, design.id)}>
              <ArrowLeft className="size-4" />
              Back to Tech Sheet
            </Link>
          </Button>
          {design.svgViews.length > 0 && (
            <Button asChild className="btn-gold">
              <Link to={appRoutes.cad(projectId, design.id)}>
                Continue to CAD
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Current SVG stage summary
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {design.stages.svg.summary}
        </p>
      </div>

      {design.svgViews.length > 0 ? (
        <div className="stagger-children grid gap-6 lg:grid-cols-3">
          {design.svgViews.map((view) => (
            <div
              key={view.viewId}
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--border-default)" }}
            >
              <div className="overflow-hidden bg-[var(--bg-primary)]">
                <ImageWithFallback
                  src={view.asset.url}
                  alt={view.asset.alt}
                  className="aspect-square w-full object-contain p-4"
                />
              </div>
              <div
                className="space-y-3 p-4"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderTop: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {view.label}
                  </p>
                  <Button
                    variant="outline"
                    className="h-8 border-[var(--border-default)] px-3 text-xs"
                  >
                    <Download className="size-3" />
                    Download
                  </Button>
                </div>
                {view.annotations.length > 0 && (
                  <div className="space-y-1.5">
                    {view.annotations.map((annotation) => (
                      <p
                        key={annotation}
                        className="text-xs text-[var(--text-secondary)]"
                      >
                        {annotation}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl border py-14 text-center"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <Sparkles
            className="mx-auto size-10 text-[var(--accent-gold)]"
            style={{ opacity: 0.4 }}
          />
          <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
            No vector views yet
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            The route now stays aligned to backend truth, but vector artifact retrieval is still guarded until the SVG slice lands.
          </p>
          <Button className="btn-gold mt-5" style={{ height: 44 }} disabled>
            <Sparkles className="size-4" />
            SVG generation pending
          </Button>
        </div>
      )}
    </div>
  );
}
