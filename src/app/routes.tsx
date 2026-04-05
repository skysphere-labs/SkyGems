import { createBrowserRouter } from "react-router";
import { LandingPage } from "./screens/LandingPage";
import { Dashboard } from "./screens/Dashboard";
import { DesignGenerator } from "./screens/DesignGenerator";
import { DesignGallery } from "./screens/DesignGallery";
import { DesignPreview } from "./screens/DesignPreview";
import { AICoPilot } from "./screens/AICoPilot";
import { CADExport } from "./screens/CADExport";
import { RootLayout } from "./layouts/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/app",
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "create", element: <DesignGenerator /> },
      { path: "gallery", element: <DesignGallery /> },
      { path: "preview/:id", element: <DesignPreview /> },
      { path: "copilot", element: <AICoPilot /> },
      { path: "export", element: <CADExport /> },
    ],
  },
]);
