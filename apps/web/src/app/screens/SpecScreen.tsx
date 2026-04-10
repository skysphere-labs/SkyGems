import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { Button } from "@skygems/ui";

import { fetchDesign } from "../contracts/api";
import type { Design, RiskFlag } from "../contracts/types";
import { StageStatusPill } from "../components/status/StageStatusPill";
import { appRoutes } from "../lib/routes";

function RiskFlagBadge({ flag }: { flag: RiskFlag }) {
  const config = {
    blocking: {
      bg: "rgba(239,83,80,0.08)",
      border: "rgba(239,83,80,0.16)",
      color: "var(--status-error)",
      Icon: AlertTriangle,
    },
    warning: {
      bg: "rgba(255,152,0,0.08)",
      border: "rgba(255,152,0,0.16)",
      color: "var(--status-warning)",
      Icon: AlertTriangle,
    },
    informational: {
      bg: "rgba(100,181,246,0.08)",
      border: "rgba(100,181,246,0.16)",
      color: "var(--status-info)",
      Icon: Info,
    },
  }[flag.severity];
  const Icon = config.Icon;

  return (
    <div
      className="flex items-start gap-2.5 rounded-xl p-3.5 text-sm"
      style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}
    >
      <Icon
        className="mt-0.5 size-4 shrink-0"
        style={{ color: config.color }}
      />
      <div>
        <span style={{ color: config.color }}>{flag.message}</span>
        {flag.field && (
          <span className="ml-1 text-[var(--text-muted)]">({flag.field})</span>
        )}
      </div>
    </div>
  );
}

export function SpecScreen() {
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
          Loading specification...
        </p>
      </div>
    );
  }

  const spec = design.specData;
  const isNotGenerated = spec.versionLabel === "Not generated";
  const geometryFields =
    spec.geometry.length > 0
      ? spec.geometry
      : [
          { label: "Jewelry Type", value: design.designDna.jewelryType },
          { label: "Complexity", value: `${design.designDna.complexity}%` },
          { label: "Band Profile", value: design.designDna.profile },
          { label: "Setting Type", value: design.designDna.settingType },
        ];
  const materialFields =
    spec.materials.length > 0
      ? spec.materials
      : [
          { label: "Primary Metal", value: design.designDna.metal },
          { label: "Band Style", value: design.designDna.bandStyle },
          { label: "Motif", value: design.designDna.motif },
        ];
  const gemstoneFields =
    spec.gemstones.length > 0
      ? spec.gemstones
      : design.designDna.gemstones.map((gemstone, index) => ({
          label: index === 0 ? "Primary Stone" : `Accent Stone ${index}`,
          value: gemstone,
        }));
  const sections = [
    { label: "Geometry", fields: geometryFields },
    { label: "Materials", fields: materialFields },
    { label: "Gemstones", fields: gemstoneFields },
  ];
  const constructionNotes =
    spec.constructionNotes.length > 0
      ? spec.constructionNotes
      : [
          `Use the ${design.designDna.settingType} language as the baseline for formal specification.`,
          `Carry the ${design.designDna.profile} profile forward when technical sheets are generated.`,
        ];
  const missingInformation =
    spec.missingInformation.length > 0
      ? spec.missingInformation
      : isNotGenerated
        ? [
            "Backend stage truth exists, but field-level spec artifact retrieval is still guarded.",
          ]
        : [];

  return (
    <div className="animate-entrance space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="eyebrow">Specification</p>
            <StageStatusPill status={design.stages.spec.status} />
          </div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Design Specification
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Review dimensions, materials, and gemstone parameters before
            technical sheet generation.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="border-[var(--border-default)]"
          >
            <Link to={appRoutes.design(projectId, design.id)}>
              <ArrowLeft className="size-4" />
              Back to Design
            </Link>
          </Button>
          {!isNotGenerated && (
            <Button
              asChild
              className="btn-gold"
            >
              <Link to={appRoutes.technicalSheet(projectId, design.id)}>
                Continue to Technical Sheet
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
                Specification artifact is still pending
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                This route now stays useful by surfacing live design DNA and current stage truth until the downstream spec artifact is exposed.
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
          {spec.versionLabel}
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {spec.summary || design.stages.spec.summary}
        </p>
      </div>

      {spec.riskFlags.length > 0 && (
        <div className="space-y-2">
          <p className="eyebrow">Risk Flags</p>
          {spec.riskFlags.map((flag, i) => (
            <RiskFlagBadge key={i} flag={flag} />
          ))}
        </div>
      )}

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
          <p className="eyebrow mb-3">Construction Notes</p>
          {constructionNotes.length > 0 ? (
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {constructionNotes.map((note) => (
                <li key={note} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[var(--status-success)]" />
                  {note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No construction notes yet.
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
          <p className="eyebrow mb-3">Missing Information</p>
          {missingInformation.length > 0 ? (
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {missingInformation.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--status-info)]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--status-success)]">
              No missing information.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
