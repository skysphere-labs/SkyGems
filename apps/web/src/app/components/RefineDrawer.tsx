import { useState } from "react";
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

import { postRefineDesign } from "../contracts/api";
import type { Design } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function RefineDrawer({ design }: { design: Design }) {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePreset = (preset: string) => {
    setSelectedPresets((current) =>
      current.includes(preset)
        ? current.filter((p) => p !== preset)
        : [...current, preset],
    );
  };

  async function handleRefine() {
    setIsSubmitting(true);
    try {
      const result = await postRefineDesign(design.id);
      if (result.generationId) {
        navigate(
          appRoutes.generation(design.projectId, result.generationId),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="border-[var(--border-default)]">
          <WandSparkles className="size-4" />
          Refine
        </Button>
      </SheetTrigger>
      <SheetContent
        className="border-l bg-[var(--bg-secondary)]"
        style={{ borderColor: "var(--border-default)" }}
      >
        <SheetHeader>
          <SheetTitle className="text-[var(--text-primary)]">
            Refine Design
          </SheetTitle>
          <SheetDescription className="text-[var(--text-secondary)]">
            Describe the changes you want and generate a new variation.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-2">
          {/* Presets */}
          {design.refinePresets.length > 0 && (
            <div className="space-y-3">
              <p className="eyebrow">Quick refinements</p>
              <div className="flex flex-wrap gap-2">
                {design.refinePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => togglePreset(preset)}
                    className="rounded-full border px-3 py-1.5 text-sm transition-colors"
                    style={{
                      borderColor: selectedPresets.includes(preset)
                        ? "rgba(212,175,55,0.28)"
                        : "var(--border-default)",
                      backgroundColor: selectedPresets.includes(preset)
                        ? "rgba(212,175,55,0.08)"
                        : "transparent",
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
          )}

          {/* Instruction */}
          <div className="space-y-2">
            <p className="eyebrow">Your instructions</p>
            <Textarea
              value={instruction}
              rows={5}
              className="border-[var(--border-default)] bg-[var(--bg-elevated)] leading-relaxed text-[var(--text-primary)]"
              placeholder="Describe the changes you'd like..."
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={handleRefine}
            disabled={isSubmitting}
            className="btn-gold w-full"
            style={{ height: 44 }}
          >
            {isSubmitting ? "Generating..." : "Generate Refinement"}
            <ArrowRight className="size-4" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
