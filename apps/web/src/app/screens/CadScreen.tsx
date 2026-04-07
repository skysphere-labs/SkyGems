import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Play } from "lucide-react";
import { useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

import { fetchDesign, postStartCad } from "../contracts/api";
import { CAD_FORMAT_OPTIONS } from "../contracts/constants";
import type { Design } from "../contracts/types";
import { StageStatusPill } from "../components/status/StageStatusPill";

export function CadScreen() {
  const { designId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!designId) {
      return;
    }

    fetchDesign(designId).then(setDesign);
  }, [designId]);

  const handleStartCad = useCallback(async () => {
    if (!designId) return;
    setGenerating(true);
    setError(null);
    try {
      const formats = CAD_FORMAT_OPTIONS.map((f) => f.id);
      const result = await postStartCad(designId, formats);
      if (result.workflowStatus === "succeeded") {
        const refreshed = await fetchDesign(designId);
        setDesign(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "CAD generation failed.");
    } finally {
      setGenerating(false);
    }
  }, [designId]);

  if (!design) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-12 text-center text-[var(--text-secondary)]">
          Loading CAD workspace...
        </CardContent>
      </Card>
    );
  }

  const cadReady = design.stages.cad.status === "ready" || design.stages.cad.status === "succeeded";
  const svgReady = design.stages.svg.status === "ready" || design.stages.svg.status === "succeeded";
  const hasJobs = design.cadJobs.length > 0;

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">CAD</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Format selection and job tracking
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Keep CAD contextual to the selected design instead of a detached export route.
            </p>
          </div>
          {!hasJobs && svgReady && (
            <Button onClick={handleStartCad} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Starting CAD...
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Start CAD
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="py-4 text-sm text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      {!hasJobs && !generating && (
        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <CardContent className="py-12 text-center text-[var(--text-secondary)]">
            {svgReady
              ? "No CAD jobs have been started yet. Click \"Start CAD\" to begin the modeling pipeline."
              : "A completed SVG package is required before CAD generation. Complete the SVG stage first."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {CAD_FORMAT_OPTIONS.map((format) => {
          const job = design.cadJobs.find((candidate) => candidate.format === format.id);
          return (
            <Card key={format.id} className="border-white/6 bg-[var(--bg-secondary)]">
              <CardHeader>
                <CardTitle className="text-lg text-[var(--text-primary)]">
                  {format.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {format.description}
                </p>
                <StageStatusPill status={job?.status ?? "absent"} />
                <Button variant="outline" disabled={!job?.artifact}>
                  <Download className="size-4" />
                  {job?.artifact ? "Download artifact" : "Awaiting artifact"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardHeader>
          <CardTitle className="text-lg text-[var(--text-primary)]">
            Existing CAD jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {design.cadJobs.length > 0 ? (
            design.cadJobs.map((job) => (
              <div
                key={job.format}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {job.format.toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{job.note}</p>
                </div>
                <StageStatusPill status={job.status} />
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No CAD jobs have been queued for this design yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
