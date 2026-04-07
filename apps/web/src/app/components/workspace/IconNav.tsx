import {
  Crown,
  Download,
  FolderOpen,
  Grid2X2,
  Layers,
  Sparkles,
} from "lucide-react";

export type TabId = "create" | "gallery" | "projects" | "pipeline" | "export";

const tabs: { id: TabId; icon: typeof Sparkles; label: string }[] = [
  { id: "create", icon: Sparkles, label: "Create" },
  { id: "gallery", icon: Grid2X2, label: "Gallery" },
  { id: "projects", icon: FolderOpen, label: "Projects" },
  { id: "pipeline", icon: Layers, label: "Pipeline" },
  { id: "export", icon: Download, label: "Export" },
];

interface IconNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function IconNav({ activeTab, onTabChange }: IconNavProps) {
  return (
    <nav
      className="flex h-full w-[60px] flex-col items-center py-3"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      {/* SkyGems logo */}
      <div
        className="mb-4 flex size-8 items-center justify-center rounded-lg"
        style={{ background: "var(--sg-gradient)" }}
        title="SkyGems"
      >
        <Crown className="size-4 text-white" />
      </div>

      {/* Nav icons */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              className="group relative flex size-[44px] items-center justify-center rounded-lg transition-colors"
              style={{
                backgroundColor: isActive
                  ? "var(--accent-gold-glow)"
                  : "transparent",
                color: isActive
                  ? "var(--accent-gold)"
                  : "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon className="size-5" />

              {/* Tooltip */}
              <span
                className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* User avatar at bottom */}
      <div
        className="mt-auto flex size-8 items-center justify-center rounded-full text-xs font-semibold"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-default)",
        }}
        title="Account"
      >
        S
      </div>
    </nav>
  );
}
