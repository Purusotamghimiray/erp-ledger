import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Banknote,
  Clock,
  Gauge,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  EmptyState,
  KpiCard,
  MarginBar,
  PageHeader,
  SectionCard,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useClientProfitability,
  useDashboardSummary,
  useEngagementProfitability,
  useMonthlyTrend,
  useUnbilledSummary,
} from "@/hooks/use-analytics";
import { useSeedSampleData } from "@/hooks/use-seed";
import {
  formatCurrency,
  formatHours,
  formatPercent,
  monthLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const trendConfig = {
  revenue: { label: "Revenue", color: "oklch(var(--chart-1))" },
  hours: { label: "Hours", color: "oklch(var(--chart-2))" },
} satisfies ChartConfig;

function DashboardSkeleton() {
  const ids = Array.from({ length: 4 }, (_, i) => `kpi-skeleton-${i}`);
  return (
    <div data-ocid="dashboard.loading_state" className="space-y-6 p-4 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ids.map((id) => (
          <Skeleton key={id} className="h-32 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-md" />
    </div>
  );
}

export function DashboardPage() {
  const summary = useDashboardSummary();
  const trend = useMonthlyTrend(12);
  const clientRows = useClientProfitability();
  const engagementRows = useEngagementProfitability();
  const unbilled = useUnbilledSummary();
  const seed = useSeedSampleData();

  const trendData = useMemo(
    () =>
      (trend.data ?? [])
        .map((point) => {
          const year = Number(point.year);
          const month = Number(point.month);
          const monthName = monthLabel(year, month);
          const label = monthName
            ? `${monthName} ${String(year).slice(2)}`
            : "—";
          return {
            label,
            revenue: Number(point.revenue) || 0,
            hours: Number(point.hours) || 0,
          };
        })
        .filter((point) => point.label !== "—"),
    [trend.data],
  );

  const topClients = useMemo(
    () =>
      [...(clientRows.data ?? [])]
        .sort((a, b) => Number(b.margin - a.margin))
        .slice(0, 5),
    [clientRows.data],
  );

  const topEngagements = useMemo(
    () =>
      [...(engagementRows.data ?? [])]
        .sort((a, b) => Number(b.margin - a.margin))
        .slice(0, 5),
    [engagementRows.data],
  );

  const isEmpty =
    !summary.isLoading &&
    summary.data != null &&
    summary.data.totalHours === 0n &&
    (clientRows.data?.length ?? 0) === 0;

  const autoSeeded = useRef(false);
  const seedMutate = seed.mutate;
  useEffect(() => {
    if (autoSeeded.current) return;
    if (summary.isLoading || clientRows.isLoading) return;
    if (isEmpty && !seed.isPending) {
      autoSeeded.current = true;
      seedMutate();
    }
  }, [
    isEmpty,
    summary.isLoading,
    clientRows.isLoading,
    seed.isPending,
    seedMutate,
  ]);

  if (summary.isLoading) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Practice-wide revenue, margin, and utilization at a glance."
        />
        <DashboardSkeleton />
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Practice-wide revenue, margin, and utilization at a glance."
        />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={TrendingUp}
            title="Your ledger is empty"
            description="Seed a realistic set of clients, engagements, and time entries to see the dashboard and analytics come alive — or start from scratch."
            ocid="dashboard.empty_state"
            action={
              <Button
                type="button"
                onClick={() => seed.mutate()}
                disabled={seed.isPending}
                data-ocid="dashboard.seed_button"
              >
                {seed.isPending ? "Seeding…" : "Load sample practice data"}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const s = summary.data;
  const marginPercent =
    s && s.totalRevenue > 0n
      ? Math.round((Number(s.grossMargin) / Number(s.totalRevenue)) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Practice-wide revenue, margin, and utilization at a glance."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link
              to="/timesheet"
              search={{}}
              data-ocid="dashboard.log_time_link"
            >
              <Clock className="size-4" aria-hidden="true" />
              Log time
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Total revenue"
            value={formatCurrency(s?.totalRevenue ?? 0n)}
            hint="Billable value across all engagements"
            icon={Banknote}
            accent="primary"
          />
          <KpiCard
            index={1}
            label="Total cost"
            value={formatCurrency(s?.totalCost ?? 0n)}
            hint="Internal cost of delivered hours"
            icon={Receipt}
          />
          <KpiCard
            index={2}
            label="Gross margin"
            value={formatCurrency(s?.grossMargin ?? 0n)}
            hint={`${formatPercent(marginPercent)} of revenue`}
            icon={TrendingUp}
            accent="success"
          />
          <KpiCard
            index={3}
            label="Billable utilization"
            value={formatPercent(s?.utilizationPercent ?? 0n)}
            hint={`${formatHours(s?.billableHours ?? 0n)} of ${formatHours(
              s?.totalHours ?? 0n,
            )} billable`}
            icon={Gauge}
            accent="accent"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            title="Revenue & hours — last 12 months"
            description="Monthly billed value against logged hours."
            className="lg:col-span-2"
            ocid="dashboard.trend_panel"
          >
            {trend.isLoading ? (
              <Skeleton className="h-64 rounded-md" />
            ) : trendData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No logged time in the last 12 months yet.
              </p>
            ) : (
              <ChartContainer config={trendConfig} className="h-64 w-full">
                <LineChart data={trendData} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    fontSize={11}
                    tickFormatter={(value: number) =>
                      value >= 1000
                        ? `${Math.round(value / 1000)}k`
                        : `${value}`
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--color-hours)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Unbilled work"
            description="Logged but not yet invoiced."
            ocid="dashboard.unbilled_panel"
          >
            {unbilled.isLoading ? (
              <Skeleton className="h-40 rounded-md" />
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border border-warning/30 bg-warning/10 p-4">
                  <p className="label-caps text-warning">Unbilled value</p>
                  <p className="tabular mt-2 text-3xl font-semibold text-foreground">
                    {formatCurrency(unbilled.data?.unbilledValue ?? 0n)}
                  </p>
                </div>
                <dl className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <dt className="text-sm text-muted-foreground">
                      Unbilled hours
                    </dt>
                    <dd className="tabular text-sm font-medium text-foreground">
                      {formatHours(unbilled.data?.unbilledHours ?? 0n)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-muted-foreground">
                      Open entries
                    </dt>
                    <dd className="tabular text-sm font-medium text-foreground">
                      {Number(unbilled.data?.entryCount ?? 0n)}
                    </dd>
                  </div>
                </dl>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link
                    to="/timesheet"
                    search={{}}
                    data-ocid="dashboard.unbilled_link"
                  >
                    Review timesheet
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Client profitability"
            description="Ranked by gross margin."
            ocid="dashboard.client_ranking"
          >
            {clientRows.isLoading ? (
              <Skeleton className="h-56 rounded-md" />
            ) : topClients.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No client revenue recorded yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {topClients.map((row, index) => (
                  <li
                    key={row.id.toString()}
                    data-ocid={`dashboard.client_row.${index + 1}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.name}
                      </span>
                      <span className="tabular shrink-0 text-sm text-foreground">
                        {formatCurrency(row.margin)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <MarginBar
                        percent={Number(row.marginPercent)}
                        index={index}
                      />
                      <span className="tabular w-12 shrink-0 text-right text-xs text-muted-foreground">
                        {formatPercent(row.marginPercent)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Engagement profitability"
            description="Ranked by gross margin."
            ocid="dashboard.engagement_ranking"
          >
            {engagementRows.isLoading ? (
              <Skeleton className="h-56 rounded-md" />
            ) : topEngagements.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No engagement revenue recorded yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {topEngagements.map((row, index) => (
                  <li
                    key={row.id.toString()}
                    data-ocid={`dashboard.engagement_row.${index + 1}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.name}
                      </span>
                      <span className="tabular shrink-0 text-sm text-foreground">
                        {formatCurrency(row.margin)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <MarginBar
                        percent={Number(row.marginPercent)}
                        index={index}
                      />
                      <span className="tabular w-12 shrink-0 text-right text-xs text-muted-foreground">
                        {formatPercent(row.marginPercent)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Hours by month"
          description="Logged hours across the practice."
          ocid="dashboard.hours_panel"
        >
          {trend.isLoading ? (
            <Skeleton className="h-56 rounded-md" />
          ) : trendData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hours logged yet.
            </p>
          ) : (
            <ChartContainer config={trendConfig} className="h-56 w-full">
              <BarChart data={trendData} margin={{ left: 4, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  fontSize={11}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="hours"
                  fill="var(--color-hours)"
                  radius={[3, 3, 0, 0]}
                  className={cn("animate-fade-in")}
                />
              </BarChart>
            </ChartContainer>
          )}
        </SectionCard>
      </div>
    </>
  );
}
