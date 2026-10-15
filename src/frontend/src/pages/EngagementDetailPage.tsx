import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Clock,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  BillingModelBadge,
  EmptyState,
  EngagementStatusBadge,
  KpiCard,
  PageHeader,
  SectionCard,
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
import {
  useDeleteEngagement,
  useEngagement,
  useUpdateEngagement,
} from "@/hooks/use-engagements";
import { useTimeEntries } from "@/hooks/use-time";
import {
  formatCurrency,
  formatDate,
  formatHours,
  formatPercent,
  toDateInputValue,
} from "@/lib/format";
import {
  BILLING_MODEL_LABEL,
  ENGAGEMENT_STATUSES,
  ENGAGEMENT_STATUS_LABEL,
} from "@/types/domain";
import type {
  BillingModel,
  EngagementInput,
  EngagementStatus,
} from "@/types/domain";

type EditFormState = {
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

export function EngagementDetailPage() {
  const { engagementId } = useParams({ from: "/engagements/$engagementId" });
  const navigate = useNavigate();
  const id = BigInt(engagementId);

  const engagement = useEngagement(id);
  const clients = useClients({});
  const entries = useTimeEntries({ engagementId: id });
  const updateEngagement = useUpdateEngagement();
  const deleteEngagement = useDeleteEngagement();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<EditFormState | null>(null);

  const clientName = useMemo(() => {
    if (!engagement.data) return "—";
    const client = (clients.data ?? []).find(
      (c) => c.id === engagement.data?.clientId,
    );
    return client?.name ?? "Unknown client";
  }, [clients.data, engagement.data]);

  const totals = useMemo(() => {
    const list = entries.data ?? [];
    let hours = 0n;
    let billableHours = 0n;
    let revenue = 0n;
    let cost = 0n;
    for (const entry of list) {
      hours += entry.hours;
      if (entry.billable) {
        billableHours += entry.hours;
        if (engagement.data) {
          revenue += entry.hours * engagement.data.billableRate;
        }
      }
      if (engagement.data) {
        cost += entry.hours * engagement.data.costRate;
      }
    }
    const margin = revenue - cost;
    const marginPercent =
      revenue > 0n ? Math.round((Number(margin) / Number(revenue)) * 100) : 0;
    return { hours, billableHours, revenue, cost, margin, marginPercent };
  }, [entries.data, engagement.data]);

  function openEdit() {
    if (!engagement.data) return;
    const e = engagement.data;
    setForm({
      name: e.name,
      scope: e.scope,
      startDate: toDateInputValue(e.startDate),
      endDate: e.endDate ? toDateInputValue(e.endDate) : "",
      billingModel: e.billingModel,
      fixedFee: e.fixedFee ? e.fixedFee.toString() : "",
      billableRate: e.billableRate.toString(),
      costRate: e.costRate.toString(),
      status: e.status,
    });
    setEditOpen(true);
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !engagement.data) return;
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = form.endDate ? new Date(`${form.endDate}T00:00:00`) : null;
    const input: EngagementInput = {
      clientId: engagement.data.clientId,
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
    updateEngagement.mutate(
      { id, input },
      {
        onSuccess: () => {
          toast.success("Engagement updated");
          setEditOpen(false);
        },
        onError: () => toast.error("Could not update engagement"),
      },
    );
  }

  function handleDelete() {
    deleteEngagement.mutate(id, {
      onSuccess: () => {
        toast.success("Engagement deleted");
        void navigate({ to: "/engagements", search: {} });
      },
      onError: () => toast.error("Could not delete engagement"),
    });
  }

  if (engagement.isLoading) {
    return (
      <>
        <PageHeader title="Engagement" />
        <div
          data-ocid="engagement.loading_state"
          className="space-y-4 p-4 md:p-6"
        >
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
      </>
    );
  }

  if (!engagement.data) {
    return (
      <>
        <PageHeader title="Engagement not found" />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={Briefcase}
            title="This engagement no longer exists"
            description="It may have been deleted. Return to the list to pick another."
            ocid="engagement.error_state"
            action={
              <Button asChild>
                <Link
                  to="/engagements"
                  search={{}}
                  data-ocid="engagement.back_button"
                >
                  Back to engagements
                </Link>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const e = engagement.data;

  return (
    <>
      <PageHeader
        title={e.name}
        description={`${clientName} · ${BILLING_MODEL_LABEL[e.billingModel]} · started ${formatDate(e.startDate)}`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openEdit}
              data-ocid="engagement.edit_button"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:text-destructive"
              data-ocid="engagement.delete_button"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link
              to="/engagements"
              search={{}}
              data-ocid="engagement.back_link"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              All engagements
            </Link>
          </Button>
          <EngagementStatusBadge status={e.status} />
          <BillingModelBadge model={e.billingModel} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Revenue"
            value={formatCurrency(totals.revenue)}
            hint={`${formatHours(totals.billableHours)} billable`}
            icon={Banknote}
            accent="primary"
          />
          <KpiCard
            index={1}
            label="Cost"
            value={formatCurrency(totals.cost)}
            hint={`${formatHours(totals.hours)} total logged`}
            icon={Clock}
          />
          <KpiCard
            index={2}
            label="Gross margin"
            value={formatCurrency(totals.margin)}
            hint={`${formatPercent(totals.marginPercent)} of revenue`}
            icon={TrendingUp}
            accent="success"
          />
          <KpiCard
            index={3}
            label="Rates"
            value={`${formatCurrency(e.billableRate)}/h`}
            hint={`Cost ${formatCurrency(e.costRate)}/h`}
            icon={Briefcase}
            accent="accent"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            title="Scope"
            description="What this engagement covers."
            className="lg:col-span-2"
            ocid="engagement.scope_panel"
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {e.scope || "No scope description recorded."}
            </p>
          </SectionCard>

          <SectionCard
            title="Billing terms"
            description="Commercial terms for this engagement."
            ocid="engagement.terms_panel"
          >
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Billing model</dt>
                <dd className="font-medium text-foreground">
                  {BILLING_MODEL_LABEL[e.billingModel]}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Billable rate</dt>
                <dd className="tabular font-medium text-foreground">
                  {formatCurrency(e.billableRate)}/h
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Cost rate</dt>
                <dd className="tabular font-medium text-foreground">
                  {formatCurrency(e.costRate)}/h
                </dd>
              </div>
              {e.fixedFee ? (
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-muted-foreground">Fixed fee</dt>
                  <dd className="tabular font-medium text-foreground">
                    {formatCurrency(e.fixedFee)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Timeline</dt>
                <dd className="tabular font-medium text-foreground">
                  {formatDate(e.startDate)}
                  {e.endDate ? ` – ${formatDate(e.endDate)}` : " – ongoing"}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>

        <SectionCard
          title="Logged time"
          description="Time entries recorded against this engagement."
          ocid="engagement.entries_panel"
          action={
            <Button asChild size="sm" variant="outline">
              <Link
                to="/timesheet"
                search={{}}
                data-ocid="engagement.log_time_link"
              >
                <Plus className="size-4" aria-hidden="true" />
                Log time
              </Link>
            </Button>
          }
        >
          {entries.isLoading ? (
            <Skeleton className="h-40 rounded-md" />
          ) : (entries.data?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No time logged against this engagement yet.
            </p>
          ) : (
            <Table data-ocid="engagement.entries_table">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Invoiced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.data?.map((entry, index) => (
                  <TableRow
                    key={entry.id.toString()}
                    data-ocid={`engagement.entry_row.${index + 1}`}
                    className="transition-smooth hover:bg-muted/40"
                  >
                    <TableCell className="tabular text-muted-foreground">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description || "—"}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatHours(entry.hours)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          entry.billable
                            ? "text-success"
                            : "text-muted-foreground"
                        }
                      >
                        {entry.billable ? "Billable" : "Non-billable"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          entry.invoiced ? "text-success" : "text-warning"
                        }
                      >
                        {entry.invoiced ? "Invoiced" : "Unbilled"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
          data-ocid="engagement.edit_dialog"
        >
          <DialogHeader>
            <DialogTitle>Edit engagement</DialogTitle>
            <DialogDescription>
              Update scope, billing terms, and status.
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-eng-name">Engagement name</Label>
                <Input
                  id="edit-eng-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-ocid="engagement.edit_name_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-eng-scope">Scope</Label>
                <textarea
                  id="edit-eng-scope"
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  data-ocid="engagement.edit_scope_textarea"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-eng-start">Start date</Label>
                  <Input
                    id="edit-eng-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    data-ocid="engagement.edit_start_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-eng-end">End date (optional)</Label>
                  <Input
                    id="edit-eng-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    data-ocid="engagement.edit_end_input"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-eng-model">Billing model</Label>
                  <Select
                    value={form.billingModel}
                    onValueChange={(value) =>
                      setForm({ ...form, billingModel: value as BillingModel })
                    }
                  >
                    <SelectTrigger
                      id="edit-eng-model"
                      data-ocid="engagement.edit_model_select"
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
                  <Label htmlFor="edit-eng-billable">Billable rate ($/h)</Label>
                  <Input
                    id="edit-eng-billable"
                    type="number"
                    min="0"
                    value={form.billableRate}
                    onChange={(e) =>
                      setForm({ ...form, billableRate: e.target.value })
                    }
                    data-ocid="engagement.edit_billable_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-eng-cost">Cost rate ($/h)</Label>
                  <Input
                    id="edit-eng-cost"
                    type="number"
                    min="0"
                    value={form.costRate}
                    onChange={(e) =>
                      setForm({ ...form, costRate: e.target.value })
                    }
                    data-ocid="engagement.edit_cost_input"
                  />
                </div>
              </div>
              {form.billingModel === "fixedFee" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-eng-fee">Fixed fee ($)</Label>
                  <Input
                    id="edit-eng-fee"
                    type="number"
                    min="0"
                    value={form.fixedFee}
                    onChange={(e) =>
                      setForm({ ...form, fixedFee: e.target.value })
                    }
                    data-ocid="engagement.edit_fee_input"
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="edit-eng-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as EngagementStatus })
                  }
                >
                  <SelectTrigger
                    id="edit-eng-status"
                    data-ocid="engagement.edit_status_select"
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
                  onClick={() => setEditOpen(false)}
                  data-ocid="engagement.edit_cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateEngagement.isPending}
                  data-ocid="engagement.save_button"
                >
                  {updateEngagement.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent data-ocid="engagement.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete engagement</DialogTitle>
            <DialogDescription>
              This permanently removes {e.name} and its logged time. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="engagement.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEngagement.isPending}
              data-ocid="engagement.confirm_button"
            >
              {deleteEngagement.isPending ? "Deleting…" : "Delete engagement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
