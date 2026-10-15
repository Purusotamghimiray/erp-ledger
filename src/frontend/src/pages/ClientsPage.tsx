import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ClientStatusBadge, EmptyState, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { formatDate } from "@/lib/format";
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_LABEL,
  ClientStatus,
} from "@/types/domain";
import type { ClientInput } from "@/types/domain";

type ClientFormState = {
  name: string;
  contactPerson: string;
  email: string;
  industry: string;
  status: ClientStatus;
};

const EMPTY_FORM: ClientFormState = {
  name: "",
  contactPerson: "",
  email: "",
  industry: "",
  status: ClientStatus.lead,
};

function ClientFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<ClientFormState>(EMPTY_FORM);
  const createClient = useCreateClient();

  const canSubmit = form.name.trim().length > 0 && form.email.trim().length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const input: ClientInput = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      industry: form.industry.trim(),
      status: form.status,
    };
    createClient.mutate(input, {
      onSuccess: () => {
        toast.success("Client added");
        setForm(EMPTY_FORM);
        onOpenChange(false);
      },
      onError: () => toast.error("Could not add client"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="clients.dialog">
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
          <DialogDescription>
            Add a client to your practice directory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="client-name">Client name</Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Northwind Manufacturing"
              data-ocid="clients.name_input"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-contact">Contact person</Label>
              <Input
                id="client-contact"
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
                placeholder="Dana Whitfield"
                data-ocid="clients.contact_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="dana@northwind.example"
                data-ocid="clients.email_input"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-industry">Industry</Label>
              <Input
                id="client-industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Manufacturing"
                data-ocid="clients.industry_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as ClientStatus })
                }
              >
                <SelectTrigger
                  id="client-status"
                  data-ocid="clients.status_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {CLIENT_STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="clients.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || createClient.isPending}
              data-ocid="clients.submit_button"
            >
              {createClient.isPending ? "Adding…" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientsPage() {
  const search = useSearch({ from: "/clients" });
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const filter = useMemo(
    () => ({
      search: search.search,
      status: search.status as ClientStatus | undefined,
      industry: search.industry,
    }),
    [search.search, search.status, search.industry],
  );

  const clients = useClients(filter);

  function updateSearch(patch: Record<string, string | undefined>) {
    void navigate({
      to: "/clients",
      search: (prev) => ({ ...prev, ...patch }),
    });
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description="Your practice directory — leads, active accounts, and archived relationships."
        actions={
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            data-ocid="clients.open_modal_button"
          >
            <Plus className="size-4" aria-hidden="true" />
            New client
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 shadow-subtle sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search.search ?? ""}
              onChange={(e) =>
                updateSearch({ search: e.target.value || undefined })
              }
              placeholder="Search clients by name or contact"
              className="pl-9"
              aria-label="Search clients"
              data-ocid="clients.search_input"
            />
          </div>
          <Select
            value={search.status ?? "all"}
            onValueChange={(value) =>
              updateSearch({ status: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger
              className="sm:w-44"
              aria-label="Filter by status"
              data-ocid="clients.status_filter"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CLIENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {CLIENT_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={search.industry ?? ""}
            onChange={(e) =>
              updateSearch({ industry: e.target.value || undefined })
            }
            placeholder="Industry"
            className="sm:w-44"
            aria-label="Filter by industry"
            data-ocid="clients.industry_filter"
          />
        </div>

        {clients.isLoading ? (
          <div data-ocid="clients.loading_state" className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => `client-skeleton-${i}`).map(
              (id) => (
                <Skeleton key={id} className="h-12 rounded-md" />
              ),
            )}
          </div>
        ) : clients.isError ? (
          <EmptyState
            icon={Users}
            title="Could not load clients"
            description="Something went wrong reaching the backend. Try again in a moment."
            ocid="clients.error_state"
          />
        ) : (clients.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients match"
            description="Adjust your filters, or add the first client to your practice directory."
            ocid="clients.empty_state"
            action={
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                data-ocid="clients.empty_add_button"
              >
                <Plus className="size-4" aria-hidden="true" />
                New client
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-card shadow-subtle">
            <Table data-ocid="clients.table">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.data?.map((client, index) => (
                  <TableRow
                    key={client.id.toString()}
                    data-ocid={`clients.row.${index + 1}`}
                    className="transition-smooth hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: client.id.toString() }}
                        className="transition-smooth hover:text-primary"
                        data-ocid={`clients.link.${index + 1}`}
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block truncate">
                        {client.contactPerson || "—"}
                      </span>
                      <span className="block truncate text-xs">
                        {client.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.industry || "—"}
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge status={client.status} />
                    </TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
