import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, ImageWithFallback } from "@skygems/ui";

import {
  fetchProject,
  fetchProjectDesigns,
  fetchProjectGenerations,
  fetchSelectedDesign,
} from "../contracts/api";
import type { Design, Generation, ProjectWorkspace } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function ProjectHome() {
  const { projectId } = useParams();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [project, setProject] = useState<ProjectWorkspace | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);

  useEffect(() => {
    if (!projectId) return;
    fetchProject(projectId).then(setProject);
    fetchSelectedDesign(projectId).then(setSelectedDesign);
    fetchProjectDesigns(projectId).then(setDesigns);
    fetchProjectGenerations(projectId).then(setGenerations);
  }, [projectId]);

  if (!projectId || !project) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Loading project...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-entrance space-y-10">
      {/* Project header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {project.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {project.description ?? "No description yet"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {project.designCount} designs
          </p>
        </div>
        <Button asChild className="btn-gold" style={{ height: 44 }}>
          <Link to={appRoutes.create(projectId)}>
            <Sparkles className="size-4" />
            New Design
          </Link>
        </Button>
      </div>

      {/* Selected design hero */}
      {selectedDesign ? (
        <div>
          <p className="eyebrow mb-4">Selected Design</p>
          <Link
            to={appRoutes.design(projectId, selectedDesign.id)}
            className="group block overflow-hidden rounded-2xl border transition-all card-hover"
            style={{
              borderColor: "rgba(212,175,55,0.12)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_1fr]">
              <div
                className="overflow-hidden rounded-xl"
                style={{ border: "1px solid var(--border-default)" }}
              >
                <ImageWithFallback
                  src={selectedDesign.sketch.url}
                  alt={selectedDesign.sketch.alt}
                  className="aspect-[4/3] w-full object-cover img-hover-zoom"
                />
              </div>
              <div
                className="overflow-hidden rounded-xl"
                style={{ border: "1px solid var(--border-default)" }}
              >
                <ImageWithFallback
                  src={selectedDesign.render.url}
                  alt={selectedDesign.render.alt}
                  className="aspect-[4/3] w-full object-cover img-hover-zoom"
                />
              </div>
              <div className="flex flex-col justify-center p-2">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {selectedDesign.displayName}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {selectedDesign.promptSummary}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    selectedDesign.designDna.jewelryType,
                    selectedDesign.designDna.metal,
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: "rgba(212,175,55,0.06)",
                        color: "var(--accent-gold-light)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="mt-4 flex items-center gap-1 text-sm font-medium text-[var(--accent-gold)]">
                  Open workspace <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl border py-14 text-center"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <Sparkles
            className="mx-auto size-10 text-[var(--accent-gold)]"
            style={{ opacity: 0.4 }}
          />
          <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
            No selected design yet
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Generate a design pair and select your favorite.
          </p>
          <Button asChild className="btn-gold mt-5" style={{ height: 44 }}>
            <Link to={appRoutes.create(projectId)}>Start Creating</Link>
          </Button>
        </div>
      )}

      {/* Recent activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent generations */}
        <div>
          <p className="eyebrow mb-4">Recent Generations</p>
          {generations.length > 0 ? (
            <div className="stagger-children space-y-3">
              {generations.slice(0, 3).map((gen) => (
                <Link
                  key={gen.id}
                  to={appRoutes.generation(projectId, gen.id)}
                  className="block rounded-xl border p-4 card-hover"
                  style={{
                    borderColor: "var(--border-default)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {gen.requestKind === "refine"
                        ? "Refinement"
                        : "Generation"}
                    </p>
                    <span
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor:
                          gen.readyPairs > 0
                            ? "rgba(76,175,80,0.1)"
                            : "rgba(255,255,255,0.04)",
                        color:
                          gen.readyPairs > 0
                            ? "var(--status-success)"
                            : "var(--text-muted)",
                      }}
                    >
                      {gen.readyPairs}/{gen.totalPairs} ready
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-1">
                    {gen.message}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No generations yet.
            </p>
          )}
        </div>

        {/* Designs */}
        <div>
          <p className="eyebrow mb-4">Designs</p>
          {designs.length > 0 ? (
            <div className="stagger-children space-y-3">
              {designs.slice(0, 3).map((design) => (
                <Link
                  key={design.id}
                  to={appRoutes.design(projectId, design.id)}
                  className="flex items-center gap-4 rounded-xl border p-4 card-hover"
                  style={{
                    borderColor: "var(--border-default)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  {/* Design thumbnail */}
                  <div
                    className="size-12 shrink-0 overflow-hidden rounded-lg"
                    style={{ border: "1px solid var(--border-default)" }}
                  >
                    <ImageWithFallback
                      src={design.render.url}
                      alt={design.render.alt}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {design.displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-1">
                      {design.promptSummary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No designs yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
