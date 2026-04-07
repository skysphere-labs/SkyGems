import { Crown, GalleryVerticalEnd, Layers3, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router";

import { appRoutes } from "../lib/routes";

const PRIMARY_NAV = [
  { label: "Projects", to: appRoutes.projects, icon: Layers3 },
  { label: "Create", to: appRoutes.createRedirect, icon: Sparkles },
  { label: "Gallery", to: appRoutes.gallery, icon: GalleryVerticalEnd },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-40 border-b border-white/6 bg-[rgba(7,9,15,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d4af37_0%,#8b6b1d_100%)] text-black shadow-[0_10px_30px_rgba(212,175,55,0.25)]">
              <Crown className="size-5" />
            </div>
            <div>
              <p className="eyebrow">SkyGems</p>
              <p className="text-base font-semibold text-[var(--text-primary)]">
                Jewelry Design Studio
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-[rgba(212,175,55,0.26)] bg-[rgba(212,175,55,0.1)] text-[var(--accent-gold)]"
                        : "border-white/6 bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    ].join(" ")
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
