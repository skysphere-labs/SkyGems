"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button, Separator, Textarea } from "@skygems/ui";

import type { CreateDraftState, CreateInput } from "../../../contracts/types";
import { ComplexityControl } from "../../create-flow/ComplexityControl";
import { GemstonePicker } from "../../create-flow/GemstonePicker";
import { JewelryTypePicker } from "../../create-flow/JewelryTypePicker";
import { MetalPicker } from "../../create-flow/MetalPicker";
import { StylePicker } from "../../create-flow/StylePicker";

export function CreateTab({
  draft,
  canGenerate,
  isGenerating,
  updateInput,
  updatePromptValue,
  onGenerate,
}: {
  draft: CreateDraftState;
  canGenerate: boolean;
  isGenerating: boolean;
  updateInput: (partial: Partial<CreateInput>) => void;
  updatePromptValue: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)", fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Create Design
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Define your piece, then generate.
          </p>
        </div>

        {/* Pickers */}
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
        </div>

        <Separator
          className="my-6"
          style={{ backgroundColor: "var(--border-default)" }}
        />

        {/* Prompt preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Design prompt
            </label>
            {draft.previewStatus === "loading" && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-gold)" }}>
                <RefreshCw className="size-3 animate-spin" />
                Previewing...
              </span>
            )}
            {draft.promptMode === "override" && (
              <span className="text-xs" style={{ color: "var(--status-warning)" }}>
                Edited
              </span>
            )}
          </div>
          <Textarea
            placeholder="A delicate floral ring with diamond accents and intricate vine detailing..."
            value={draft.promptValue}
            onChange={(e) => updatePromptValue(e.target.value)}
            rows={5}
            className="resize-none border text-sm leading-relaxed"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: draft.promptMode === "override"
                ? "rgba(255,152,0,0.3)"
                : "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
          {draft.promptMode === "override" && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              You've edited the prompt. Changes to inputs above won't update it.
            </p>
          )}
        </div>
      </div>

      {/* Fixed bottom generate button */}
      <div
        className="shrink-0 border-t p-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Button
          className="btn-gold w-full rounded-lg px-4 py-2.5 font-semibold"
          disabled={!canGenerate || isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              Generate Designs
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
