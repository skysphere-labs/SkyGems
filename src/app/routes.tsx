import React from 'react';
import { createBrowserRouter } from "react-router";
import { LandingPage } from "./screens/LandingPage";
import { LoginScreen } from "./screens/LoginScreen";
import { Dashboard } from "./screens/Dashboard";
import { DesignStudio } from "./screens/DesignStudio";
import { DesignGallery } from "./screens/DesignGallery";
import { DesignPreview } from "./screens/DesignPreview";
import { AICoPilot } from "./screens/AICoPilot";
import { CADExport } from "./screens/CADExport";
import { JewelryVariationsPage } from "../pages/JewelryVariationsPage";
import { AuthenticatedAppShell } from "./components/auth/AuthenticatedAppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/app",
    element: <AuthenticatedAppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "create", element: <DesignStudio /> },
      { path: "gallery", element: <DesignGallery /> },
      { path: "preview/:id", element: <DesignPreview /> },
      { path: "copilot", element: <AICoPilot /> },
      { path: "export", element: <CADExport /> },
      { path: "variations", element: <JewelryVariationsPage /> },
    ],
  },
]);
