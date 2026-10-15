import { createActor } from "@/backend";
import type { Client, ClientFilter, ClientInput } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const clientKeys = {
  all: ["clients"] as const,
  list: (filter: ClientFilter) => ["clients", "list", filter] as const,
  detail: (id: bigint) => ["clients", "detail", id.toString()] as const,
};

export function useClients(filter: ClientFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: clientKeys.list(filter),
    queryFn: async (): Promise<Client[]> => {
      if (!actor) return [];
      return actor.listClients(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClient(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: clientKeys.detail(id ?? 0n),
    queryFn: async (): Promise<Client | null> => {
      if (!actor || id === null) return null;
      return actor.getClient(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateClient() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput): Promise<Client> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createClient(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useUpdateClient() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: bigint;
      input: ClientInput;
    }): Promise<Client | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateClient(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useDeleteClient() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteClient(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
