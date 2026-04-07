import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle, ImageWithFallback } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function SvgScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);

  useEffect(() => {
    if (!designId) {
      return;
    }

    fetchDesign(designId).then(setDesign);
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
          <Button asChild>
            <Link to={appRoutes.cad(projectId, design.id)}>
              Continue to CAD
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

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
    </div>
  );
}
