import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  DashboardSummary,
  MonthlyTrendPoint,
  ProfitabilityRow,
} from "@/backend";

const identity = {
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
  login: vi.fn(),
  clear: vi.fn(),
};

const actor = {
  getDashboardSummary: vi.fn(),
  getMonthlyTrend: vi.fn().mockResolvedValue([]),
  getClientProfitability: vi.fn().mockResolvedValue([]),
  getEngagementProfitability: vi.fn().mockResolvedValue([]),
  getUnbilledSummary: vi.fn().mockResolvedValue({
    unbilledHours: 0n,
    unbilledValue: 0n,
    entryCount: 0n,
  }),
  seedSampleData: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => identity,
  useActor: () => ({ actor, isFetching: false }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import { renderRoute } from "./test-utils";

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    totalRevenue: 0n,
    totalCost: 0n,
    grossMargin: 0n,
    totalHours: 0n,
    billableHours: 0n,
    utilizationPercent: 0n,
    ...overrides,
  };
}

function row(overrides: Partial<ProfitabilityRow> = {}): ProfitabilityRow {
  return {
    id: 1n,
    name: "Acme Manufacturing",
    revenue: 0n,
    cost: 0n,
    margin: 0n,
    marginPercent: 0n,
    ...overrides,
  };
}

function trendPoint(
  overrides: Partial<MonthlyTrendPoint> = {},
): MonthlyTrendPoint {
  return {
    year: 2024n,
    month: 1n,
    revenue: 0n,
    hours: 0n,
    ...overrides,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    actor.getDashboardSummary.mockReset().mockResolvedValue(summary());
    actor.getClientProfitability.mockReset().mockResolvedValue([]);
    actor.getEngagementProfitability.mockReset().mockResolvedValue([]);
    actor.getMonthlyTrend.mockReset().mockResolvedValue([]);
    actor.getUnbilledSummary.mockReset().mockResolvedValue({
      unbilledHours: 0n,
      unbilledValue: 0n,
      entryCount: 0n,
    });
    actor.seedSampleData.mockReset().mockResolvedValue(undefined);
  });

  it("shows non-zero revenue, cost, and margin from seeded data", async () => {
    actor.getDashboardSummary.mockResolvedValue(
      summary({
        totalRevenue: 10_000n,
        totalCost: 4_000n,
        grossMargin: 6_000n,
        totalHours: 100n,
        billableHours: 80n,
        utilizationPercent: 80n,
      }),
    );
    actor.getClientProfitability.mockResolvedValue([
      row({
        id: 1n,
        name: "Acme Manufacturing",
        revenue: 10_000n,
        cost: 4_000n,
        margin: 6_000n,
        marginPercent: 60n,
      }),
    ]);

    renderRoute("/");

    // KPI cards are indexed 1..4: revenue, cost, margin, utilization.
    const revenueCard = await screen.findByTestId("dashboard.card.1");
    expect(within(revenueCard).getByText("$10,000")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("dashboard.card.2")).getByText("$4,000"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("dashboard.card.3")).getByText("$6,000"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("dashboard.card.4")).getByText("80%"),
    ).toBeInTheDocument();
  });

  it("ranks client profitability by margin", async () => {
    actor.getDashboardSummary.mockResolvedValue(
      summary({ totalRevenue: 1n, totalHours: 1n }),
    );
    actor.getClientProfitability.mockResolvedValue([
      row({ id: 1n, name: "Low Margin Co", margin: 100n, marginPercent: 10n }),
      row({ id: 2n, name: "High Margin Co", margin: 900n, marginPercent: 90n }),
    ]);

    renderRoute("/");

    const high = await screen.findByText("High Margin Co");
    const low = screen.getByText("Low Margin Co");
    // The higher-margin client must appear before the lower-margin one.
    expect(
      high.compareDocumentPosition(low) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("offers to seed sample data when the ledger is empty", async () => {
    const user = userEvent.setup();
    actor.getDashboardSummary.mockResolvedValue(summary());
    actor.getClientProfitability.mockResolvedValue([]);

    renderRoute("/");

    expect(
      await screen.findByText(/your ledger is empty/i),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("dashboard.seed_button"));

    await waitFor(() => {
      expect(actor.seedSampleData).toHaveBeenCalled();
    });
  });

  it("renders the 12-month trend from valid monthly points", async () => {
    actor.getDashboardSummary.mockResolvedValue(
      summary({ totalRevenue: 1n, totalHours: 1n }),
    );
    actor.getMonthlyTrend.mockResolvedValue([
      trendPoint({ year: 2024n, month: 1n, revenue: 5_000n, hours: 20n }),
      trendPoint({ year: 2024n, month: 2n, revenue: 7_000n, hours: 28n }),
    ]);

    renderRoute("/");

    const panel = await screen.findByTestId("dashboard.trend_panel");
    // The chart replaces the empty-state copy once trend points exist.
    await waitFor(() => {
      expect(
        within(panel).queryByText(/no logged time in the last 12 months/i),
      ).not.toBeInTheDocument();
    });
    expect(
      panel.querySelector(".recharts-responsive-container"),
    ).not.toBeNull();
  });

  it("drops trend points with an invalid month instead of crashing", async () => {
    actor.getDashboardSummary.mockResolvedValue(
      summary({ totalRevenue: 1n, totalHours: 1n }),
    );
    // A malformed backend point (month 0 / 13) must be filtered out rather than
    // reaching date-fns `format`, which would throw `RangeError`.
    actor.getMonthlyTrend.mockResolvedValue([
      trendPoint({ year: 2024n, month: 0n, revenue: 1n, hours: 1n }),
      trendPoint({ year: 2024n, month: 13n, revenue: 1n, hours: 1n }),
    ]);

    renderRoute("/");

    // The dashboard still renders its KPIs and falls back to the empty trend
    // message, proving the invalid points were discarded without an exception.
    expect(await screen.findByTestId("dashboard.card.1")).toBeInTheDocument();
    const panel = screen.getByTestId("dashboard.trend_panel");
    expect(
      within(panel).getByText(/no logged time in the last 12 months/i),
    ).toBeInTheDocument();
  });
});
