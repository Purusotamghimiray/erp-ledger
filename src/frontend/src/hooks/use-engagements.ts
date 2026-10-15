import { createActor } from "@/backend";
import type { Engagement, EngagementFilter, EngagementInput } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const engagementKeys = {
  all: ["engagements"] as const,
  list: (filter: EngagementFilter) => ["engagements", "list", filter] as const,
  detail: (id: bigint) => ["engagements", "detail", id.toString()] as const,
};

export function useEngagements(filter: EngagementFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: engagementKeys.list(filter),
    queryFn: async (): Promise<Engagement[]> => {
      if (!actor) return [];
      return actor.listEngagements(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEngagement(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: engagementKeys.detail(id ?? 0n),
    queryFn: async (): Promise<Engagement | null> => {
      if (!actor || id === null) return null;
      return actor.getEngagement(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateEngagement() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EngagementInput): Promise<Engagement> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createEngagement(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: engagementKeys.all });
    },
  });
}

export function useUpdateEngagement() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: bigint;
      input: EngagementInput;
    }): Promise<Engagement | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateEngagement(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: engagementKeys.all });
    },
  });
}

export function useDeleteEngagement() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteEngagement(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: engagementKeys.all });
    },
  });
}
