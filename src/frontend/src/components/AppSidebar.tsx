import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  Clock,
  LayoutDashboard,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

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

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      data-ocid="nav.sidebar"
      className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
          L
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold leading-tight text-sidebar-foreground">
            Ledger
          </p>
          <p className="truncate text-[11px] leading-tight text-muted-foreground">
            Practice console
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav.link.${item.label.toLowerCase()}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-smooth",
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="label-caps">Solo practice</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          One consultant, every engagement tracked end to end.
        </p>
      </div>
    </aside>
  );
}
