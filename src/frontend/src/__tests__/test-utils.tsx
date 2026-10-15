import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { Layout } from "@/components/Layout";
import { SignInGate } from "@/components/SignInGate";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { EngagementDetailPage } from "@/pages/EngagementDetailPage";
import { EngagementsPage } from "@/pages/EngagementsPage";
import { TimesheetPage } from "@/pages/TimesheetPage";

/**
 * The subset of the generated `Backend` actor the pages call. Tests provide a
 * typed partial and the harness fills the rest with rejecting stubs, so a page
 * that reaches for an unexpected method fails loudly instead of silently
 * returning `undefined`.
 */
export type ActorMock = Record<string, ReturnType<typeof vi.fn>>;

export function createActorMock(overrides: ActorMock = {}): ActorMock {
  const base: ActorMock = {
    listClients: vi.fn().mockResolvedValue([]),
    getClient: vi.fn().mockResolvedValue(null),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    listEngagements: vi.fn().mockResolvedValue([]),
    getEngagement: vi.fn().mockResolvedValue(null),
    createEngagement: vi.fn(),
    updateEngagement: vi.fn(),
    deleteEngagement: vi.fn(),
    listTimeEntries: vi.fn().mockResolvedValue([]),
    listWeekEntries: vi.fn().mockResolvedValue([]),
    createTimeEntry: vi.fn(),
    updateTimeEntry: vi.fn(),
    deleteTimeEntry: vi.fn(),
    setTimeEntryInvoiced: vi.fn(),
    getDashboardSummary: vi.fn().mockResolvedValue({
      totalRevenue: 0n,
      totalCost: 0n,
      grossMargin: 0n,
      totalHours: 0n,
      billableHours: 0n,
      utilizationPercent: 0n,
    }),
    getClientProfitability: vi.fn().mockResolvedValue([]),
    getEngagementProfitability: vi.fn().mockResolvedValue([]),
    getMonthlyTrend: vi.fn().mockResolvedValue([]),
    getUnbilledSummary: vi.fn().mockResolvedValue({
      unbilledHours: 0n,
      unbilledValue: 0n,
      entryCount: 0n,
    }),
    seedSampleData: vi.fn().mockResolvedValue(undefined),
  };
  return { ...base, ...overrides };
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

type RoutePath =
  | "/"
  | "/clients"
  | "/clients/$clientId"
  | "/engagements"
  | "/engagements/$engagementId"
  | "/timesheet"
  | "/analytics";

/**
 * Builds the same route tree as `App.tsx` but with a memory history so a test
 * can start at any route and assert on the resulting URL. The root route wraps
 * children in `SignInGate` and `Layout`, exactly as production does.
 */
export function createTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <SignInGate>
        <Layout>
          <Outlet />
        </Layout>
      </SignInGate>
    ),
  });

  const routes = [
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: DashboardPage,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/clients",
      validateSearch: (search: Record<string, unknown>) => ({
        search: typeof search.search === "string" ? search.search : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
        industry:
          typeof search.industry === "string" ? search.industry : undefined,
      }),
      component: ClientsPage,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/clients/$clientId",
      component: ClientDetailPage,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/engagements",
      validateSearch: (search: Record<string, unknown>) => ({
        search: typeof search.search === "string" ? search.search : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
        clientId:
          typeof search.clientId === "string" ? search.clientId : undefined,
      }),
      component: EngagementsPage,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/engagements/$engagementId",
      component: EngagementDetailPage,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/timesheet",
      validateSearch: (search: Record<string, unknown>) => ({
        week: typeof search.week === "string" ? search.week : undefined,
      }),
      component: TimesheetPage,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/analytics",
      component: AnalyticsPage,
    }),
  ];

  const routeTree = rootRoute.addChildren(routes);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

// `Outlet` is imported lazily to keep the import list above focused on pages.
import { Outlet } from "@tanstack/react-router";

export function renderRoute(
  initialPath: string,
  queryClient = createTestQueryClient(),
) {
  const router = createTestRouter(initialPath);
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...utils, router, queryClient };
}

export function renderWithProviders(
  ui: ReactNode,
  queryClient = createTestQueryClient(),
) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

export type { RoutePath };
