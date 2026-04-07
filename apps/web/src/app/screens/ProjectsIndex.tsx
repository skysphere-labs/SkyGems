import { useEffect, useState } from "react";
import { ArrowRight, FolderOpen, Plus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button } from "@skygems/ui";

import { bootstrapProject, fetchProjects } from "../contracts/api";
import type { ProjectWorkspace } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function ProjectsIndex() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);

  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const project = await bootstrapProject();
      setProjects(await fetchProjects());
      navigate(appRoutes.create(project.projectId));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="animate-entrance">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Your Studio
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Open a project or start a new collection.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="btn-gold"
            style={{ height: 44 }}
          >
            <Plus className="size-4" />
            {isCreating ? "Creating..." : "New Project"}
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="animate-entrance mt-20 text-center">
          <div
            className="mx-auto flex size-20 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.12)",
            }}
          >
            <Sparkles className="size-8 text-[var(--accent-gold)]" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">
            Start your first collection
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Create a project to begin designing jewelry.
          </p>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="btn-gold mt-6"
            style={{ height: 44 }}
          >
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="stagger-children mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.projectId}
              to={appRoutes.project(project.projectId)}
              className="group rounded-2xl border p-6 card-hover"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.08)",
                    border: "1px solid rgba(212,175,55,0.12)",
                    color: "var(--accent-gold)",
                  }}
                >
                  <FolderOpen className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
                    {project.description ?? "No description yet"}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">
                  {project.designCount} designs
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-gold)] opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight className="size-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
