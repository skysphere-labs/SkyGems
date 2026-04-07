import { Crown, GalleryVerticalEnd, Home } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";

import { appRoutes } from "../lib/routes";

const NAV_ITEMS = [
  { label: "Home", to: appRoutes.projects, icon: Home },
  { label: "Gallery", to: appRoutes.gallery, icon: GalleryVerticalEnd },
];

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header
        className="fixed top-0 z-50 w-full border-b bg-[var(--bg-secondary)]"
        style={{ borderColor: "var(--border-default)", height: 56 }}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
          <NavLink
            to={appRoutes.projects}
            className="flex items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent-gold)] text-[var(--text-inverse)]">
              <Crown className="size-4" />
            </div>
            <span className="text-base font-semibold text-[var(--text-primary)]">
              SkyGems
            </span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                location.pathname.startsWith(item.to + "/");
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: isActive
                      ? "var(--accent-gold)"
                      : "var(--text-secondary)",
                  }}
                >
                  <Icon className="size-4" />
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                      style={{ backgroundColor: "var(--accent-gold)" }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-xs font-medium text-[var(--text-secondary)]">
            S
          </div>
        </div>
      </header>

      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}
