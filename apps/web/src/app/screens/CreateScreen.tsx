import { useEffect, useState } from "react";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { Button, Card, CardContent } from "@skygems/ui";

import { fetchCreateDraft, fetchProject, postGenerateDesign } from "../contracts/api";
import type { CreateDraftState, ProjectWorkspace } from "../contracts/types";
import { ComplexityControl } from "../components/create-flow/ComplexityControl";
import { GemstonePicker } from "../components/create-flow/GemstonePicker";
import { JewelryTypePicker } from "../components/create-flow/JewelryTypePicker";
import { MetalPicker } from "../components/create-flow/MetalPicker";
import { RenderModePicker } from "../components/create-flow/RenderModePicker";
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
    setRenderMode,
    updateInput,
    updatePromptValue,
  } = useCreateDraftState(initialDraft);

  async function handleGenerate() {
    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await postGenerateDesign({
        projectId: project.projectId,
        draft,
        latestPreviewSummary,
      });
      navigate(appRoutes.generation(project.projectId, response.generationId));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[rgba(212,175,55,0.16)] bg-[linear-gradient(135deg,rgba(212,175,55,0.1)_0%,rgba(17,17,17,1)_28%,rgba(10,10,10,1)_100%)]">
        <CardContent className="relative flex flex-wrap items-center justify-between gap-6 py-8">
          <div
            className="absolute -right-12 top-0 size-40 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(212,175,55,0.12)" }}
          />
          <div>
            <p className="eyebrow">Create</p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">
              Shape the next signature pair
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Define the silhouette, material stack, and stylistic direction, then
              hand the refined prompt into preview and generation without leaving the
              project lane.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                project.name,
                latestPreviewSource === "live" ? "Live preview path" : "Fallback preview guardrail",
                draft.promptMode === "override" ? "Prompt override active" : "Prompt synced",
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    borderColor: "rgba(212,175,55,0.18)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    color: "var(--text-primary)",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="min-w-[220px] shadow-[0_18px_48px_rgba(212,175,55,0.22)]"
            style={{
              background: "var(--sg-gradient)",
              color: "var(--text-inverse)",
            }}
          >
            <Sparkles className="size-4" />
            {isGenerating ? "Queueing..." : "Generate Pair"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/6 bg-[var(--bg-secondary)] shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 rounded-[28px] border border-[rgba(212,175,55,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-5 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Active project
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                  {project.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {project.description ??
                    "No project description yet. Use this lane to establish the next hero direction."}
                </p>
              </div>
              <div className="flex items-start justify-end">
                <div
                  className="flex size-12 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--sg-gradient)",
                    color: "var(--text-inverse)",
                  }}
                >
                  <Crown className="size-5" />
                </div>
              </div>
            </div>

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
            <RenderModePicker
              value={draft.renderMode}
              onChange={setRenderMode}
            />
          </CardContent>
        </Card>

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

      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="min-w-[240px]"
          style={{
            background: "var(--sg-gradient)",
            color: "var(--text-inverse)",
          }}
        >
          Continue to Generation
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function CreateScreen() {
  const { projectId } = useParams();
  const [draft, setDraft] = useState<CreateDraftState | null>(null);
  const [project, setProject] = useState<ProjectWorkspace | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    fetchProject(projectId).then(setProject);
    fetchCreateDraft(projectId).then(setDraft);
  }, [projectId]);

  if (!project || !draft) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-12 text-center text-[var(--text-secondary)]">
          Loading create workspace...
        </CardContent>
      </Card>
    );
  }

  return <CreateScreenComposer key={project.projectId} project={project} initialDraft={draft} />;
}
