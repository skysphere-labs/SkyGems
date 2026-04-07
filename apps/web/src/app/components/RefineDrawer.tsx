import { useEffect, useState } from "react";
import { ArrowRight, WandSparkles } from "lucide-react";
import { useNavigate } from "react-router";

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
import { postRefineDesign } from "../contracts/api";
import { appRoutes } from "../lib/routes";

interface RefineDrawerProps {
  design: Design;
  initialInstruction?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RefineDrawer({
  design,
  initialInstruction,
  open: controlledOpen,
  onOpenChange,
}: RefineDrawerProps) {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState(
    initialInstruction ?? "Tighten the silhouette while preserving the gemstone hierarchy.",
  );
  const [promptOverride, setPromptOverride] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([
    design.refinePresets[0] ?? "",
  ]);

  useEffect(() => {
    if (initialInstruction) {
      setInstruction(initialInstruction);
    }
  }, [initialInstruction]);

  const togglePreset = (preset: string) => {
    setSelectedPresets((current) =>
      current.includes(preset)
        ? current.filter((item) => item !== preset)
        : [...current, preset],
    );
  };

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postRefineDesign({
        designId: design.id,
        instruction,
        promptOverride,
      });
      navigate(appRoutes.generation(design.projectId, response.generationId));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={controlledOpen} onOpenChange={onOpenChange}>
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !instruction.trim()}>
            {isSubmitting ? "Queueing Refine..." : "Queue Refine Generation"}
            <ArrowRight className="size-4" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
