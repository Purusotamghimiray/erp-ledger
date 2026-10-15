import { createActor } from "@/backend";
import type { TimeEntry, TimeEntryFilter, TimeEntryInput } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const timeKeys = {
  all: ["time"] as const,
  list: (filter: TimeEntryFilter) => ["time", "list", filter] as const,
  week: (weekStart: bigint) => ["time", "week", weekStart.toString()] as const,
};

export function useTimeEntries(filter: TimeEntryFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: timeKeys.list(filter),
    queryFn: async (): Promise<TimeEntry[]> => {
      if (!actor) return [];
      return actor.listTimeEntries(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeekEntries(weekStart: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: timeKeys.week(weekStart),
    queryFn: async (): Promise<TimeEntry[]> => {
      if (!actor) return [];
      return actor.listWeekEntries(weekStart);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTimeEntry() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TimeEntryInput): Promise<TimeEntry> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createTimeEntry(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeKeys.all });
    },
  });
}

export function useUpdateTimeEntry() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: bigint;
      input: TimeEntryInput;
    }): Promise<TimeEntry | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateTimeEntry(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeKeys.all });
    },
  });
}

export function useDeleteTimeEntry() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteTimeEntry(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeKeys.all });
    },
  });
}

export function useSetInvoiced() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      invoiced,
    }: {
      id: bigint;
      invoiced: boolean;
    }): Promise<TimeEntry | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setTimeEntryInvoiced(id, invoiced);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeKeys.all });
    },
  });
}
