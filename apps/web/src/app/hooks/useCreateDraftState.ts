import { useEffect, useState } from "react";

import { postPromptPreview } from "../contracts/api";
import type { CreateDraftState, CreateInput } from "../contracts/types";
import { generatePromptPreview } from "../domain/promptGenerator";

export function useCreateDraftState(initialState: CreateDraftState) {
  const initialPreview = generatePromptPreview(initialState.inputs);

  const [draft, setDraft] = useState<CreateDraftState>({
    ...initialState,
    promptValue: initialState.promptValue || initialPreview.prompt,
    previewStatus: initialState.previewStatus ?? "ready",
    previewRevision:
      initialState.previewRevision ?? initialState.inputRevision,
  });
  const [previewNonce, setPreviewNonce] = useState(0);
  const [latestPreviewPrompt, setLatestPreviewPrompt] = useState(
    initialState.promptValue || initialPreview.prompt,
  );
  const [latestPreviewSummary, setLatestPreviewSummary] = useState(
    initialPreview.summary,
  );
  const [latestPreviewSource, setLatestPreviewSource] = useState<
    "live" | "fallback"
  >("fallback");
  const [previewErrorMessage, setPreviewErrorMessage] = useState<string | null>(
    null,
  );
  const [overrideAcknowledged, setOverrideAcknowledged] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setDraft((current) => ({ ...current, previewStatus: "loading" }));

    const timeoutId = window.setTimeout(async () => {
      const preview = await postPromptPreview({
        projectId: draft.projectId,
        inputs: draft.inputs,
      });

      if (cancelled) {
        return;
      }

      setLatestPreviewPrompt(preview.promptText);
      setLatestPreviewSummary(preview.promptSummary);
      setLatestPreviewSource(preview.source);
      setPreviewErrorMessage(preview.errorMessage ?? null);
      setDraft((current) => ({
        ...current,
        promptValue:
          current.promptMode === "synced"
            ? preview.promptText
            : current.promptValue,
        previewStatus: "ready",
        previewRevision: current.inputRevision,
      }));
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [draft.inputs, draft.inputRevision, draft.projectId, previewNonce]);

  const canGenerate =
    (draft.promptMode === "synced" &&
      draft.previewStatus === "ready" &&
      draft.previewRevision === draft.inputRevision) ||
    (draft.promptMode === "override" && overrideAcknowledged);

  return {
    draft,
    latestPreviewPrompt,
    latestPreviewSummary,
    latestPreviewSource,
    previewErrorMessage,
    overrideAcknowledged,
    canGenerate,
    updateInput(partial: Partial<CreateInput>) {
      setOverrideAcknowledged(false);
      setDraft((current) => ({
        ...current,
        inputs: { ...current.inputs, ...partial },
        inputRevision: current.inputRevision + 1,
      }));
    },
    updatePromptValue(value: string) {
      setOverrideAcknowledged(false);
      setDraft((current) => ({
        ...current,
        promptMode: "override",
        promptValue: value,
      }));
    },
    resetToPreview() {
      setOverrideAcknowledged(false);
      setDraft((current) => ({
        ...current,
        promptMode: "synced",
        promptValue: latestPreviewPrompt,
      }));
    },
    refreshPreview() {
      setOverrideAcknowledged(false);
      setPreviewNonce((current) => current + 1);
    },
    setOverrideAcknowledged,
  };
}
