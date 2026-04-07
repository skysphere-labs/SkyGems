import { useState } from "react";
import { ArrowRight, WandSparkles } from "lucide-react";
import { Link } from "react-router";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
  SheetTitle,
  Textarea,
} from "@skygems/ui";

import type { Design } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function RefineDrawer({ design }: { design: Design }) {
  const [instruction, setInstruction] = useState(
    "Tighten the silhouette while preserving the gemstone hierarchy.",
  );
  const [promptOverride, setPromptOverride] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([
    design.refinePresets[0] ?? "",
  ]);

  const targetGenerationId =
    design.refineTargetGenerationId ?? design.sourceGenerationId;

  const togglePreset = (preset: string) => {
    setSelectedPresets((current) =>
      current.includes(preset)
        ? current.filter((item) => item !== preset)
        : [...current, preset],
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <WandSparkles className="size-4" />
          Refine
        </Button>
      </SheetTrigger>
      <SheetContent className="border-white/6 bg-[var(--bg-secondary)]">
        <SheetHeader>
          <SheetTitle>Refine Selected Design</SheetTitle>
          <SheetDescription>
            Keep refinement anchored to the selected design and queue the next
            generation pass from the same workspace.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-2">
          <div className="space-y-3">
            <p className="eyebrow">Preset refinements</p>
            <div className="flex flex-wrap gap-2">
              {design.refinePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => togglePreset(preset)}
                  className="rounded-full border px-3 py-2 text-sm transition-colors"
                  style={{
                    borderColor: selectedPresets.includes(preset)
                      ? "rgba(212,175,55,0.28)"
                      : "rgba(255,255,255,0.06)",
                    backgroundColor: selectedPresets.includes(preset)
                      ? "rgba(212,175,55,0.08)"
                      : "rgba(255,255,255,0.02)",
                    color: selectedPresets.includes(preset)
                      ? "var(--accent-gold)"
                      : "var(--text-primary)",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="eyebrow">Refine instruction</p>
            <Textarea
              value={instruction}
              rows={5}
              className="leading-6"
              onChange={(event) => setInstruction(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="eyebrow">Optional prompt override</p>
            <Textarea
              value={promptOverride}
              rows={6}
              className="leading-6"
              placeholder="Optional edited prompt text for the next generation"
              onChange={(event) => setPromptOverride(event.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-white/6 bg-[var(--bg-tertiary)] p-4 text-sm text-[var(--text-secondary)]">
            Next refine submission target:
            <code className="ml-1 text-[var(--text-primary)]">
              POST /v1/designs/{design.id}/refine
            </code>
            <div className="mt-2">
              Selected presets: {selectedPresets.join(", ") || "none"}
            </div>
            <div className="mt-1">Instruction: {instruction}</div>
          </div>
        </div>

        <SheetFooter>
          <Button asChild>
            <Link to={appRoutes.generation(design.projectId, targetGenerationId)}>
              Queue Refine Generation
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
