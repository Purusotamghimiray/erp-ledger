import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const identity = {
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  login: vi.fn(),
  clear: vi.fn(),
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => identity,
  useActor: () => ({ actor: null, isFetching: false }),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import { SignInGate } from "@/components/SignInGate";

describe("SignInGate", () => {
  beforeEach(() => {
    identity.isAuthenticated = false;
    identity.isInitializing = false;
    identity.isLoggingIn = false;
    identity.login.mockClear();
  });

  it("hides business content and offers sign-in when unauthenticated", () => {
    render(
      <SignInGate>
        <div>Secret ledger data</div>
      </SignInGate>,
    );

    expect(screen.queryByText("Secret ledger data")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in to continue/i }),
    ).toBeInTheDocument();
  });

  it("invokes login when the sign-in button is pressed", async () => {
    const user = userEvent.setup();
    render(
      <SignInGate>
        <div>Secret ledger data</div>
      </SignInGate>,
    );

    await user.click(
      screen.getByRole("button", { name: /sign in to continue/i }),
    );
    expect(identity.login).toHaveBeenCalledTimes(1);
  });

  it("shows a restoring state while the session initializes", () => {
    identity.isInitializing = true;
    render(
      <SignInGate>
        <div>Secret ledger data</div>
      </SignInGate>,
    );

    expect(screen.getByText(/restoring your session/i)).toBeInTheDocument();
    expect(screen.queryByText("Secret ledger data")).not.toBeInTheDocument();
  });

  it("renders children once authenticated", () => {
    identity.isAuthenticated = true;
    render(
      <SignInGate>
        <div>Secret ledger data</div>
      </SignInGate>,
    );

    expect(screen.getByText("Secret ledger data")).toBeInTheDocument();
  });
});
