import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/engagements", label: "Engagements", icon: Briefcase },
  { to: "/timesheet", label: "Timesheet", icon: Clock },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          data-ocid="nav.open_modal_button"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-5 py-4">
          <SheetTitle className="font-display text-base">Ledger</SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 p-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                data-ocid={`nav.mobile.link.${item.label.toLowerCase()}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-smooth",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { clear, isAuthenticated } = useInternetIdentity();
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 shadow-subtle md:px-6">
          <MobileNav />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="font-display text-sm font-semibold tracking-tight text-foreground md:hidden">
              Ledger
            </span>
          </div>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              data-ocid="auth.logout_button"
              className="gap-2 text-muted-foreground"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : null}
        </header>

        <main className="flex-1 bg-background">{children}</main>

        <footer className="border-t border-border bg-muted/40 px-4 py-4 md:px-6">
          <div className="flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p className="tabular">Ledger — freelance ERP practice console</p>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="transition-smooth hover:text-foreground"
            >
              © {year}. Built with love using caffeine.ai
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
