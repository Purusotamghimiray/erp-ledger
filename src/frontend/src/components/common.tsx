import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BILLING_MODEL_LABEL,
  CLIENT_STATUS_LABEL,
  ENGAGEMENT_STATUS_LABEL,
} from "@/types/domain";
import type {
  BillingModel,
  ClientStatus,
  EngagementStatus,
} from "@/types/domain";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-card px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  index = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "primary" | "accent" | "success" | "warning";
  index?: number;
}) {
  const accentClass =
    accent === "accent"
      ? "text-accent"
      : accent === "success"
        ? "text-success"
        : accent === "warning"
          ? "text-warning"
          : "text-primary";

  return (
    <div
      data-ocid={`dashboard.card.${index + 1}`}
      className="animate-fade-up rounded-md border border-border bg-card p-5 shadow-subtle"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="label-caps">{label}</p>
        {Icon ? (
          <Icon className={cn("size-4", accentClass)} aria-hidden="true" />
        ) : null}
      </div>
      <p className="tabular mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const variant =
    status === "active"
      ? "border-transparent bg-success/10 text-success"
      : status === "lead"
        ? "border-transparent bg-accent/10 text-accent"
        : "border-transparent bg-muted text-muted-foreground";
  return (
    <Badge className={cn("rounded-full", variant)}>
      {CLIENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function EngagementStatusBadge({
  status,
}: {
  status: EngagementStatus;
}) {
  const variant =
    status === "active"
      ? "border-transparent bg-success/10 text-success"
      : status === "proposed"
        ? "border-transparent bg-accent/10 text-accent"
        : status === "completed"
          ? "border-transparent bg-primary/10 text-primary"
          : "border-transparent bg-muted text-muted-foreground";
  return (
    <Badge className={cn("rounded-full", variant)}>
      {ENGAGEMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function BillingModelBadge({ model }: { model: BillingModel }) {
  return (
    <Badge variant="outline" className="rounded-full">
      {BILLING_MODEL_LABEL[model]}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  ocid,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  ocid?: string;
}) {
  return (
    <div
      data-ocid={ocid ?? "empty_state"}
      className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-card px-6 py-14 text-center"
    >
      <span className="flex size-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  ocid,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  ocid?: string;
}) {
  return (
    <section
      data-ocid={ocid}
      className={cn(
        "rounded-md border border-border bg-card shadow-subtle",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MarginBar({
  percent,
  index = 0,
}: {
  percent: number;
  index?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const tone =
    clamped >= 50 ? "bg-success" : clamped >= 25 ? "bg-primary" : "bg-warning";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full origin-left animate-bar-grow rounded-full", tone)}
        style={{
          width: `${clamped}%`,
          animationDelay: `${index * 50}ms`,
        }}
      />
    </div>
  );
}
