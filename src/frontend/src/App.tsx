import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { Layout } from "@/components/Layout";
import { SignInGate } from "@/components/SignInGate";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { EngagementDetailPage } from "@/pages/EngagementDetailPage";
import { EngagementsPage } from "@/pages/EngagementsPage";
import { TimesheetPage } from "@/pages/TimesheetPage";

const rootRoute = createRootRoute({
  component: () => (
    <SignInGate>
      <Layout>
        <Outlet />
      </Layout>
    </SignInGate>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients",
  validateSearch: (
    search: Record<string, unknown>,
  ): { search?: string; status?: string; industry?: string } => ({
    search: typeof search.search === "string" ? search.search : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    industry: typeof search.industry === "string" ? search.industry : undefined,
  }),
  component: ClientsPage,
});

const clientDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients/$clientId",
  component: ClientDetailPage,
});

const engagementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagements",
  validateSearch: (
    search: Record<string, unknown>,
  ): { search?: string; status?: string; clientId?: string } => ({
    search: typeof search.search === "string" ? search.search : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
  }),
  component: EngagementsPage,
});

const engagementDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagements/$engagementId",
  component: EngagementDetailPage,
});

const timesheetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/timesheet",
  validateSearch: (search: Record<string, unknown>): { week?: string } => ({
    week: typeof search.week === "string" ? search.week : undefined,
  }),
  component: TimesheetPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: AnalyticsPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  clientsRoute,
  clientDetailRoute,
  engagementsRoute,
  engagementDetailRoute,
  timesheetRoute,
  analyticsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
