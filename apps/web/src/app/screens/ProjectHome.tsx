import { useEffect, useState } from "react";
import { ArrowRight, FolderClock, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

import {
  fetchProject,
  fetchProjectDesigns,
  fetchProjectGenerations,
  fetchSelectedDesign,
} from "../contracts/api";
import type { Design, Generation, ProjectWorkspace } from "../contracts/types";
import { SelectionSummaryPanel } from "../components/status/SelectionSummaryPanel";
import { appRoutes } from "../lib/routes";

export function ProjectHome() {
  const { projectId } = useParams();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [project, setProject] = useState<ProjectWorkspace | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    fetchProject(projectId).then(setProject);
    fetchSelectedDesign(projectId).then(setSelectedDesign);
    fetchProjectDesigns(projectId).then(setDesigns);
    fetchProjectGenerations(projectId).then(setGenerations);
  }, [projectId]);

  if (!projectId || !project) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-10 text-center text-[var(--text-secondary)]">
          Loading project workspace...
        </CardContent>
      </Card>
    );
  }

  const latestGeneration = generations[0] ?? null;

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">Project Workspace Home</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              {project.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Resume the current creation lane, inspect the selected design, or
              jump directly into the latest generation session.
            </p>
          </div>
          <Button asChild>
            <Link to={appRoutes.create(projectId)}>
              <Sparkles className="size-4" />
              Resume Create
            </Link>
          </Button>
        </CardContent>
      </Card>

      {selectedDesign ? (
        <SelectionSummaryPanel design={selectedDesign} />
      ) : (
        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              No selected design yet
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Start from Create or resume the latest generation to choose the active pair.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild>
                <Link to={appRoutes.create(projectId)}>Open Create</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--text-primary)]">
              Recent generations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestGeneration ? (
              generations.slice(0, 3).map((generation) => (
                <div
                  key={generation.id}
                  className="rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {generation.requestKind === "refine" ? "Refine" : "Create"} generation
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {generation.message}
                  </p>
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link to={appRoutes.generation(projectId, generation.id)}>
                        Open Generation
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                No generations available yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/6 bg-[var(--bg-secondary)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--text-primary)]">
              Recent designs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {designs.slice(0, 3).map((design) => (
              <div
                key={design.id}
                className="rounded-2xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {design.displayName}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {design.promptSummary}
                    </p>
                  </div>
                  <FolderClock className="mt-0.5 size-4 text-[var(--accent-gold)]" />
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link to={appRoutes.design(projectId, design.id)}>
                      Open Design
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
