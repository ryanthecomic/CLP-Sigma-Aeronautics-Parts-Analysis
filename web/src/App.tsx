import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import type { RouteObject } from "react-router";
import { AppErrorBoundary } from "./components/feedback/AppErrorBoundary";
import { ModuleErrorBoundary } from "./components/feedback/ModuleErrorBoundary";
import { DevLayout } from "./features/dev/DevLayout";
import { DocsPage } from "./features/dev/DocsPage";
import { FlagsPage } from "./features/dev/FlagsPage";
import { LogsPage } from "./features/dev/LogsPage";
import { ModuleHub } from "./features/dev/ModuleHub";
import { ModuleSandboxPage } from "./features/dev/ModuleSandboxPage";
import { PipelinePage } from "./features/dev/PipelinePage";
import { StatePage } from "./features/dev/StatePage";
import { NotFound } from "./features/NotFound";
import { OperatorPreview } from "./features/operator/OperatorPreview";

export const routes: RouteObject[] = [
  {
    errorElement: <AppErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dev" replace /> },
      {
        path: "dev",
        element: <DevLayout />,
        children: [
          { index: true, element: <ModuleHub /> },
          {
            path: "modulo/:id",
            element: <ModuleSandboxPage />,
            errorElement: <ModuleErrorBoundary />,
          },
          { path: "pipeline", element: <PipelinePage /> },
          { path: "estado", element: <StatePage /> },
          { path: "logs", element: <LogsPage /> },
          { path: "flags", element: <FlagsPage /> },
          { path: "docs", element: <DocsPage /> },
        ],
      },
      { path: "operador", element: <OperatorPreview /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export function App() {
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
}

