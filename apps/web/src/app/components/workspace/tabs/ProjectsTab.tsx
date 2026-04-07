"use client";

import { Check, FolderOpen, Plus } from "lucide-react";

import { Button } from "@skygems/ui";

import type { ProjectWorkspace } from "../../../contracts/types";

export function ProjectsTab({
  projects,
  activeProjectId,
  onProjectSelect,
}: {
  projects: ProjectWorkspace[];
  activeProjectId: string;
  onProjectSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b p-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Projects
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border text-xs"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          <Plus className="size-3.5" />
          New
        </Button>
      </div>

      {/* Scrollable project list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {projects.map((project) => {
            const isActive = project.projectId === activeProjectId;

            return (
              <button
                key={project.projectId}
                type="button"
                onClick={() => onProjectSelect(project.projectId)}
                className="w-full rounded-xl border p-3 text-left transition-all"
                style={{
                  borderColor: isActive
                    ? "var(--accent-gold)"
                    : "var(--border-default)",
                  backgroundColor: isActive
                    ? "rgba(212,175,55,0.06)"
                    : "var(--bg-tertiary)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen
                      className="mt-0.5 size-4 shrink-0"
                      style={{
                        color: isActive
                          ? "var(--accent-gold)"
                          : "var(--text-muted)",
                      }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {project.name}
                    </span>
                  </div>
                  {isActive && (
                    <Check
                      className="size-4 shrink-0"
                      style={{ color: "var(--accent-gold)" }}
                    />
                  )}
                </div>

                {project.description && (
                  <p
                    className="mt-1.5 line-clamp-2 pl-6 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {project.description}
                  </p>
                )}

                <div
                  className="mt-2 flex items-center gap-3 pl-6 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{project.designCount} designs</span>
                  <span>
                    Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            );
          })}

          {projects.length === 0 && (
            <div
              className="py-8 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No projects yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
