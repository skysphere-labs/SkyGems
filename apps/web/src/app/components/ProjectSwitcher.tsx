import { useNavigate } from "react-router";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@skygems/ui";

import type { ProjectWorkspace } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function ProjectSwitcher({
  projects,
  activeProjectId,
}: {
  projects: ProjectWorkspace[];
  activeProjectId?: string | null;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
        Active Project
      </p>
      <Select
        value={activeProjectId ?? ""}
        onValueChange={(projectId) => navigate(appRoutes.project(projectId))}
      >
        <SelectTrigger className="border-white/6 bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
          <SelectValue placeholder="Choose a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.projectId} value={project.projectId}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
