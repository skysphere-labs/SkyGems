import { Navigate, createBrowserRouter } from "react-router";

import { AppShell } from "./layouts/AppShell";
import { ProjectLayout } from "./layouts/ProjectLayout";
import { CadScreen } from "./screens/CadScreen";
import { CreateRedirect } from "./screens/CreateRedirect";
import { CreateScreen } from "./screens/CreateScreen";
import { GalleryScreen } from "./screens/GalleryScreen";
import { GenerationScreen } from "./screens/GenerationScreen";
import { LandingPage } from "./screens/LandingPage";
import { ProjectHome } from "./screens/ProjectHome";
import { ProjectsIndex } from "./screens/ProjectsIndex";
import { SelectedDesignScreen } from "./screens/SelectedDesignScreen";
import { SpecScreen } from "./screens/SpecScreen";
import { SvgScreen } from "./screens/SvgScreen";
import { TechnicalSheetScreen } from "./screens/TechnicalSheetScreen";
import { WorkspaceResolver } from "./screens/WorkspaceResolver";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <WorkspaceResolver />,
      },
      {
        path: "create",
        element: <CreateRedirect />,
      },
      {
        path: "projects",
        element: <ProjectsIndex />,
      },
      {
        path: "projects/:projectId",
        element: <ProjectLayout />,
        children: [
          {
            index: true,
            element: <ProjectHome />,
          },
          {
            path: "create",
            element: <CreateScreen />,
          },
          {
            path: "generations/:generationId",
            element: <GenerationScreen />,
          },
          {
            path: "designs/:designId",
            element: <SelectedDesignScreen />,
          },
          {
            path: "designs/:designId/spec",
            element: <SpecScreen />,
          },
          {
            path: "designs/:designId/technical-sheet",
            element: <TechnicalSheetScreen />,
          },
          {
            path: "designs/:designId/svg",
            element: <SvgScreen />,
          },
          {
            path: "designs/:designId/cad",
            element: <CadScreen />,
          },
        ],
      },
      {
        path: "gallery",
        element: <GalleryScreen />,
      },
      {
        path: "*",
        element: <Navigate replace to="/app" />,
      },
    ],
  },
]);
