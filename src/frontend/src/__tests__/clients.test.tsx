import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Client } from "@/backend";
import { ClientStatus } from "@/backend";

const identity = {
  isAuthenticated: true,
  isInitializing: false,
  isLoggingIn: false,
  login: vi.fn(),
  clear: vi.fn(),
};

const actor = {
  listClients: vi.fn(),
  createClient: vi.fn(),
  listEngagements: vi.fn().mockResolvedValue([]),
  listTimeEntries: vi.fn().mockResolvedValue([]),
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

describe("ClientsPage", () => {
  beforeEach(() => {
    actor.listClients.mockReset().mockResolvedValue([]);
    actor.createClient.mockReset();
  });

  it("renders the client directory from the backend", async () => {
    actor.listClients.mockResolvedValue([
      makeClient(),
      makeClient({
        id: 2n,
        name: "Northwind Retail Group",
        contactPerson: "Priya Raman",
        email: "priya@northwind.example",
        industry: "Retail",
        status: ClientStatus.lead,
      }),
    ]);

    renderRoute("/clients");

    expect(await screen.findByText("Acme Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("Northwind Retail Group")).toBeInTheDocument();
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("Lead")).toBeInTheDocument();
  });

  it("passes the URL filter state to the backend query", async () => {
    actor.listClients.mockResolvedValue([makeClient()]);

    renderRoute("/clients?status=active&industry=Manufacturing");

    await waitFor(() => {
      expect(actor.listClients).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ClientStatus.active,
          industry: "Manufacturing",
        }),
      );
    });
  });

  it("reflects a status filter change in the URL", async () => {
    const user = userEvent.setup();
    actor.listClients.mockResolvedValue([makeClient()]);

    const { router } = renderRoute("/clients");
    await screen.findByText("Acme Manufacturing");

    await user.click(screen.getByTestId("clients.status_filter"));
    await user.click(await screen.findByRole("option", { name: "Lead" }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ status: "lead" });
    });
  });

  it("creates a client through the dialog and refreshes the list", async () => {
    const user = userEvent.setup();
    actor.listClients.mockResolvedValue([]);
    actor.createClient.mockResolvedValue(
      makeClient({ id: 9n, name: "Contoso Ltd", email: "ops@contoso.example" }),
    );

    renderRoute("/clients");
    await screen.findByText(/no clients match/i);

    await user.click(screen.getByTestId("clients.open_modal_button"));
    const dialog = await screen.findByRole("dialog");

    await user.type(
      within(dialog).getByLabelText(/client name/i),
      "Contoso Ltd",
    );
    await user.type(
      within(dialog).getByLabelText(/email/i),
      "ops@contoso.example",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /add client/i }),
    );

    await waitFor(() => {
      expect(actor.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Contoso Ltd",
          email: "ops@contoso.example",
        }),
      );
    });
  });

  it("disables submission until required fields are filled", async () => {
    const user = userEvent.setup();
    actor.listClients.mockResolvedValue([]);

    renderRoute("/clients");
    await screen.findByText(/no clients match/i);

    await user.click(screen.getByTestId("clients.open_modal_button"));
    const dialog = await screen.findByRole("dialog");

    const submit = within(dialog).getByRole("button", { name: /add client/i });
    expect(submit).toBeDisabled();

    await user.type(
      within(dialog).getByLabelText(/client name/i),
      "Contoso Ltd",
    );
    expect(submit).toBeDisabled();

    await user.type(
      within(dialog).getByLabelText(/email/i),
      "ops@contoso.example",
    );
    expect(submit).toBeEnabled();
  });
});
