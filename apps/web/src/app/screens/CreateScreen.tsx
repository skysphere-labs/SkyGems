import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@skygems/ui";

import {
  fetchCreateDraft,
  fetchProject,
  postGenerateDesign,
} from "../contracts/api";
import type { CreateDraftState, ProjectWorkspace } from "../contracts/types";
import { ComplexityControl } from "../components/create-flow/ComplexityControl";
import { GemstonePicker } from "../components/create-flow/GemstonePicker";
import { JewelryTypePicker } from "../components/create-flow/JewelryTypePicker";
import { MetalPicker } from "../components/create-flow/MetalPicker";
import { StylePicker } from "../components/create-flow/StylePicker";
import { PromptPreviewStatusCard } from "../components/status/PromptPreviewStatusCard";
import { useCreateDraftState } from "../hooks/useCreateDraftState";
import { appRoutes } from "../lib/routes";

function CreateScreenComposer({
  project,
  initialDraft,
}: {
  project: ProjectWorkspace;
  initialDraft: CreateDraftState;
}) {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    draft,
    latestPreviewPrompt,
    latestPreviewSummary,
    latestPreviewSource,
    previewErrorMessage,
    overrideAcknowledged,
    canGenerate,
    refreshPreview,
    resetToPreview,
    setOverrideAcknowledged,
    updateInput,
    updatePromptValue,
  } = useCreateDraftState(initialDraft);

  async function handleGenerate() {
    if (!canGenerate) return;

    setIsGenerating(true);
    try {
      const response = await postGenerateDesign({
        projectId: project.projectId,
        draft,
        latestPreviewSummary,
      });
      navigate(
        appRoutes.generation(project.projectId, response.generationId),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="animate-entrance space-y-8">
      <div>
        <h1
          className="text-3xl font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Design a new piece
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Choose the silhouette, materials, and style — then generate your
          design pair.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
        {/* Left: Configuration */}
        <div className="space-y-6">
          <JewelryTypePicker
            value={draft.inputs.jewelryType}
            onChange={(jewelryType) => updateInput({ jewelryType })}
          />
          <MetalPicker
            value={draft.inputs.metal}
            onChange={(metal) => updateInput({ metal })}
          />
          <GemstonePicker
            value={draft.inputs.gemstones}
            onChange={(gemstones) => updateInput({ gemstones })}
          />
          <StylePicker
            value={draft.inputs.style}
            onChange={(style) => updateInput({ style })}
          />
          <ComplexityControl
            value={draft.inputs.complexity}
            onChange={(complexity) => updateInput({ complexity })}
          />

          {/* Generate CTA — the only gold button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="btn-gold w-full"
            style={{
              height: 48,
              fontSize: 14,
              borderRadius: 8,
            }}
          >
            <Sparkles className="size-4" />
            {isGenerating ? "Generating..." : "Generate Designs"}
          </Button>
        </div>

        {/* Right: Prompt Preview */}
        <PromptPreviewStatusCard
          draft={draft}
          latestPreviewPrompt={latestPreviewPrompt}
          latestPreviewSummary={latestPreviewSummary}
          previewSource={latestPreviewSource}
          previewErrorMessage={previewErrorMessage}
          overrideAcknowledged={overrideAcknowledged}
          onPromptChange={updatePromptValue}
          onResetToPreview={resetToPreview}
          onRefreshPreview={refreshPreview}
          onOverrideAcknowledged={setOverrideAcknowledged}
        />
      </div>
    </div>
  );
}

export function CreateScreen() {
  const { projectId } = useParams();
  const [draft, setDraft] = useState<CreateDraftState | null>(null);
  const [project, setProject] = useState<ProjectWorkspace | null>(null);

  useEffect(() => {
    if (!projectId) return;
    fetchProject(projectId).then(setProject);
    fetchCreateDraft(projectId).then(setDraft);
  }, [projectId]);

  if (!project || !draft) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Preparing your workspace...
        </p>
      </div>
    );
  }

  return (
    <CreateScreenComposer
      key={project.projectId}
      project={project}
      initialDraft={draft}
    />
  );
}
