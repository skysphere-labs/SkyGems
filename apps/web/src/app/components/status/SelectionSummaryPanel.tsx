import { ArrowRight, GitBranchPlus, Layers3 } from "lucide-react";
import { Link } from "react-router";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ImageWithFallback,
} from "@skygems/ui";

import type { Design } from "../../contracts/types";
import { appRoutes } from "../../lib/routes";
import { StageStatusPill } from "./StageStatusPill";

export function SelectionSummaryPanel({ design }: { design: Design }) {
  return (
    <Card className="overflow-hidden border-[rgba(212,175,55,0.14)] bg-[var(--bg-secondary)] shadow-[0_36px_100px_rgba(0,0,0,0.28)]">
      <CardHeader className="gap-3">
        <p className="eyebrow">Selected Design</p>
        <CardTitle className="text-2xl text-[var(--text-primary)]">
          {design.displayName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[32px] border border-[rgba(212,175,55,0.16)] bg-[linear-gradient(180deg,rgba(212,175,55,0.12)_0%,rgba(255,255,255,0.02)_100%)] p-5">
            <div
              className="absolute -left-16 top-8 size-44 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(212,175,55,0.12)" }}
            />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Hero Pair Viewer</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Review the chosen sketch and render together before pushing the
                  design deeper into specification and production surfaces.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                  {design.designDna.jewelryType}
                </span>
                <span className="rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                  {design.designDna.metal}
                </span>
                <span className="rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                  {design.designDna.style}
                </span>
              </div>
            </div>

            <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Sketch",
                  title: "Form and construction",
                  image: design.sketch,
                },
                {
                  label: "Render",
                  title: "Material and finish",
                  image: design.render,
                },
              ].map((panel) => (
                <div
                  key={panel.label}
                  className="overflow-hidden rounded-[28px] border border-white/6 bg-[var(--bg-primary)]"
                >
                  <div className="relative">
                    <ImageWithFallback
                      src={panel.image.url}
                      alt={panel.image.alt}
                      className="aspect-[4/5] h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(10,10,10,0)_0%,rgba(10,10,10,0.9)_100%)] px-4 pb-4 pt-12">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent-gold-light)]">
                        {panel.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                        {panel.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Project", design.projectId],
                  ["Generation", design.sourceGenerationId],
                  ["Fingerprint", design.designDna.fingerprintSha256],
                  ["Selected", design.selectedAt ?? "Not selected yet"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-primary)]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Downstream readiness
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StageStatusPill status={design.stages.spec.status} label="Spec" />
                <StageStatusPill
                  status={design.stages.technicalSheet.status}
                  label="Tech Sheet"
                />
                <StageStatusPill status={design.stages.svg.status} label="SVG" />
                <StageStatusPill status={design.stages.cad.status} label="CAD" />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Lineage notes
              </p>
              <div className="mt-4 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                {design.lineageNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="min-w-[180px]"
                style={{
                  background: "var(--sg-gradient)",
                  color: "var(--text-inverse)",
                }}
              >
                <Link to={appRoutes.spec(design.projectId, design.id)}>
                  Go to Spec
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to={appRoutes.generation(
                    design.projectId,
                    design.sourceGenerationId,
                  )}
                >
                  <GitBranchPlus className="size-4" />
                  Open Generation
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/6 bg-[var(--bg-tertiary)] p-5">
          <div className="flex items-center gap-2">
            <Layers3 className="size-4 text-[var(--accent-gold)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Current downstream summary
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Spec", design.stages.spec.summary],
              ["Technical Sheet", design.stages.technicalSheet.summary],
              ["SVG", design.stages.svg.summary],
              ["CAD", design.stages.cad.summary],
            ].map(([label, summary]) => (
              <div
                key={label}
                className="rounded-[24px] border border-white/6 bg-[rgba(255,255,255,0.03)] p-4"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {label}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">
                  {summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
