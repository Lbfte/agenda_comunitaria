import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Dashboard } from "./components/Dashboard";
import { Tasks } from "./components/Tasks";
import { StudyHub } from "./components/StudyHub";
import { Social } from "./components/Social";
import { History } from "./components/History";
import { AuthCallback } from "./components/AuthCallback";
import { AdminRequests } from "./components/AdminRequests";
import { Turmas } from "./components/Turmas";

export const router = createBrowserRouter([
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "tasks", Component: Tasks },
      { path: "study", Component: StudyHub },
      { path: "social", Component: Social },
      { path: "history", Component: History },
      { path: "admin/requests", Component: AdminRequests },
      { path: "turmas", Component: Turmas },
    ],
  },
]);
