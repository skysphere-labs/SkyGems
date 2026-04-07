import { useEffect, useState } from "react";
import { ArrowRight, FolderOpen, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

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
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">Projects Index</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Active workspaces
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Open a project, resume the current create lane, or start a fresh
              direction with the same premium workspace shell.
            </p>
          </div>
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="size-4" />
            {isCreating ? "Creating..." : "Create Project"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.projectId} className="border-white/6 bg-[var(--bg-secondary)]">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.12)] text-[var(--accent-gold)]">
                    <FolderOpen className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[var(--text-primary)]">
                      {project.name}
                    </CardTitle>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {project.description ?? "No project description yet."}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-white/6 px-3 py-1 text-xs text-[var(--text-secondary)]">
                  {project.designCount} designs
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Created
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">
                    {project.createdAt}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Updated
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">
                    {project.updatedAt}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={appRoutes.project(project.projectId)}>
                    Open Workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={appRoutes.create(project.projectId)}>Go to Create</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
