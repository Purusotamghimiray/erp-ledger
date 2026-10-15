import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSeedSampleData() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.seedSampleData();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
