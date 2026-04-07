"use client";

import { useState } from "react";

import { Check, Download } from "lucide-react";

import { Button } from "@skygems/ui";

import { CAD_FORMAT_OPTIONS } from "../../../contracts/constants";
import type { CadFormat, Design } from "../../../contracts/types";
import { StageStatusPill } from "../../status/StageStatusPill";

export function ExportTab({ design }: { design: Design | null }) {
  const [selectedFormats, setSelectedFormats] = useState<CadFormat[]>([]);

  const toggleFormat = (format: CadFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format],
    );
  };

  const selectAll = () => {
    setSelectedFormats(CAD_FORMAT_OPTIONS.map((opt) => opt.id));
  };

  if (!design) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Download
          className="mb-3 size-10"
          style={{ color: "var(--text-muted)" }}
        />
        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Select a design to export.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Export CAD Files
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {design.displayName}
          </p>
        </div>

        {/* Format selection header */}
        <div className="mb-3 flex items-center justify-between">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Select Formats
          </p>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--accent-gold)" }}
          >
            Select All
          </button>
        </div>

        {/* Format options */}
        <div className="space-y-2">
          {CAD_FORMAT_OPTIONS.map((option) => {
            const selected = selectedFormats.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleFormat(option.id)}
                className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all"
                style={{
                  borderColor: selected
                    ? "var(--accent-gold)"
                    : "var(--border-default)",
                  backgroundColor: selected
                    ? "rgba(212,175,55,0.06)"
                    : "var(--bg-tertiary)",
                }}
              >
                <div
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border"
                  style={{
                    borderColor: selected
                      ? "var(--accent-gold)"
                      : "var(--border-default)",
                    backgroundColor: selected
                      ? "rgba(212,175,55,0.18)"
                      : "transparent",
                  }}
                >
                  {selected && (
                    <Check
                      className="size-3"
                      style={{ color: "var(--accent-gold)" }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {option.label}
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Existing CAD jobs */}
        {design.cadJobs.length > 0 && (
          <div className="mt-6">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Existing CAD Jobs
            </p>
            <div className="space-y-2">
              {design.cadJobs.map((job) => (
                <div
                  key={job.format}
                  className="flex items-center justify-between rounded-lg border p-2.5"
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
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom export button */}
      <div
        className="shrink-0 border-t p-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Button
          className="w-full font-semibold"
          disabled={selectedFormats.length === 0}
          style={{
            backgroundColor:
              selectedFormats.length > 0
                ? "var(--accent-gold)"
                : undefined,
            color: selectedFormats.length > 0 ? "#000" : undefined,
          }}
        >
          <Download className="mr-2 size-4" />
          Export {selectedFormats.length > 0 ? `(${selectedFormats.length})` : ""} Files
        </Button>
      </div>
    </div>
  );
}
