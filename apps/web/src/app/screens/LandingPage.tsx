import { ArrowRight, Crown, Download, Sparkles, WandSparkles } from "lucide-react";
import { Link } from "react-router";

import { ImageWithFallback } from "@skygems/ui";

import { stubDesigns } from "../contracts/stubs";
import { appRoutes } from "../lib/routes";

const features = [
  {
    icon: Sparkles,
    title: "Prompt-to-pair generation",
    description:
      "Structured inputs compile into a polished sketch and render pair in one step.",
  },
  {
    icon: WandSparkles,
    title: "Design workspace",
    description:
      "Refine your chosen design and track it through specification to production.",
  },
  {
    icon: Download,
    title: "Production pipeline",
    description:
      "Spec, technical sheet, SVG, and CAD export — all in one project lane.",
  },
];

const steps = ["Create", "Preview", "Generate", "Select"];

export function LandingPage() {
  const heroDesign =
    Object.values(stubDesigns).find((d) => d.selectionState === "selected") ??
    Object.values(stubDesigns)[0];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Decorative glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(212,175,55,0.06), transparent 40%)",
        }}
      />

      {/* Nav */}
      <nav
        className="fixed top-0 z-50 w-full border-b bg-[rgba(10,10,10,0.85)] backdrop-blur-xl"
        style={{ borderColor: "var(--border-default)", height: 56 }}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent-gold)] text-[var(--text-inverse)]">
              <Crown className="size-4" />
            </div>
            <span className="text-base font-semibold text-[var(--text-primary)]">
              SkyGems
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={appRoutes.projects}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[rgba(212,175,55,0.24)]"
              style={{ borderColor: "var(--border-default)" }}
            >
              Open Studio
            </Link>
            <Link
              to={appRoutes.projects}
              className="btn-gold rounded-lg px-4 py-2 text-sm"
            >
              Start Designing
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-14">
        {/* Hero */}
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-[1200px] items-center gap-16 xl:grid-cols-2">
            <div className="animate-entrance space-y-8">
              <div className="space-y-4">
                <p className="eyebrow">Premium jewelry design studio</p>
                <h1 className="text-display max-w-lg">
                  Design jewelry with
                  <span className="block text-[var(--accent-gold)]">
                    AI precision
                  </span>
                </h1>
                <p className="max-w-md text-lg leading-8 text-[var(--text-secondary)]">
                  From concept sketch to manufacturing-ready CAD files, all in
                  one premium creative workflow.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={appRoutes.projects}
                  className="btn-gold inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm"
                >
                  <Sparkles className="size-4" />
                  Enter the studio
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Workflow steps */}
              <div className="flex gap-3">
                {steps.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{
                        borderColor: "rgba(212,175,55,0.16)",
                        backgroundColor: "rgba(212,175,55,0.06)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {step}
                    </div>
                    {i < steps.length - 1 && (
                      <ArrowRight className="size-3 text-[var(--text-muted)]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero pair preview */}
            {heroDesign && (
              <div
                className="animate-entrance relative overflow-hidden rounded-2xl border p-5"
                style={{
                  borderColor: "rgba(212,175,55,0.12)",
                  backgroundColor: "var(--bg-secondary)",
                  animationDelay: "150ms",
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Sketch", image: heroDesign.sketch },
                    { label: "Render", image: heroDesign.render },
                  ].map((panel) => (
                    <div
                      key={panel.label}
                      className="overflow-hidden rounded-xl border"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <ImageWithFallback
                        src={panel.image.url}
                        alt={panel.image.alt}
                        className="aspect-[4/5] w-full object-cover"
                      />
                      <div
                        className="px-3 py-2"
                        style={{
                          borderTop: "1px solid var(--border-default)",
                        }}
                      >
                        <p className="eyebrow">{panel.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {heroDesign.displayName}
                  </p>
                  <div className="flex gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: "rgba(212,175,55,0.08)",
                        color: "var(--accent-gold-light)",
                      }}
                    >
                      {heroDesign.designDna.metal}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: "rgba(212,175,55,0.08)",
                        color: "var(--accent-gold-light)",
                      }}
                    >
                      {heroDesign.designDna.style}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section
          className="border-t px-6 py-20"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center">
              <p className="eyebrow">Capabilities</p>
              <h2 className="mt-3 text-display">
                A premium studio,
                <span className="block text-[var(--accent-gold)]">
                  not a dashboard
                </span>
              </h2>
            </div>

            <div className="stagger-children mt-14 grid gap-6 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border p-6 card-hover"
                    style={{
                      borderColor: "var(--border-default)",
                      backgroundColor: "var(--bg-tertiary)",
                    }}
                  >
                    <div
                      className="flex size-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: "rgba(212,175,55,0.1)",
                        color: "var(--accent-gold)",
                      }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {f.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
