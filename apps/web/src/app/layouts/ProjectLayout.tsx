import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Link, Outlet, useLocation, useParams } from "react-router";

import { getProjectById, rememberLastActiveProject } from "../contracts/stubs";
import { appRoutes } from "../lib/routes";

function getBreadcrumbSuffix(pathname: string) {
  if (pathname.endsWith("/create")) return "Create";
  if (pathname.includes("/generations/")) return "Results";
  if (pathname.includes("/designs/")) {
    if (pathname.endsWith("/spec")) return "Specification";
    if (pathname.endsWith("/technical-sheet")) return "Technical Sheet";
    if (pathname.endsWith("/svg")) return "SVG Export";
    if (pathname.endsWith("/cad")) return "CAD Export";
    return "Workspace";
  }
  return null;
}

export function ProjectLayout() {
  const { projectId } = useParams();
  const location = useLocation();

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
      <div className="mx-auto max-w-[1200px] px-6 py-12 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          Project not found
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This project could not be loaded.
        </p>
        <Link
          to={appRoutes.projects}
          className="mt-4 inline-block text-sm font-medium text-[var(--accent-gold)]"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const breadcrumbSuffix = getBreadcrumbSuffix(location.pathname);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm">
        <Link
          to={appRoutes.projects}
          className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Home
        </Link>
        <ChevronRight className="size-3.5 text-[var(--text-muted)]" />
        <Link
          to={appRoutes.project(project.projectId)}
          className={
            breadcrumbSuffix
              ? "text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              : "font-medium text-[var(--text-primary)]"
          }
        >
          {project.name}
        </Link>
        {breadcrumbSuffix && (
          <>
            <ChevronRight className="size-3.5 text-[var(--text-muted)]" />
            <span className="font-medium text-[var(--text-primary)]">
              {breadcrumbSuffix}
            </span>
          </>
        )}
      </nav>

      <Outlet />
    </div>
  );
}
