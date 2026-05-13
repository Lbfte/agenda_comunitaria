import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Dashboard } from "./components/Dashboard";
import { Tasks } from "./components/Tasks";
import { StudyHub } from "./components/StudyHub";
import { Social } from "./components/Social";
import { History } from "./components/History";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "tasks", Component: Tasks },
      { path: "study", Component: StudyHub },
      { path: "social", Component: Social },
      { path: "history", Component: History },
    ],
  },
]);
