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
  const sections = [
    { label: "Geometry & Dimensions", fields: sheet.geometryAndDimensions },
    { label: "Materials & Metal", fields: sheet.materialsAndMetalDetails },
    { label: "Gemstone Schedule", fields: sheet.gemstoneSchedule },
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

      {isNotGenerated ? (
        <div
          className="rounded-2xl border py-14 text-center"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <Sparkles
            className="mx-auto size-10 text-[var(--accent-gold)]"
            style={{ opacity: 0.4 }}
          />
          <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
            Technical sheet not generated yet
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Complete the specification stage first, then generate your
            manufacturing-ready technical sheet.
          </p>
          <Button className="btn-gold mt-5" style={{ height: 44 }}>
            <Sparkles className="size-4" />
            Generate Technical Sheet
          </Button>
        </div>
      ) : (
        <>
          {/* Version */}
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

          {/* Data sections */}
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

          {/* Notes */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <p className="eyebrow mb-3">Assembly Notes</p>
              {sheet.constructionAndAssemblyNotes.length > 0 ? (
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  {sheet.constructionAndAssemblyNotes.map((note) => (
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
              {sheet.tolerancesAndConstraints.length > 0 ? (
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  {sheet.tolerancesAndConstraints.map((item) => (
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
        </>
      )}
    </div>
  );
}
