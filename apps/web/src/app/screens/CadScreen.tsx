import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import { CAD_FORMAT_OPTIONS } from "../contracts/constants";
import type { Design } from "../contracts/types";
import { StageStatusPill } from "../components/status/StageStatusPill";

export function CadScreen() {
  const { designId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);

  useEffect(() => {
    if (!designId) {
      return;
    }

    fetchDesign(designId).then(setDesign);
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

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-6">
          <p className="eyebrow">CAD</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
            Format selection and job tracking
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Keep CAD contextual to the selected design instead of a detached export route.
          </p>
        </CardContent>
      </Card>

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
