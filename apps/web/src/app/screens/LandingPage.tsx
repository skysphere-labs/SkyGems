import {
  ArrowRight,
  Crown,
  Download,
  Gem,
  Play,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router";

import { ImageWithFallback } from "@skygems/ui";

import { stubDesigns } from "../contracts/stubs";
import { appRoutes } from "../lib/routes";

const featureCards = [
  {
    icon: Sparkles,
    title: "Prompt-to-pair generation",
    description:
      "Structured create inputs compile into a polished sketch/render pair flow instead of a detached prompt box.",
  },
  {
    icon: WandSparkles,
    title: "Selected design control room",
    description:
      "Refine within the chosen design workspace and keep downstream stages aligned to the active hero direction.",
  },
  {
    icon: Download,
    title: "Production surfaces",
    description:
      "Spec, technical sheet, SVG, and CAD handoff all stay in the same project-scoped pipeline.",
  },
];

const workflowSteps = [
  "Create",
  "Prompt Preview",
  "Generate",
  "Select",
  "Spec",
  "CAD",
];

export function LandingPage() {
  const heroDesign =
    Object.values(stubDesigns).find((design) => design.selectionState === "selected") ??
    Object.values(stubDesigns)[0];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(212,175,55,0.12), transparent 34%), radial-gradient(circle at 85% 18%, rgba(212,175,55,0.08), transparent 28%)",
        }}
      />

      <nav className="sticky top-0 z-50 border-b border-white/6 bg-[rgba(10,10,10,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-2xl"
              style={{
                background: "var(--sg-gradient)",
                color: "var(--text-inverse)",
              }}
            >
              <Crown className="size-5" />
            </div>
            <div>
              <p className="eyebrow">SkyGems</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Luxury jewelry design studio
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#capabilities"
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Workflow
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={appRoutes.projects}
              className="rounded-full border border-white/8 px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[rgba(212,175,55,0.24)] hover:text-[var(--accent-gold)]"
            >
              Open Studio
            </Link>
            <Link
              to={appRoutes.projects}
              className="rounded-full px-4 py-2 text-sm font-semibold shadow-[0_18px_48px_rgba(212,175,55,0.2)]"
              style={{
                background: "var(--sg-gradient)",
                color: "var(--text-inverse)",
              }}
            >
              Start Designing
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative">
        <section className="px-6 pb-20 pt-20">
          <div className="mx-auto grid max-w-7xl gap-14 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="eyebrow">OpenArt-grade creative tooling for jewelry teams</div>
                <h1 className="text-display max-w-3xl">
                  Design jewelry with a
                  <span className="block text-[var(--accent-gold)]">
                    dark-luxury creative workflow
                  </span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
                  SkyGems keeps prompt preview, hero-pair review, and downstream
                  production surfaces inside one premium project lane instead of
                  scattering them across generic dashboards.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={appRoutes.projects}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-[0_20px_54px_rgba(212,175,55,0.24)]"
                  style={{
                    background: "var(--sg-gradient)",
                    color: "var(--text-inverse)",
                  }}
                >
                  <Sparkles className="size-4" />
                  Enter the studio
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#workflow"
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[rgba(255,255,255,0.03)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[rgba(212,175,55,0.24)] hover:text-[var(--accent-gold)]"
                >
                  <Play className="size-4" />
                  See the workflow
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Pair-first review", "Sketch and render stay side by side"],
                  ["Project-scoped routes", "No detached preview route drift"],
                  ["Gold-on-dark identity", "Premium visual system restored"],
                ].map(([title, detail]) => (
                  <div
                    key={title}
                    className="rounded-[28px] border border-white/6 bg-[rgba(255,255,255,0.03)] p-5"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute -right-8 -top-10 size-44 rounded-full blur-3xl"
                style={{ backgroundColor: "rgba(212,175,55,0.14)" }}
              />
              <div className="relative overflow-hidden rounded-[36px] border border-[rgba(212,175,55,0.16)] bg-[linear-gradient(180deg,rgba(212,175,55,0.12)_0%,rgba(17,17,17,1)_28%,rgba(10,10,10,1)_100%)] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.32)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Hero Pair Preview</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {heroDesign?.displayName ?? "Selected direction"}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                      Review the chosen sketch and render as a single, premium surface
                      before moving into specification and CAD work.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                      {heroDesign?.designDna.metal ?? "gold"}
                    </span>
                    <span className="rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                      {heroDesign?.designDna.style ?? "contemporary"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {heroDesign ? (
                    [
                      {
                        label: "Sketch plate",
                        image: heroDesign.sketch.url,
                        alt: heroDesign.sketch.alt,
                      },
                      {
                        label: "Luxury render",
                        image: heroDesign.render.url,
                        alt: heroDesign.render.alt,
                      },
                    ].map((panel) => (
                      <div
                        key={panel.label}
                        className="overflow-hidden rounded-[28px] border border-white/6 bg-[var(--bg-primary)]"
                      >
                        <ImageWithFallback
                          src={panel.image}
                          alt={panel.alt}
                          className="aspect-[4/5] h-full w-full object-cover"
                        />
                        <div className="border-t border-white/6 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent-gold-light)]">
                            {panel.label}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 rounded-[28px] border border-white/6 bg-[rgba(255,255,255,0.03)] p-10 text-center text-[var(--text-secondary)]">
                      Hero pair preview unavailable.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="border-t border-white/6 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="eyebrow">Capabilities</p>
              <h2 className="mt-3 text-display">
                A premium jewelry studio,
                <span className="block text-[var(--accent-gold)]">
                  not a generic admin dashboard
                </span>
              </h2>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-[28px] border border-white/6 bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: "rgba(212,175,55,0.14)",
                        color: "var(--accent-gold)",
                      }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-t border-white/6 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Workflow</p>
                <h2 className="mt-3 text-display">
                  A project lane that keeps
                  <span className="block text-[var(--accent-gold)]">
                    creative momentum intact
                  </span>
                </h2>
              </div>
              <Link
                to={appRoutes.projects}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[rgba(212,175,55,0.24)] hover:text-[var(--accent-gold)]"
              >
                Open the live workspace
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-6">
              {workflowSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[26px] border border-white/6 bg-[rgba(255,255,255,0.03)] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-gold-light)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Gem className="size-4 text-[var(--accent-gold)]" />
                  </div>
                  <p className="mt-6 text-base font-semibold text-[var(--text-primary)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
