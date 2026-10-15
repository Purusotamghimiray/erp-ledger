import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Engagement, TimeEntry } from "@/backend";
import { BillingModel, EngagementStatus } from "@/backend";

const identity = {
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
  login: vi.fn(),
  clear: vi.fn(),
};

const actor = {
  listWeekEntries: vi.fn(),
  listEngagements: vi.fn().mockResolvedValue([]),
  createTimeEntry: vi.fn(),
  updateTimeEntry: vi.fn(),
  deleteTimeEntry: vi.fn(),
  setTimeEntryInvoiced: vi.fn(),
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => identity,
  useActor: () => ({ actor, isFetching: false }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import { renderRoute } from "./test-utils";

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
    scope: "Migrate finance modules.",
    startDate: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 1n,
    engagementId: 7n,
    hours: 8n,
    owner: {} as TimeEntry["owner"],
    date: 1_700_000_000_000_000_000n,
    createdAt: 1_700_000_000_000_000_000n,
    description: "Discovery workshops",
    billable: true,
    invoiced: false,
    ...overrides,
  };
}

// A fixed week so the page's week window is deterministic.
const WEEK = "2023-11-13";

describe("TimesheetPage", () => {
  beforeEach(() => {
    actor.listWeekEntries.mockReset().mockResolvedValue([]);
    actor.listEngagements.mockReset().mockResolvedValue([makeEngagement()]);
    actor.createTimeEntry.mockReset();
    actor.updateTimeEntry.mockReset();
    actor.deleteTimeEntry.mockReset();
    actor.setTimeEntryInvoiced.mockReset();
  });

  it("logs a time entry against an engagement", async () => {
    const user = userEvent.setup();
    actor.createTimeEntry.mockResolvedValue(makeEntry({ id: 42n }));

    renderRoute(`/timesheet?week=${WEEK}`);
    await screen.findByText(/no time logged this week/i);

    await user.click(screen.getByTestId("timesheet.open_modal_button"));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByTestId("timesheet.engagement_select"));
    await user.click(
      await screen.findByRole("option", { name: "ERP Rollout" }),
    );
    await user.type(within(dialog).getByTestId("timesheet.hours_input"), "6");
    await user.type(
      within(dialog).getByTestId("timesheet.description_textarea"),
      "Configured chart of accounts",
    );
    await user.click(within(dialog).getByTestId("timesheet.submit_button"));

    await waitFor(() => {
      expect(actor.createTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          engagementId: 7n,
          hours: 6n,
          billable: true,
          description: "Configured chart of accounts",
        }),
      );
    });
  });

  it("marks an unbilled entry as invoiced", async () => {
    const user = userEvent.setup();
    actor.listWeekEntries.mockResolvedValue([
      makeEntry({ id: 5n, invoiced: false }),
    ]);
    actor.setTimeEntryInvoiced.mockResolvedValue(
      makeEntry({ id: 5n, invoiced: true }),
    );

    renderRoute(`/timesheet?week=${WEEK}`);

    const toggle = await screen.findByTestId("timesheet.invoiced_toggle.1");
    expect(toggle).toHaveTextContent("Unbilled");

    await user.click(toggle);

    await waitFor(() => {
      expect(actor.setTimeEntryInvoiced).toHaveBeenCalledWith(5n, true);
    });
  });

  it("deletes a logged entry after confirmation", async () => {
    const user = userEvent.setup();
    actor.listWeekEntries.mockResolvedValue([makeEntry({ id: 9n })]);
    actor.deleteTimeEntry.mockResolvedValue(true);

    renderRoute(`/timesheet?week=${WEEK}`);

    await user.click(await screen.findByTestId("timesheet.delete_button.1"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByTestId("timesheet.confirm_button"));

    await waitFor(() => {
      expect(actor.deleteTimeEntry).toHaveBeenCalledWith(9n);
    });
  });

  it("edits an existing entry and submits the update", async () => {
    const user = userEvent.setup();
    actor.listWeekEntries.mockResolvedValue([makeEntry({ id: 3n, hours: 8n })]);
    actor.updateTimeEntry.mockResolvedValue(makeEntry({ id: 3n, hours: 4n }));

    renderRoute(`/timesheet?week=${WEEK}`);

    await user.click(await screen.findByTestId("timesheet.edit_button.1"));
    const dialog = await screen.findByRole("dialog");

    const hours = within(dialog).getByTestId("timesheet.hours_input");
    await user.clear(hours);
    await user.type(hours, "4");
    await user.click(within(dialog).getByTestId("timesheet.submit_button"));

    await waitFor(() => {
      expect(actor.updateTimeEntry).toHaveBeenCalledWith(
        3n,
        expect.objectContaining({ hours: 4n }),
      );
    });
  });
});
