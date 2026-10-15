import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

// Every data endpoint traps for an anonymous caller, so the lane drives the
// canister as a signed-in consultant. `createIdentity` is deterministic, so the
// same seed names the same caller on every run.
const consultant = createIdentity("consultant");
const otherConsultant = createIdentity("other-consultant");

// Candid records require every key, and `?T` is `[] | [T]` in the declarations'
// shapes — an empty filter is all-empty optionals, never `{}`.
const noClientFilter = { status: [], search: [], industry: [] } as const;
const noEngagementFilter = { status: [], clientId: [], search: [] } as const;
const noTimeFilter = {
  to: [],
  engagementId: [],
  from: [],
  billable: [],
  invoiced: [],
} as const;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
  actor.setIdentity(consultant);
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(actor.listClients(noClientFilter)).resolves.toEqual([]);
  await expect(actor.listEngagements(noEngagementFilter)).resolves.toEqual([]);
  await expect(actor.listTimeEntries(noTimeFilter)).resolves.toEqual([]);
  await expect(actor.getClientProfitability()).resolves.toEqual([]);
  await expect(actor.getEngagementProfitability()).resolves.toEqual([]);
});

it("reports a zeroed dashboard before any data exists", async () => {
  const summary = await actor.getDashboardSummary();
  expect(summary.totalRevenue).toBe(0n);
  expect(summary.totalCost).toBe(0n);
  expect(summary.grossMargin).toBe(0n);
  expect(summary.totalHours).toBe(0n);
  expect(summary.utilizationPercent).toBe(0n);
});

it("round-trips a client through the real canister", async () => {
  const created = await actor.createClient({
    name: "Acme Manufacturing",
    contactPerson: "Dana Whitfield",
    email: "dana@acme.example",
    industry: "Manufacturing",
    status: { active: null },
  });
  expect(created.name).toBe("Acme Manufacturing");
  expect(created.status).toEqual({ active: null });

  const fetched = await actor.getClient(created.id);
  expect(fetched).not.toBeNull();
  expect(fetched?.[0]?.name).toBe("Acme Manufacturing");

  const listed = await actor.listClients(noClientFilter);
  expect(listed).toHaveLength(1);
});

it("creates an engagement under a client and logs a time entry against it", async () => {
  const client = await actor.createClient({
    name: "Northwind Retail Group",
    contactPerson: "Priya Raman",
    email: "priya@northwind.example",
    industry: "Retail",
    status: { active: null },
  });

  const engagement = await actor.createEngagement({
    clientId: client.id,
    name: "ERP Rollout Phase 1",
    scope: "Finance and inventory module implementation.",
    startDate: 1_700_000_000_000_000_000n,
    endDate: [],
    billingModel: { hourly: null },
    fixedFee: [],
    billableRate: 180n,
    costRate: 95n,
    status: { active: null },
  });
  expect(engagement.clientId).toBe(client.id);
  expect(engagement.billableRate).toBe(180n);

  const entry = await actor.createTimeEntry({
    engagementId: engagement.id,
    date: 1_700_000_000_000_000_000n,
    hours: 10n,
    billable: true,
    description: "Requirements gathering",
    expenseAmount: [],
  });
  expect(entry.hours).toBe(10n);
  expect(entry.billable).toBe(true);
  expect(entry.invoiced).toBe(false);

  const entries = await actor.listTimeEntries({
    ...noTimeFilter,
    engagementId: [engagement.id],
  });
  expect(entries).toHaveLength(1);
});

it("computes engagement profitability from billable hours times the rate", async () => {
  const client = await actor.createClient({
    name: "Lumen Health",
    contactPerson: "Marcus Bell",
    email: "marcus@lumenhealth.example",
    industry: "Healthcare",
    status: { lead: null },
  });

  const engagement = await actor.createEngagement({
    clientId: client.id,
    name: "Discovery Workshop",
    scope: "Two-day discovery workshop.",
    startDate: 1_700_000_000_000_000_000n,
    endDate: [],
    billingModel: { hourly: null },
    fixedFee: [],
    billableRate: 200n,
    costRate: 100n,
    status: { proposed: null },
  });

  await actor.createTimeEntry({
    engagementId: engagement.id,
    date: 1_700_000_000_000_000_000n,
    hours: 8n,
    billable: true,
    description: "Pre-workshop scoping call",
    expenseAmount: [],
  });

  const rows = await actor.getEngagementProfitability();
  const row = rows.find((r) => r.id === engagement.id);
  expect(row).toBeDefined();
  // 8 billable hours * $200/h = $1600 revenue; 8 * $100/h = $800 cost.
  expect(row?.revenue).toBe(1600n);
  expect(row?.cost).toBe(800n);
  expect(row?.margin).toBe(800n);
});

it("excludes invoiced entries from the unbilled summary", async () => {
  const client = await actor.createClient({
    name: "Invoicing Co",
    contactPerson: "Sam Lee",
    email: "sam@invoicing.example",
    industry: "Services",
    status: { active: null },
  });
  const engagement = await actor.createEngagement({
    clientId: client.id,
    name: "Billing Engagement",
    scope: "Billing work.",
    startDate: 1_700_000_000_000_000_000n,
    endDate: [],
    billingModel: { hourly: null },
    fixedFee: [],
    billableRate: 100n,
    costRate: 50n,
    status: { active: null },
  });
  const entry = await actor.createTimeEntry({
    engagementId: engagement.id,
    date: 1_700_000_000_000_000_000n,
    hours: 5n,
    billable: true,
    description: "Billable work",
    expenseAmount: [],
  });

  // The lane shares one canister and one caller across tests, so earlier
  // entries are already unbilled. Measure this test's own contribution as a
  // delta rather than an absolute total.
  const before = await actor.getUnbilledSummary();
  expect(before.unbilledHours).toBeGreaterThanOrEqual(5n);
  expect(before.unbilledValue).toBeGreaterThanOrEqual(500n);

  const updated = await actor.setTimeEntryInvoiced(entry.id, true);
  expect(updated?.[0]?.invoiced).toBe(true);

  const after = await actor.getUnbilledSummary();
  expect(before.unbilledHours - after.unbilledHours).toBe(5n);
  expect(before.unbilledValue - after.unbilledValue).toBe(500n);
});

it("seeds sample data so the dashboard is populated", async () => {
  await actor.seedSampleData();

  const clients = await actor.listClients(noClientFilter);
  expect(clients.length).toBeGreaterThan(0);

  const summary = await actor.getDashboardSummary();
  expect(summary.totalRevenue).toBeGreaterThan(0n);
  expect(summary.totalCost).toBeGreaterThan(0n);
  expect(summary.totalHours).toBeGreaterThan(0n);
});

it("rejects an anonymous caller on every data endpoint", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.listClients(noClientFilter)).rejects.toThrow();
  await expect(guest.getDashboardSummary()).rejects.toThrow();
  await expect(guest.seedSampleData()).rejects.toThrow();
});

it("does not show one consultant's data to another", async () => {
  // The seeded data above belongs to `consultant`; a different signed-in caller
  // must see none of it.
  actor.setIdentity(otherConsultant);
  await expect(actor.listClients(noClientFilter)).resolves.toEqual([]);
  await expect(actor.listEngagements(noEngagementFilter)).resolves.toEqual([]);
  const summary = await actor.getDashboardSummary();
  expect(summary.totalRevenue).toBe(0n);
  expect(summary.totalHours).toBe(0n);

  // Restore the primary caller for any later test.
  actor.setIdentity(consultant);
});
