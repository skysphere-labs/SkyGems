import { AlertCircle, Copy, RefreshCw, Sparkles } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Textarea,
} from "@skygems/ui";

import type { CreateDraftState } from "../../contracts/types";
import { StageStatusPill } from "./StageStatusPill";

export function PromptPreviewStatusCard({
  draft,
  latestPreviewPrompt,
  latestPreviewSummary,
  previewSource,
  previewErrorMessage,
  overrideAcknowledged,
  onPromptChange,
  onResetToPreview,
  onRefreshPreview,
  onOverrideAcknowledged,
}: {
  draft: CreateDraftState;
  latestPreviewPrompt: string;
  latestPreviewSummary: string;
  previewSource: "live" | "fallback";
  previewErrorMessage: string | null;
  overrideAcknowledged: boolean;
  onPromptChange: (value: string) => void;
  onResetToPreview: () => void;
  onRefreshPreview: () => void;
  onOverrideAcknowledged: (value: boolean) => void;
}) {
  const isOverride = draft.promptMode === "override";
  const previewCurrent =
    draft.previewStatus === "ready" && draft.previewRevision === draft.inputRevision;

  return (
    <Card className="border-[rgba(212,175,55,0.12)] bg-[var(--bg-secondary)] shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-[var(--text-primary)]">
              Prompt Preview
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-[var(--text-secondary)]">
              {previewSource === "live"
                ? "Live prompt-preview output is shaping the next submission."
                : "The frontend is falling back to local prompt composition until this project is reachable in the backend."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-medium"
              style={{
                borderColor:
                  previewSource === "live"
                    ? "rgba(76,175,80,0.24)"
                    : "rgba(212,175,55,0.24)",
                backgroundColor:
                  previewSource === "live"
                    ? "rgba(76,175,80,0.12)"
                    : "rgba(212,175,55,0.12)",
                color:
                  previewSource === "live"
                    ? "var(--status-success)"
                    : "var(--accent-gold)",
              }}
            >
              {previewSource === "live" ? "Live endpoint" : "Fallback mode"}
            </span>
            <StageStatusPill
              status={
                draft.previewStatus === "ready"
                  ? "ready"
                  : draft.previewStatus === "loading"
                    ? "processing"
                    : draft.previewStatus === "error"
                      ? "failed"
                      : "absent"
              }
              label={draft.previewStatus}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[28px] border border-[rgba(212,175,55,0.14)] bg-[linear-gradient(180deg,rgba(212,175,55,0.12)_0%,rgba(255,255,255,0.02)_100%)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Latest Preview</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {latestPreviewSummary}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                Keep the prompt synced for the cleanest handoff, or override it when
                you need more precise art direction.
              </p>
            </div>
            <div className="text-right text-xs text-[var(--text-secondary)]">
              <p>Input revision {draft.inputRevision}</p>
              <p>Preview revision {draft.previewRevision ?? "pending"}</p>
            </div>
          </div>
        </div>

        {previewErrorMessage ? (
          <div className="rounded-2xl border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.08)] px-4 py-3 text-sm text-[var(--text-primary)]">
            Live preview unavailable: {previewErrorMessage}
          </div>
        ) : null}

        <Textarea
          value={draft.promptValue}
          rows={11}
          className="min-h-[220px] leading-6"
          onChange={(event) => onPromptChange(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRefreshPreview}>
            <RefreshCw className="size-4" />
            Refresh preview
          </Button>
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(draft.promptValue)}
          >
            <Copy className="size-4" />
            Copy prompt
          </Button>
          <Button
            variant="secondary"
            onClick={onResetToPreview}
            disabled={!isOverride || draft.promptValue === latestPreviewPrompt}
            style={{
              backgroundColor: "rgba(212,175,55,0.12)",
              color: "var(--accent-gold)",
            }}
          >
            <Sparkles className="size-4" />
            Reset to preview
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isOverride
                    ? "rgba(212,175,55,0.14)"
                    : "rgba(76,175,80,0.14)",
                  color: isOverride
                    ? "var(--accent-gold)"
                    : "var(--status-success)",
                }}
              >
                {isOverride ? (
                  <AlertCircle className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {isOverride ? "Prompt override active" : "Prompt synced to preview"}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {isOverride
                    ? "Structured input changes will no longer overwrite this prompt. Confirm the override before submitting generation."
                    : previewCurrent
                      ? "The submission path is ready to use the freshest preview for this revision."
                      : "Waiting for a preview that matches the latest structured input changes."}
                </p>
              </div>
            </div>
          </div>

          {isOverride ? (
            <label className="flex items-start gap-3 rounded-2xl border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.08)] p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--accent-gold)]"
                checked={overrideAcknowledged}
                onChange={(event) => onOverrideAcknowledged(event.target.checked)}
              />
              <span className="text-sm leading-6 text-[var(--text-primary)]">
                I acknowledge that `POST /v1/generate-design` should use the edited
                prompt, not the latest synced preview.
              </span>
            </label>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
