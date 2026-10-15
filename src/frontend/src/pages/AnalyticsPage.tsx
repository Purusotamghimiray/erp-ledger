import { BarChart3, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  EmptyState,
  KpiCard,
  MarginBar,
  PageHeader,
  SectionCard,
} from "@/components/common";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useClientProfitability,
  useDashboardSummary,
  useEngagementProfitability,
  useMonthlyTrend,
  useUnbilledSummary,
} from "@/hooks/use-analytics";
import {
  formatCurrency,
  formatHours,
  formatPercent,
  monthLabel,
} from "@/lib/format";
import type { ProfitabilityRow } from "@/types/domain";

const revenueConfig = {
  revenue: { label: "Revenue", color: "oklch(var(--chart-1))" },
} satisfies ChartConfig;

function RankingTable({
  rows,
  loading,
  emptyLabel,
  ocid,
}: {
  rows: ProfitabilityRow[];
  loading: boolean;
  emptyLabel: string;
  ocid: string;
}) {
  if (loading) {
    return <Skeleton className="h-64 rounded-md" />;
  }
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table data-ocid={ocid} className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="px-3 py-2.5 font-medium text-muted-foreground">
              Name
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
              Revenue
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
              Cost
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
              Margin
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
              Margin %
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id.toString()}
              data-ocid={`${ocid}.row.${index + 1}`}
              className="border-b border-border transition-smooth last:border-0 hover:bg-muted/40"
            >
              <td className="max-w-[16rem] truncate px-3 py-2.5 font-medium text-foreground">
                {row.name}
              </td>
              <td className="tabular px-3 py-2.5 text-right text-foreground">
                {formatCurrency(row.revenue)}
              </td>
              <td className="tabular px-3 py-2.5 text-right text-muted-foreground">
                {formatCurrency(row.cost)}
              </td>
              <td className="tabular px-3 py-2.5 text-right text-foreground">
                {formatCurrency(row.margin)}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-3">
                  <div className="hidden w-24 sm:block">
                    <MarginBar
                      percent={Number(row.marginPercent)}
                      index={index}
                    />
                  </div>
                  <span className="tabular w-12 text-right text-muted-foreground">
                    {formatPercent(row.marginPercent)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsPage() {
  const summary = useDashboardSummary();
  const clientRows = useClientProfitability();
  const engagementRows = useEngagementProfitability();
  const trend = useMonthlyTrend(12);
  const unbilled = useUnbilledSummary();

  const trendData = useMemo(
    () =>
      (trend.data ?? []).map((point) => ({
        label: `${monthLabel(Number(point.year), Number(point.month))} ${String(
          Number(point.year),
        ).slice(2)}`,
        revenue: Number(point.revenue),
        hours: Number(point.hours),
      })),
    [trend.data],
  );

  const sortedClients = useMemo(
    () =>
      [...(clientRows.data ?? [])].sort((a, b) => Number(b.margin - a.margin)),
    [clientRows.data],
  );

  const sortedEngagements = useMemo(
    () =>
      [...(engagementRows.data ?? [])].sort((a, b) =>
        Number(b.margin - a.margin),
      ),
    [engagementRows.data],
  );

  const s = summary.data;
  const marginPercent =
    s && s.totalRevenue > 0n
      ? Math.round((Number(s.grossMargin) / Number(s.totalRevenue)) * 100)
      : 0;

  const hasData =
    (clientRows.data?.length ?? 0) > 0 ||
    (engagementRows.data?.length ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Profitability across clients and engagements, with a 12-month trend."
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Revenue"
            value={formatCurrency(s?.totalRevenue ?? 0n)}
            hint="All billable value"
            icon={TrendingUp}
            accent="primary"
          />
          <KpiCard
            index={1}
            label="Cost"
            value={formatCurrency(s?.totalCost ?? 0n)}
            hint="Delivered hours at cost"
            icon={BarChart3}
          />
          <KpiCard
            index={2}
            label="Gross margin"
            value={formatPercent(marginPercent)}
            hint={formatCurrency(s?.grossMargin ?? 0n)}
            icon={TrendingUp}
            accent="success"
          />
          <KpiCard
            index={3}
            label="Unbilled value"
            value={formatCurrency(unbilled.data?.unbilledValue ?? 0n)}
            hint={`${formatHours(unbilled.data?.unbilledHours ?? 0n)} not yet invoiced`}
            icon={BarChart3}
            accent="warning"
          />
        </div>

        {!hasData && !clientRows.isLoading ? (
          <EmptyState
            icon={BarChart3}
            title="No profitability data yet"
            description="Once you log billable time against engagements, client and engagement rankings will appear here."
            ocid="analytics.empty_state"
          />
        ) : (
          <>
            <SectionCard
              title="Profitability ranking"
              description="Compare clients and engagements by gross margin."
              ocid="analytics.ranking_panel"
            >
              <Tabs defaultValue="clients">
                <TabsList data-ocid="analytics.tabs">
                  <TabsTrigger
                    value="clients"
                    data-ocid="analytics.clients_tab"
                  >
                    By client
                  </TabsTrigger>
                  <TabsTrigger
                    value="engagements"
                    data-ocid="analytics.engagements_tab"
                  >
                    By engagement
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="clients" className="mt-4">
                  <RankingTable
                    rows={sortedClients}
                    loading={clientRows.isLoading}
                    emptyLabel="No client revenue recorded yet."
                    ocid="analytics.clients_table"
                  />
                </TabsContent>
                <TabsContent value="engagements" className="mt-4">
                  <RankingTable
                    rows={sortedEngagements}
                    loading={engagementRows.isLoading}
                    emptyLabel="No engagement revenue recorded yet."
                    ocid="analytics.engagements_table"
                  />
                </TabsContent>
              </Tabs>
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-3">
              <SectionCard
                title="Revenue trend"
                description="Monthly billed value over 12 months."
                className="lg:col-span-2"
                ocid="analytics.trend_panel"
              >
                {trend.isLoading ? (
                  <Skeleton className="h-64 rounded-md" />
                ) : trendData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No logged time in the last 12 months yet.
                  </p>
                ) : (
                  <ChartContainer
                    config={revenueConfig}
                    className="h-64 w-full"
                  >
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
                        width={48}
                        fontSize={11}
                        tickFormatter={(value: number) =>
                          value >= 1000
                            ? `${Math.round(value / 1000)}k`
                            : `${value}`
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                        {trendData.map((entry) => (
                          <Cell key={entry.label} fill="var(--color-revenue)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </SectionCard>

              <SectionCard
                title="Unbilled work"
                description="Logged but not yet invoiced."
                ocid="analytics.unbilled_panel"
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
                  </div>
                )}
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </>
  );
}
