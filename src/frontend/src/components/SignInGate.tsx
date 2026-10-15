import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2, ShieldCheck } from "lucide-react";

export function SignInGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing, isLoggingIn, login } =
    useInternetIdentity();

  if (isInitializing) {
    return (
      <div
        data-ocid="auth.loading_state"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Restoring your session…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div
          className="hairline-grid pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
        />
        <div className="relative w-full max-w-md animate-fade-up">
          <div className="rounded-md border border-border bg-card p-8 shadow-subtle">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
              Ledger
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The private practice console for a solo ERP consultant — clients,
              engagements, billable hours, and profitability in one ledger.
            </p>
            <Button
              type="button"
              size="lg"
              className="mt-6 w-full"
              onClick={() => login()}
              disabled={isLoggingIn}
              data-ocid="auth.login_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in to continue"
              )}
            </Button>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Your clients, engagements, and time entries are private to your
              identity. Sign-in is required to view or edit any business data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
