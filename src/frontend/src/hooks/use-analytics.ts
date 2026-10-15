import { createActor } from "@/backend";
import type {
  DashboardSummary,
  MonthlyTrendPoint,
  ProfitabilityRow,
  UnbilledSummary,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export const analyticsKeys = {
  all: ["analytics"] as const,
  dashboard: ["analytics", "dashboard"] as const,
  clientProfitability: ["analytics", "client-profitability"] as const,
  engagementProfitability: ["analytics", "engagement-profitability"] as const,
  trend: (months: number) => ["analytics", "trend", months] as const,
  unbilled: ["analytics", "unbilled"] as const,
};

export function useDashboardSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: analyticsKeys.dashboard,
    queryFn: async (): Promise<DashboardSummary | null> => {
      if (!actor) return null;
      return actor.getDashboardSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClientProfitability() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: analyticsKeys.clientProfitability,
    queryFn: async (): Promise<ProfitabilityRow[]> => {
      if (!actor) return [];
      return actor.getClientProfitability();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEngagementProfitability() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: analyticsKeys.engagementProfitability,
    queryFn: async (): Promise<ProfitabilityRow[]> => {
      if (!actor) return [];
      return actor.getEngagementProfitability();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonthlyTrend(months: number) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: analyticsKeys.trend(months),
    queryFn: async (): Promise<MonthlyTrendPoint[]> => {
      if (!actor) return [];
      return actor.getMonthlyTrend(BigInt(months));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUnbilledSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: analyticsKeys.unbilled,
    queryFn: async (): Promise<UnbilledSummary | null> => {
      if (!actor) return null;
      return actor.getUnbilledSummary();
    },
    enabled: !!actor && !isFetching,
  });
}
