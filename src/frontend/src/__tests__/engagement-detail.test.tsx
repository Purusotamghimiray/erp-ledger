import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Client, Engagement, TimeEntry } from "@/backend";
import { BillingModel, ClientStatus, EngagementStatus } from "@/backend";

const identity = {
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
  login: vi.fn(),
  clear: vi.fn(),
};

const actor = {
  getEngagement: vi.fn(),
  listClients: vi.fn().mockResolvedValue([]),
  listTimeEntries: vi.fn().mockResolvedValue([]),
  updateEngagement: vi.fn(),
  deleteEngagement: vi.fn(),
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => identity,
  useActor: () => ({ actor, isFetching: false }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import { renderRoute } from "./test-utils";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 1n,
    status: ClientStatus.active,
    owner: {} as Client["owner"],
    name: "Acme Manufacturing",
    createdAt: 1_700_000_000_000_000_000n,
    contactPerson: "Dana Whitfield",
    email: "dana@acme.example",
    industry: "Manufacturing",
    ...overrides,
  };
}

function makeEngagement(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: 7n,
    status: EngagementStatus.active,
    clientId: 1n,
    costRate: 100n,
    owner: {} as Engagement["owner"],
    billingModel: BillingModel.hourly,
    billableRate: 200n,
    name: "ERP Rollout",
    createdAt: 1_700_000_000_000_000_000n,
    scope: "Migrate finance modules to the new ERP.",
    startDate: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 1n,
    engagementId: 7n,
    hours: 10n,
    owner: {} as TimeEntry["owner"],
    date: 1_700_000_000_000_000_000n,
    createdAt: 1_700_000_000_000_000_000n,
    description: "Discovery workshops",
    billable: true,
    invoiced: false,
    ...overrides,
  };
}

describe("EngagementDetailPage", () => {
  beforeEach(() => {
    actor.getEngagement.mockReset().mockResolvedValue(makeEngagement());
    actor.listClients.mockReset().mockResolvedValue([makeClient()]);
    actor.listTimeEntries.mockReset().mockResolvedValue([]);
    actor.updateEngagement.mockReset();
    actor.deleteEngagement.mockReset();
  });

  it("computes revenue as billable hours multiplied by the engagement rate", async () => {
    // 10 billable hours @ $200/h = $2,000 revenue; 15 total hours @ $100/h = $1,500 cost.
    actor.listTimeEntries.mockResolvedValue([
      makeEntry({ id: 1n, hours: 10n, billable: true }),
      makeEntry({
        id: 2n,
        hours: 5n,
        billable: false,
        description: "Internal review",
      }),
    ]);

    renderRoute("/engagements/7");

    const revenue = await screen.findByTestId("dashboard.card.1");
    expect(within(revenue).getByText("$2,000")).toBeInTheDocument();

    const cost = screen.getByTestId("dashboard.card.2");
    expect(within(cost).getByText("$1,500")).toBeInTheDocument();

    const margin = screen.getByTestId("dashboard.card.3");
    expect(within(margin).getByText("$500")).toBeInTheDocument();
  });

  it("excludes non-billable hours from revenue but keeps them in cost", async () => {
    actor.listTimeEntries.mockResolvedValue([
      makeEntry({ id: 1n, hours: 4n, billable: false, description: "Admin" }),
    ]);

    renderRoute("/engagements/7");

    const revenue = await screen.findByTestId("dashboard.card.1");
    expect(within(revenue).getByText("$0")).toBeInTheDocument();

    const cost = screen.getByTestId("dashboard.card.2");
    expect(within(cost).getByText("$400")).toBeInTheDocument();
  });

  it("lists logged time entries with billable and invoiced state", async () => {
    actor.listTimeEntries.mockResolvedValue([
      makeEntry({
        id: 1n,
        hours: 8n,
        billable: true,
        invoiced: true,
        description: "Build phase",
      }),
      makeEntry({
        id: 2n,
        hours: 2n,
        billable: false,
        invoiced: false,
        description: "Standup",
      }),
    ]);

    renderRoute("/engagements/7");

    const table = await screen.findByTestId("engagement.entries_table");
    expect(within(table).getByText("Build phase")).toBeInTheDocument();
    expect(within(table).getByText("Standup")).toBeInTheDocument();

    // "Invoiced"/"Unbilled" also appear as column headers, so assert on the rows.
    const invoicedRow = screen.getByTestId("engagement.entry_row.1");
    expect(within(invoicedRow).getByText("Invoiced")).toBeInTheDocument();
    expect(within(invoicedRow).getByText("Billable")).toBeInTheDocument();

    const unbilledRow = screen.getByTestId("engagement.entry_row.2");
    expect(within(unbilledRow).getByText("Unbilled")).toBeInTheDocument();
    expect(within(unbilledRow).getByText("Non-billable")).toBeInTheDocument();
  });

  it("shows the billing terms including both rates", async () => {
    renderRoute("/engagements/7");

    const terms = await screen.findByTestId("engagement.terms_panel");
    expect(within(terms).getByText("$200/h")).toBeInTheDocument();
    expect(within(terms).getByText("$100/h")).toBeInTheDocument();
  });
});
