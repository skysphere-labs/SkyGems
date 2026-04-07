"use client";

import { useState } from "react";

import {
  Box,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  PenTool,
} from "lucide-react";

import type { Design, StageStatus } from "../../../contracts/types";
import { StageStatusPill } from "../../status/StageStatusPill";

interface PipelineSection {
  id: string;
  label: string;
  icon: typeof FileText;
  status: StageStatus;
}

function SectionHeader({
  section,
  expanded,
  onToggle,
}: {
  section: PipelineSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-lg p-3 transition-all"
      style={{ backgroundColor: "var(--bg-tertiary)" }}
    >
      <Icon className="size-4 shrink-0" style={{ color: "var(--accent-gold)" }} />
      <span
        className="flex-1 text-left text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {section.label}
      </span>
      <StageStatusPill status={section.status} />
      <ChevronDown
        className="size-4 shrink-0 transition-transform"
        style={{
          color: "var(--text-muted)",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
  );
}

function SpecSection({ design }: { design: Design }) {
  const spec = design.specData;
  return (
    <div className="space-y-3 p-3 pt-0">
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {spec.summary}
      </p>
      {spec.geometry.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Geometry
          </p>
          {spec.geometry.map((field) => (
            <div key={field.label} className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--text-secondary)" }}>{field.label}</span>
              <span style={{ color: "var(--text-primary)" }}>{field.value}</span>
            </div>
          ))}
        </div>
      )}
      {spec.materials.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Materials
          </p>
          {spec.materials.map((field) => (
            <div key={field.label} className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--text-secondary)" }}>{field.label}</span>
              <span style={{ color: "var(--text-primary)" }}>{field.value}</span>
            </div>
          ))}
        </div>
      )}
      {spec.constructionNotes.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Construction Notes
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {spec.constructionNotes.map((note) => (
              <li
                key={note}
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TechnicalSheetSection({ design }: { design: Design }) {
  const sheet = design.technicalSheetData;
  return (
    <div className="space-y-3 p-3 pt-0">
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>Version: {sheet.versionLabel}</span>
        <span>Generated: {new Date(sheet.generatedAt).toLocaleDateString()}</span>
      </div>
      {sheet.geometryAndDimensions.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Geometry &amp; Dimensions
          </p>
          {sheet.geometryAndDimensions.map((field) => (
            <div key={field.label} className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--text-secondary)" }}>{field.label}</span>
              <span style={{ color: "var(--text-primary)" }}>{field.value}</span>
            </div>
          ))}
        </div>
      )}
      {sheet.constructionAndAssemblyNotes.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Construction &amp; Assembly
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {sheet.constructionAndAssemblyNotes.map((note) => (
              <li
                key={note}
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SvgSection({ design }: { design: Design }) {
  return (
    <div className="space-y-2 p-3 pt-0">
      {design.svgViews.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          No SVG views generated yet.
        </p>
      ) : (
        design.svgViews.map((view) => (
          <div
            key={view.viewId}
            className="rounded-lg border p-2"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-elevated)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {view.label}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {view.viewId}
              </span>
            </div>
            {view.annotations.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {view.annotations.map((annotation) => (
                  <span
                    key={annotation}
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {annotation}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function CadSection({ design }: { design: Design }) {
  return (
    <div className="space-y-2 p-3 pt-0">
      {design.cadJobs.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          No CAD jobs initiated yet.
        </p>
      ) : (
        design.cadJobs.map((job) => (
          <div
            key={job.format}
            className="flex items-center justify-between rounded-lg border p-2"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-elevated)",
            }}
          >
            <div>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {job.format.toUpperCase()}
              </span>
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {job.fileName}
              </span>
            </div>
            <StageStatusPill status={job.status} />
          </div>
        ))
      )}
    </div>
  );
}

export function PipelineTab({ design }: { design: Design | null }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    spec: false,
    technicalSheet: false,
    svg: false,
    cad: false,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!design) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Box
          className="mb-3 size-10"
          style={{ color: "var(--text-muted)" }}
        />
        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Select a design from the gallery to view its production pipeline.
        </p>
      </div>
    );
  }

  const sections: PipelineSection[] = [
    {
      id: "spec",
      label: "Spec",
      icon: FileText,
      status: design.stages.spec.status,
    },
    {
      id: "technicalSheet",
      label: "Technical Sheet",
      icon: FileSpreadsheet,
      status: design.stages.technicalSheet.status,
    },
    {
      id: "svg",
      label: "SVG Views",
      icon: PenTool,
      status: design.stages.svg.status,
    },
    {
      id: "cad",
      label: "CAD Export",
      icon: Box,
      status: design.stages.cad.status,
    },
  ];

  const sectionContent: Record<string, React.ReactNode> = {
    spec: <SpecSection design={design} />,
    technicalSheet: <TechnicalSheetSection design={design} />,
    svg: <SvgSection design={design} />,
    cad: <CadSection design={design} />,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Design name */}
        <div className="mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Pipeline
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--accent-gold)" }}
          >
            {design.displayName}
          </p>
        </div>

        {/* Collapsible sections */}
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--border-default)" }}
            >
              <SectionHeader
                section={section}
                expanded={!!expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
              {expandedSections[section.id] && sectionContent[section.id]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
