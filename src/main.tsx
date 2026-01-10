import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import DashboardPage from "./app/dashboard/page.tsx";
import ChartsPage from "./app/charts/page.tsx";
import LogsPage from "./app/logs/page.tsx";
import DocsPage from "./app/docs/page.tsx";
import FaultHistoryPage from "./app/fault-history/page.tsx";
import SettingsPage from "./app/settings/page.tsx";
import RelayControlsPage from "./app/relay-controls/page.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "charts",
        element: <ChartsPage />,
      },
      {
        path: "logs",
        element: <LogsPage />,
      },
      {
        path: "docs",
        element: <DocsPage />,
      },
      {
        path: "fault-history",
        element: <FaultHistoryPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "relay-controls",
        element: <RelayControlsPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);