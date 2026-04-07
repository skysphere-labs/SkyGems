import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function SpecScreen() {
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
          Loading spec workspace...
        </CardContent>
      </Card>
    );
  }

  const sections = [
    ["Geometry", design.specData.geometry],
    ["Materials", design.specData.materials],
    ["Gemstones", design.specData.gemstones],
  ] as const;

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">Spec</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Structured production intent
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Review the structured spec package and resolve any missing or risky fields before technical-sheet generation.
            </p>
          </div>
          <Button asChild>
            <Link to={appRoutes.technicalSheet(projectId, design.id)}>
              Continue to Technical Sheet
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardHeader>
          <CardTitle className="text-xl text-[var(--text-primary)]">
            {design.specData.versionLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {design.specData.summary}
          </p>

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
                    <p className="text-sm text-[var(--text-secondary)]">No values captured yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Construction Notes
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {design.specData.constructionNotes.length > 0 ? (
                  design.specData.constructionNotes.map((note) => <li key={note}>{note}</li>)
                ) : (
                  <li>No notes yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Missing Information
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {design.specData.missingInformation.length > 0 ? (
                  design.specData.missingInformation.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No missing inputs in the current spec snapshot.</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
