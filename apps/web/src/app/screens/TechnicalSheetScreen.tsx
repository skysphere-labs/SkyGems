import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function TechnicalSheetScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);

  useEffect(() => {
    if (!designId) {
      return;
    }

    fetchDesign(designId).then(setDesign);
  }, [designId]);

  if (!projectId || !design) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-12 text-center text-[var(--text-secondary)]">
          Loading technical sheet...
        </CardContent>
      </Card>
    );
  }

  const sheet = design.technicalSheetData;
  const sections = [
    ["Geometry & Dimensions", sheet.geometryAndDimensions],
    ["Materials", sheet.materialsAndMetalDetails],
    ["Gemstone Schedule", sheet.gemstoneSchedule],
  ] as const;

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">Technical Sheet</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Manufacturing-facing review
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Present the approved design as a technical packet before vector generation.
            </p>
          </div>
          <Button asChild>
            <Link to={appRoutes.svg(projectId, design.id)}>
              Continue to SVG
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardHeader>
          <CardTitle className="text-xl text-[var(--text-primary)]">
            {sheet.versionLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {sections.map(([label, fields]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {label}
                </p>
                <div className="mt-4 space-y-3">
                  {fields.length > 0 ? (
                    fields.map((field) => (
                      <div key={field.label} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-[var(--text-secondary)]">{field.label}</span>
                        <span className="text-right text-[var(--text-primary)]">{field.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">Awaiting generated content.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Construction & Assembly
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {sheet.constructionAndAssemblyNotes.length > 0 ? (
                  sheet.constructionAndAssemblyNotes.map((note) => <li key={note}>{note}</li>)
                ) : (
                  <li>No assembly notes yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Tolerances & Constraints
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {sheet.tolerancesAndConstraints.length > 0 ? (
                  sheet.tolerancesAndConstraints.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No tolerance issues in the current technical sheet snapshot.</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
