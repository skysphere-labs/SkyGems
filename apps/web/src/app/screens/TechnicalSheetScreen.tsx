import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design } from "../contracts/types";
import { StageStatusPill } from "../components/status/StageStatusPill";
import { appRoutes } from "../lib/routes";

export function TechnicalSheetScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);

  useEffect(() => {
    if (!designId) return;
    fetchDesign(designId).then(setDesign);
  }, [designId]);

  if (!projectId || !design) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Loading technical sheet...
        </p>
      </div>
    );
  }

  const sheet = design.technicalSheetData;
  const isNotGenerated = sheet.versionLabel === "Not generated";
  const geometryFields =
    sheet.geometryAndDimensions.length > 0
      ? sheet.geometryAndDimensions
      : [
          { label: "Profile", value: design.designDna.profile },
          { label: "Setting", value: design.designDna.settingType },
          { label: "Complexity", value: `${design.designDna.complexity}%` },
        ];
  const materialFields =
    sheet.materialsAndMetalDetails.length > 0
      ? sheet.materialsAndMetalDetails
      : [
          { label: "Metal", value: design.designDna.metal },
          { label: "Band Style", value: design.designDna.bandStyle },
          { label: "Motif", value: design.designDna.motif },
        ];
  const gemstoneFields =
    sheet.gemstoneSchedule.length > 0
      ? sheet.gemstoneSchedule
      : design.designDna.gemstones.map((gemstone, index) => ({
          label: index === 0 ? "Primary Stone" : `Accent Stone ${index}`,
          value: gemstone,
        }));
  const sections = [
    { label: "Geometry & Dimensions", fields: geometryFields },
    { label: "Materials & Metal", fields: materialFields },
    { label: "Gemstone Schedule", fields: gemstoneFields },
  ];
  const assemblyNotes =
    sheet.constructionAndAssemblyNotes.length > 0
      ? sheet.constructionAndAssemblyNotes
      : [
          "Technical sheet detail will be hydrated from backend artifacts as that slice lands.",
          `Current manufacturing baseline follows the ${design.designDna.settingType} setting and ${design.designDna.profile} profile.`,
        ];
  const tolerances =
    sheet.tolerancesAndConstraints.length > 0
      ? sheet.tolerancesAndConstraints
      : [
          "Precise tolerances remain pending until the technical sheet artifact is generated.",
        ];

  return (
    <div className="animate-entrance space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="eyebrow">Technical Sheet</p>
            <StageStatusPill status={design.stages.technicalSheet.status} />
          </div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Manufacturing Details
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Production-ready specifications for the manufacturing team.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="border-[var(--border-default)]"
          >
            <Link to={appRoutes.spec(projectId, design.id)}>
              <ArrowLeft className="size-4" />
              Back to Spec
            </Link>
          </Button>
          {!isNotGenerated && (
            <Button asChild className="btn-gold">
              <Link to={appRoutes.svg(projectId, design.id)}>
                Continue to SVG
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isNotGenerated && (
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            borderColor: "rgba(212,175,55,0.14)",
            backgroundColor: "rgba(212,175,55,0.04)",
          }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 text-[var(--accent-gold)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Technical sheet artifact is still pending
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                The screen now keeps its place in the product flow by exposing the live manufacturing baseline until the formal technical sheet arrives.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {sheet.versionLabel}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Generated: {sheet.generatedAt}
        </p>
      </div>

      <div className="stagger-children grid gap-5 lg:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.label}
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-tertiary)",
            }}
          >
            <p className="eyebrow mb-4">{section.label}</p>
            {section.fields.length > 0 ? (
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-[var(--text-secondary)]">
                      {field.label}
                    </span>
                    <span className="text-right font-medium text-[var(--text-primary)]">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Awaiting generation
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <p className="eyebrow mb-3">Assembly Notes</p>
          {assemblyNotes.length > 0 ? (
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {assemblyNotes.map((note) => (
                <li key={note} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[var(--status-success)]" />
                  {note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No assembly notes yet.
            </p>
          )}
        </div>
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <p className="eyebrow mb-3">Tolerances & Constraints</p>
          {tolerances.length > 0 ? (
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {tolerances.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No tolerance issues found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
