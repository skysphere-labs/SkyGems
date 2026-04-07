import { useEffect } from "react";
import { ArrowRight, FolderKanban, Sparkles } from "lucide-react";
import { Link, Outlet, useLocation, useParams } from "react-router";

import { Button, Card, CardContent } from "@skygems/ui";

import { ProjectSwitcher } from "../components/ProjectSwitcher";
import { FlowStepRail } from "../components/status/FlowStepRail";
import { getProjectFlowSteps, getProjectById, rememberLastActiveProject, stubProjects } from "../contracts/stubs";
import { appRoutes } from "../lib/routes";

export function ProjectLayout() {
  const location = useLocation();
  const { designId, generationId, projectId } = useParams();

  if (!projectId) {
    return null;
  }

  const project = getProjectById(projectId);

  useEffect(() => {
    if (projectId && project) {
      rememberLastActiveProject(projectId);
    }
  }, [project, projectId]);

  if (!project) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            Project not found
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            The current route does not map to a known workspace.
          </p>
          <Button asChild>
            <Link to={appRoutes.projects}>Back to Projects</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const steps = getProjectFlowSteps(
    projectId,
    location.pathname,
    designId,
    generationId,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <aside className="space-y-6">
        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <p className="eyebrow">Project Workspace</p>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {project.name}
              </h1>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {project.description ?? "No project description yet."}
              </p>
            </div>

            <ProjectSwitcher projects={stubProjects} activeProjectId={project.projectId} />

            <div className="grid gap-3 rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Designs</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {project.designCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Updated</span>
                <span className="text-right text-[var(--text-primary)]">
                  {project.updatedAt}
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <Button asChild>
                <Link to={appRoutes.create(project.projectId)}>
                  <Sparkles className="size-4" />
                  Resume Create
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={appRoutes.project(project.projectId)}>
                  <FolderKanban className="size-4" />
                  Project Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <FlowStepRail steps={steps} />
      </aside>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/6 bg-[var(--bg-secondary)] px-5 py-4">
          <div>
            <p className="eyebrow">Current Context</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Stay inside the active project lane while moving from create through
              selection, specification, and CAD.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to={appRoutes.gallery}>
              Open Gallery
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
