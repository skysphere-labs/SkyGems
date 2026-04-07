import { Copy, RefreshCw, Sparkles } from "lucide-react";

import { Button, Textarea } from "@skygems/ui";

import type { CreateDraftState } from "../../contracts/types";

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
  const isLoading = draft.previewStatus === "loading";

  return (
    <div className="space-y-5">
      {/* Preview summary */}
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: "rgba(212,175,55,0.12)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Prompt Preview</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
              {latestPreviewSummary}
            </p>
          </div>
          {isLoading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
          )}
        </div>

        {/* Source indicator */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{
              backgroundColor:
                previewSource === "live"
                  ? "var(--status-success)"
                  : "var(--text-muted)",
            }}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {previewSource === "live" ? "Live preview" : "Local preview"}
          </span>
        </div>
      </div>

      {previewErrorMessage && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            backgroundColor: "rgba(255,152,0,0.06)",
            border: "1px solid rgba(255,152,0,0.12)",
            color: "var(--status-warning)",
          }}
        >
          {previewErrorMessage}
        </div>
      )}

      {/* Prompt textarea */}
      <Textarea
        value={draft.promptValue}
        rows={10}
        className="min-h-[200px] border-[var(--border-default)] bg-[var(--bg-elevated)] leading-relaxed text-[var(--text-primary)]"
        onChange={(e) => onPromptChange(e.target.value)}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onRefreshPreview}
          className="border-[var(--border-default)]"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(draft.promptValue)}
          className="border-[var(--border-default)]"
        >
          <Copy className="size-4" />
          Copy
        </Button>
        {isOverride && (
          <Button
            variant="outline"
            onClick={onResetToPreview}
            disabled={draft.promptValue === latestPreviewPrompt}
            className="border-[rgba(212,175,55,0.2)]"
            style={{ color: "var(--accent-gold)" }}
          >
            <Sparkles className="size-4" />
            Reset to auto
          </Button>
        )}
      </div>

      {/* Mode indicator */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: isOverride
            ? "rgba(212,175,55,0.04)"
            : "rgba(76,175,80,0.04)",
          border: isOverride
            ? "1px solid rgba(212,175,55,0.1)"
            : "1px solid rgba(76,175,80,0.1)",
        }}
      >
        <p
          className="text-sm font-medium"
          style={{
            color: isOverride
              ? "var(--accent-gold)"
              : "var(--status-success)",
          }}
        >
          {isOverride
            ? "Custom prompt active"
            : "Prompt synced to your selections"}
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {isOverride
            ? "Editing the prompt text overrides auto-generation. Confirm below to use this prompt."
            : "The prompt updates automatically as you change your selections."}
        </p>
      </div>

      {/* Override acknowledgment */}
      {isOverride && (
        <label
          className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"
          style={{
            borderColor: "rgba(212,175,55,0.16)",
            backgroundColor: "rgba(212,175,55,0.04)",
          }}
        >
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--accent-gold)]"
            checked={overrideAcknowledged}
            onChange={(e) => onOverrideAcknowledged(e.target.checked)}
          />
          <span className="text-sm text-[var(--text-primary)]">
            I want to use my custom prompt for this generation.
          </span>
        </label>
      )}
    </div>
  );
}
