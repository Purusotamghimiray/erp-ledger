import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Briefcase, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  BillingModelBadge,
  EmptyState,
  EngagementStatusBadge,
  PageHeader,
} from "@/components/common";
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
import { useClients } from "@/hooks/use-clients";
import { useCreateEngagement, useEngagements } from "@/hooks/use-engagements";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  BILLING_MODEL_LABEL,
  BillingModel,
  ENGAGEMENT_STATUSES,
  ENGAGEMENT_STATUS_LABEL,
  EngagementStatus,
} from "@/types/domain";
import type { EngagementInput } from "@/types/domain";

type EngagementFormState = {
  clientId: string;
  name: string;
  scope: string;
  startDate: string;
  endDate: string;
  billingModel: BillingModel;
  fixedFee: string;
  billableRate: string;
  costRate: string;
  status: EngagementStatus;
};

const EMPTY_FORM: EngagementFormState = {
  clientId: "",
  name: "",
  scope: "",
  startDate: "",
  endDate: "",
  billingModel: BillingModel.hourly,
  fixedFee: "",
  billableRate: "",
  costRate: "",
  status: EngagementStatus.proposed,
};

function EngagementFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<EngagementFormState>(EMPTY_FORM);
  const clients = useClients({});
  const createEngagement = useCreateEngagement();

  const canSubmit =
    form.clientId !== "" &&
    form.name.trim().length > 0 &&
    form.startDate !== "" &&
    form.billableRate !== "" &&
    form.costRate !== "";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = form.endDate ? new Date(`${form.endDate}T00:00:00`) : null;
    const input: EngagementInput = {
      clientId: BigInt(form.clientId),
      name: form.name.trim(),
      scope: form.scope.trim(),
      startDate: BigInt(start.getTime()) * 1_000_000n,
      endDate: end ? BigInt(end.getTime()) * 1_000_000n : undefined,
      billingModel: form.billingModel,
      fixedFee:
        form.billingModel === "fixedFee" && form.fixedFee
          ? BigInt(Math.round(Number(form.fixedFee)))
          : undefined,
      billableRate: BigInt(Math.round(Number(form.billableRate))),
      costRate: BigInt(Math.round(Number(form.costRate))),
      status: form.status,
    };
    createEngagement.mutate(input, {
      onSuccess: () => {
        toast.success("Engagement created");
        setForm(EMPTY_FORM);
        onOpenChange(false);
      },
      onError: () => toast.error("Could not create engagement"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        data-ocid="engagements.dialog"
      >
        <DialogHeader>
          <DialogTitle>New engagement</DialogTitle>
          <DialogDescription>
            Define the scope and billing terms for a client project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="eng-client">Client</Label>
              <Select
                value={form.clientId}
                onValueChange={(value) => setForm({ ...form, clientId: value })}
              >
                <SelectTrigger
                  id="eng-client"
                  data-ocid="engagements.client_select"
                >
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {(clients.data ?? []).map((client) => (
                    <SelectItem
                      key={client.id.toString()}
                      value={client.id.toString()}
                    >
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eng-name">Engagement name</Label>
              <Input
                id="eng-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ERP migration — phase 1"
                data-ocid="engagements.name_input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eng-scope">Scope</Label>
            <textarea
              id="eng-scope"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              placeholder="Discovery, data migration, and go-live support."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              data-ocid="engagements.scope_textarea"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="eng-start">Start date</Label>
              <Input
                id="eng-start"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                data-ocid="engagements.start_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eng-end">End date (optional)</Label>
              <Input
                id="eng-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                data-ocid="engagements.end_input"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="eng-model">Billing model</Label>
              <Select
                value={form.billingModel}
                onValueChange={(value) =>
                  setForm({ ...form, billingModel: value as BillingModel })
                }
              >
                <SelectTrigger
                  id="eng-model"
                  data-ocid="engagements.model_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">
                    {BILLING_MODEL_LABEL.hourly}
                  </SelectItem>
                  <SelectItem value="fixedFee">
                    {BILLING_MODEL_LABEL.fixedFee}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eng-billable">Billable rate ($/h)</Label>
              <Input
                id="eng-billable"
                type="number"
                min="0"
                value={form.billableRate}
                onChange={(e) =>
                  setForm({ ...form, billableRate: e.target.value })
                }
                placeholder="150"
                data-ocid="engagements.billable_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eng-cost">Cost rate ($/h)</Label>
              <Input
                id="eng-cost"
                type="number"
                min="0"
                value={form.costRate}
                onChange={(e) => setForm({ ...form, costRate: e.target.value })}
                placeholder="70"
                data-ocid="engagements.cost_input"
              />
            </div>
          </div>
          {form.billingModel === "fixedFee" ? (
            <div className="space-y-1.5">
              <Label htmlFor="eng-fee">Fixed fee ($)</Label>
              <Input
                id="eng-fee"
                type="number"
                min="0"
                value={form.fixedFee}
                onChange={(e) => setForm({ ...form, fixedFee: e.target.value })}
                placeholder="24000"
                data-ocid="engagements.fee_input"
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="eng-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm({ ...form, status: value as EngagementStatus })
              }
            >
              <SelectTrigger
                id="eng-status"
                data-ocid="engagements.status_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENGAGEMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ENGAGEMENT_STATUS_LABEL[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="engagements.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || createEngagement.isPending}
              data-ocid="engagements.submit_button"
            >
              {createEngagement.isPending ? "Creating…" : "Create engagement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EngagementsPage() {
  const search = useSearch({ from: "/engagements" });
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const filter = useMemo(
    () => ({
      search: search.search,
      status: search.status as EngagementStatus | undefined,
      clientId: search.clientId ? BigInt(search.clientId) : undefined,
    }),
    [search.search, search.status, search.clientId],
  );

  const engagements = useEngagements(filter);
  const clients = useClients({});

  const clientName = useMemo(() => {
    const map = new Map(
      (clients.data ?? []).map((c) => [c.id.toString(), c.name]),
    );
    return (id: bigint) => map.get(id.toString()) ?? "Unknown client";
  }, [clients.data]);

  function updateSearch(patch: Record<string, string | undefined>) {
    void navigate({
      to: "/engagements",
      search: (prev) => ({ ...prev, ...patch }),
    });
  }

  return (
    <>
      <PageHeader
        title="Engagements"
        description="Every project across your practice, with billing terms and status."
        actions={
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            data-ocid="engagements.open_modal_button"
          >
            <Plus className="size-4" aria-hidden="true" />
            New engagement
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
              placeholder="Search engagements by name"
              className="pl-9"
              aria-label="Search engagements"
              data-ocid="engagements.search_input"
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
              data-ocid="engagements.status_filter"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ENGAGEMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ENGAGEMENT_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.clientId ?? "all"}
            onValueChange={(value) =>
              updateSearch({ clientId: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger
              className="sm:w-48"
              aria-label="Filter by client"
              data-ocid="engagements.client_filter"
            >
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {(clients.data ?? []).map((client) => (
                <SelectItem
                  key={client.id.toString()}
                  value={client.id.toString()}
                >
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {engagements.isLoading ? (
          <div data-ocid="engagements.loading_state" className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => `eng-skeleton-${i}`).map(
              (id) => (
                <Skeleton key={id} className="h-12 rounded-md" />
              ),
            )}
          </div>
        ) : engagements.isError ? (
          <EmptyState
            icon={Briefcase}
            title="Could not load engagements"
            description="Something went wrong reaching the backend. Try again in a moment."
            ocid="engagements.error_state"
          />
        ) : (engagements.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No engagements match"
            description="Adjust your filters, or create the first engagement for a client."
            ocid="engagements.empty_state"
            action={
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                data-ocid="engagements.empty_add_button"
              >
                <Plus className="size-4" aria-hidden="true" />
                New engagement
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-card shadow-subtle">
            <Table data-ocid="engagements.table">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">Billable rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Start</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagements.data?.map((engagement, index) => (
                  <TableRow
                    key={engagement.id.toString()}
                    data-ocid={`engagements.row.${index + 1}`}
                    className="transition-smooth hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">
                      <Link
                        to="/engagements/$engagementId"
                        params={{ engagementId: engagement.id.toString() }}
                        className="transition-smooth hover:text-primary"
                        data-ocid={`engagements.link.${index + 1}`}
                      >
                        {engagement.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clientName(engagement.clientId)}
                    </TableCell>
                    <TableCell>
                      <BillingModelBadge model={engagement.billingModel} />
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatCurrency(engagement.billableRate)}
                    </TableCell>
                    <TableCell>
                      <EngagementStatusBadge status={engagement.status} />
                    </TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {formatDate(engagement.startDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <EngagementFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
