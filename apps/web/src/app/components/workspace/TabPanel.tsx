import { CreateTab } from "./tabs/CreateTab";
import { ExportTab } from "./tabs/ExportTab";
import { GalleryTab } from "./tabs/GalleryTab";
import { PipelineTab } from "./tabs/PipelineTab";
import { ProjectsTab } from "./tabs/ProjectsTab";

type TabId = "create" | "gallery" | "projects" | "pipeline" | "export";

const TAB_COMPONENTS: Record<TabId, React.ComponentType<any>> = {
  create: CreateTab,
  gallery: GalleryTab,
  projects: ProjectsTab,
  pipeline: PipelineTab,
  export: ExportTab,
};

export function TabPanel({
  activeTab,
  ...props
}: {
  activeTab: TabId;
  [key: string]: any;
}) {
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div
      className="flex w-[300px] shrink-0 flex-col overflow-hidden border-r"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-default)",
      }}
    >
      {ActiveComponent && <ActiveComponent {...props} />}
    </div>
  );
}
