import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent } from "@skygems/ui";

import { fetchDesign, postGenerateSpec } from "../contracts/api";
import type { Design } from "../contracts/types";
import { CopilotPanel } from "../components/CopilotPanel";
import { RefineDrawer } from "../components/RefineDrawer";
import { EditingToolbar } from "../components/editing/EditingToolbar";
import type { EditingToolPreset } from "../components/editing/presets";
import { SelectionSummaryPanel } from "../components/status/SelectionSummaryPanel";
import { appRoutes } from "../lib/routes";

export function SelectedDesignScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [presetInstruction, setPresetInstruction] = useState<string | undefined>(undefined);

  const handlePresetSelect = useCallback((preset: EditingToolPreset) => {
    setPresetInstruction(preset.refineInstruction);
    setRefineOpen(true);
  }, []);

  const handleRefineOpenChange = useCallback((open: boolean) => {
    setRefineOpen(open);
    if (!open) {
      setPresetInstruction(undefined);
    }
  }, []);

  const handleCopilotRefine = useCallback((instruction: string) => {
    setCopilotOpen(false);
    setPresetInstruction(instruction);
    setRefineOpen(true);
  }, []);

  const handleCopilotSpec = useCallback(() => {
    if (!designId) return;
    setCopilotOpen(false);
    postGenerateSpec(designId).catch(() => {
      // Spec generation failed silently; user can retry from the spec screen.
    });
  }, [designId]);

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
            <Button
              variant="outline"
              onClick={() => setCopilotOpen(true)}
              className="border-[rgba(212,175,55,0.25)] text-[var(--accent-gold)] hover:bg-[rgba(212,175,55,0.08)]"
            >
              <Sparkles className="size-4" />
              AI Assistant
            </Button>
            <RefineDrawer
              design={design}
              initialInstruction={presetInstruction}
              open={refineOpen}
              onOpenChange={handleRefineOpenChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-6">
          <EditingToolbar onSelectPreset={handlePresetSelect} />
        </CardContent>
      </Card>

      <SelectionSummaryPanel design={design} />

      <CopilotPanel
        designId={design.id}
        open={copilotOpen}
        onOpenChange={setCopilotOpen}
        onRefineRequest={handleCopilotRefine}
        onSpecRequest={handleCopilotSpec}
      />
    </div>
  );
}
