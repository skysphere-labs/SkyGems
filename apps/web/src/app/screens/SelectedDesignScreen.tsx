import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design } from "../contracts/types";
import { RefineDrawer } from "../components/RefineDrawer";
import { SelectionSummaryPanel } from "../components/status/SelectionSummaryPanel";
import { appRoutes } from "../lib/routes";

export function SelectedDesignScreen() {
  const { designId, projectId } = useParams();
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
          Loading selected design workspace...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">Selected Design Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              {design.displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              This is the active design control room. Review the hero pair, track
              lineage, and move the selected direction into specification work.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {projectId ? (
              <Button asChild variant="outline">
                <Link to={appRoutes.generation(projectId, design.sourceGenerationId)}>
                  Open Generation
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
            <RefineDrawer design={design} />
          </div>
        </CardContent>
      </Card>

      <SelectionSummaryPanel design={design} />
    </div>
  );
}
