import { useEffect, useState } from "react";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import { CAD_FORMAT_OPTIONS } from "../contracts/constants";
import type { Design } from "../contracts/types";
import { StageStatusPill } from "../components/status/StageStatusPill";
import { appRoutes } from "../lib/routes";

export function CadScreen() {
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
          Loading CAD exports...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-entrance space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="eyebrow">CAD Export</p>
            <StageStatusPill status={design.stages.cad.status} />
          </div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Manufacturing Files
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Download production-ready CAD files for manufacturing.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-[var(--border-default)]"
        >
          <Link to={appRoutes.svg(projectId, design.id)}>
            <ArrowLeft className="size-4" />
            Back to SVG
          </Link>
        </Button>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Current CAD stage summary
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {design.stages.cad.summary}
        </p>
      </div>

      {/* Format cards */}
      <div className="stagger-children grid gap-5 lg:grid-cols-3">
        {CAD_FORMAT_OPTIONS.map((format) => {
          const job = design.cadJobs.find((j) => j.format === format.id);
          const hasArtifact = !!job?.artifact;

          return (
            <div
              key={format.id}
              className="rounded-2xl border p-6"
              style={{
                borderColor: hasArtifact
                  ? "rgba(212,175,55,0.16)"
                  : "var(--border-default)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {format.label}
                </h3>
                <StageStatusPill status={job?.status ?? "absent"} />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {format.description}
              </p>
              <div className="mt-5">
                {hasArtifact ? (
                  <Button className="btn-gold w-full">
                    <Download className="size-4" />
                    Download {format.label}
                  </Button>
                ) : job ? (
                  <Button
                    variant="outline"
                    className="w-full border-[var(--border-default)]"
                    disabled={
                      job.status === "processing" || job.status === "running"
                    }
                  >
                    {job.status === "processing" || job.status === "running"
                      ? "Generating..."
                      : "Awaiting artifact"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-[var(--border-default)]"
                    disabled
                  >
                    <Sparkles className="size-4" />
                    {design.cadJobs.length > 0
                      ? `Awaiting ${format.label}`
                      : "CAD generation pending"}
                  </Button>
                )}
              </div>
              {job?.note && (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {job.note}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Existing jobs summary */}
      {design.cadJobs.length > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <p className="eyebrow mb-4">Job History</p>
          <div className="space-y-3">
            {design.cadJobs.map((job) => (
              <div
                key={job.format}
                className="flex items-center justify-between rounded-xl p-3"
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {job.format.toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {job.note}
                  </p>
                </div>
                <StageStatusPill status={job.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
