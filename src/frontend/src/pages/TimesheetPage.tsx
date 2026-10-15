import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, SectionCard } from "@/components/common";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEngagements } from "@/hooks/use-engagements";
import {
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useSetInvoiced,
  useUpdateTimeEntry,
  useWeekEntries,
} from "@/hooks/use-time";
import {
  addWeeks,
  formatCurrency,
  formatDate,
  formatHours,
  fromDateInputValue,
  isSameDay,
  startOfWeek,
  toDateInputValue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TimeEntry, TimeEntryInput } from "@/types/domain";

type EntryFormState = {
  engagementId: string;
  date: string;
  hours: string;
  billable: boolean;
  description: string;
  expenseAmount: string;
};

function emptyForm(date: Date): EntryFormState {
  return {
    engagementId: "",
    date: toDateInputValue(BigInt(date.getTime()) * 1_000_000n),
    hours: "",
    billable: true,
    description: "",
    expenseAmount: "",
  };
}

function EntryFormDialog({
  open,
  onOpenChange,
  editing,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TimeEntry | null;
  defaultDate: Date;
}) {
  const formKey = editing
    ? editing.id.toString()
    : `new-${defaultDate.toISOString()}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="timesheet.dialog">
        {open ? (
          <EntryForm
            key={formKey}
            editing={editing}
            defaultDate={defaultDate}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EntryForm({
  editing,
  defaultDate,
  onClose,
}: {
  editing: TimeEntry | null;
  defaultDate: Date;
  onClose: () => void;
}) {
  const engagements = useEngagements({});
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();

  const [form, setForm] = useState<EntryFormState>(() =>
    editing
      ? {
          engagementId: editing.engagementId.toString(),
          date: toDateInputValue(editing.date),
          hours: editing.hours.toString(),
          billable: editing.billable,
          description: editing.description,
          expenseAmount: editing.expenseAmount
            ? editing.expenseAmount.toString()
            : "",
        }
      : emptyForm(defaultDate),
  );

  const canSubmit =
    form.engagementId !== "" &&
    form.date !== "" &&
    form.hours !== "" &&
    Number.isInteger(Number(form.hours)) &&
    Number(form.hours) > 0;

  const pending = createEntry.isPending || updateEntry.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const dateTs = fromDateInputValue(form.date);
    if (dateTs === null) return;
    const input: TimeEntryInput = {
      engagementId: BigInt(form.engagementId),
      date: dateTs,
      hours: BigInt(Math.round(Number(form.hours))),
      billable: form.billable,
      description: form.description.trim(),
      expenseAmount: form.expenseAmount
        ? BigInt(Math.round(Number(form.expenseAmount)))
        : undefined,
    };
    if (editing) {
      updateEntry.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success("Entry updated");
            onClose();
          },
          onError: () => toast.error("Could not update entry"),
        },
      );
    } else {
      createEntry.mutate(input, {
        onSuccess: () => {
          toast.success("Time logged");
          onClose();
        },
        onError: () => toast.error("Could not log time"),
      });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit time entry" : "Log time"}</DialogTitle>
        <DialogDescription>
          Record hours against an engagement.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="entry-engagement">Engagement</Label>
          <Select
            value={form.engagementId}
            onValueChange={(value) => setForm({ ...form, engagementId: value })}
          >
            <SelectTrigger
              id="entry-engagement"
              data-ocid="timesheet.engagement_select"
            >
              <SelectValue placeholder="Select an engagement" />
            </SelectTrigger>
            <SelectContent>
              {(engagements.data ?? []).map((engagement) => (
                <SelectItem
                  key={engagement.id.toString()}
                  value={engagement.id.toString()}
                >
                  {engagement.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-date">Date</Label>
            <Input
              id="entry-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              data-ocid="timesheet.date_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entry-hours">Hours</Label>
            <Input
              id="entry-hours"
              type="number"
              min="1"
              step="1"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder="8"
              data-ocid="timesheet.hours_input"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="entry-description">Work description</Label>
          <textarea
            id="entry-description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Configured chart of accounts and validated opening balances."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            data-ocid="timesheet.description_textarea"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-expense">Expense amount ($, optional)</Label>
            <Input
              id="entry-expense"
              type="number"
              min="0"
              value={form.expenseAmount}
              onChange={(e) =>
                setForm({ ...form, expenseAmount: e.target.value })
              }
              placeholder="0"
              data-ocid="timesheet.expense_input"
            />
          </div>
          <div className="flex items-end">
            <div className="flex w-full items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
              <Label htmlFor="entry-billable" className="cursor-pointer">
                Billable
              </Label>
              <Switch
                id="entry-billable"
                checked={form.billable}
                onCheckedChange={(checked) =>
                  setForm({ ...form, billable: checked })
                }
                data-ocid="timesheet.billable_switch"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-ocid="timesheet.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit || pending}
            data-ocid="timesheet.submit_button"
          >
            {pending ? "Saving…" : editing ? "Save entry" : "Log time"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function TimesheetPage() {
  const search = useSearch({ from: "/timesheet" });
  const navigate = useNavigate();

  const weekStart = useMemo(() => {
    if (search.week) {
      const parsed = new Date(`${search.week}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return startOfWeek(parsed);
    }
    return startOfWeek(new Date());
  }, [search.week]);

  const weekStartTs = BigInt(weekStart.getTime()) * 1_000_000n;
  const entries = useWeekEntries(weekStartTs);
  const engagements = useEngagements({});
  const deleteEntry = useDeleteTimeEntry();
  const setInvoiced = useSetInvoiced();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date>(weekStart);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);

  const engagementName = useMemo(() => {
    const map = new Map(
      (engagements.data ?? []).map((e) => [e.id.toString(), e.name]),
    );
    return (id: bigint) => map.get(id.toString()) ?? "Unknown engagement";
  }, [engagements.data]);

  const days = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => new Date(weekStart.getTime() + i * 86_400_000),
      ),
    [weekStart],
  );

  const totals = useMemo(() => {
    const list = entries.data ?? [];
    let hours = 0n;
    let billable = 0n;
    let unbilledValue = 0n;
    const engagementById = new Map(
      (engagements.data ?? []).map((e) => [e.id.toString(), e]),
    );
    for (const entry of list) {
      hours += entry.hours;
      if (entry.billable) {
        billable += entry.hours;
        if (!entry.invoiced) {
          const engagement = engagementById.get(entry.engagementId.toString());
          if (engagement)
            unbilledValue += entry.hours * engagement.billableRate;
        }
      }
    }
    return { hours, billable, unbilledValue };
  }, [entries.data, engagements.data]);

  function goToWeek(offset: number) {
    const next = addWeeks(weekStart, offset);
    void navigate({
      to: "/timesheet",
      search: { week: toDateInputValue(BigInt(next.getTime()) * 1_000_000n) },
    });
  }

  function openNew(date?: Date) {
    setEditing(null);
    setDefaultDate(date ?? weekStart);
    setDialogOpen(true);
  }

  function openEdit(entry: TimeEntry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteEntry.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Entry deleted");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Could not delete entry"),
    });
  }

  function toggleInvoiced(entry: TimeEntry) {
    setInvoiced.mutate(
      { id: entry.id, invoiced: !entry.invoiced },
      {
        onSuccess: () =>
          toast.success(entry.invoiced ? "Marked unbilled" : "Marked invoiced"),
        onError: () => toast.error("Could not update entry"),
      },
    );
  }

  const weekLabel = `${formatDate(BigInt(weekStart.getTime()) * 1_000_000n)} – ${formatDate(
    BigInt(addWeeks(weekStart, 1).getTime() - 86_400_000) * 1_000_000n,
  )}`;

  return (
    <>
      <PageHeader
        title="Timesheet"
        description="Review, edit, and invoice the hours logged this week."
        actions={
          <Button
            type="button"
            onClick={() => openNew()}
            data-ocid="timesheet.open_modal_button"
          >
            <Plus className="size-4" aria-hidden="true" />
            Log time
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-4 shadow-subtle">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => goToWeek(-1)}
              aria-label="Previous week"
              data-ocid="timesheet.pagination_prev"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-[13rem] text-center">
              <p className="label-caps">Week of</p>
              <p className="tabular text-sm font-medium text-foreground">
                {weekLabel}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => goToWeek(1)}
              aria-label="Next week"
              data-ocid="timesheet.pagination_next"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="label-caps">Logged</p>
              <p className="tabular text-sm font-medium text-foreground">
                {formatHours(totals.hours)}
              </p>
            </div>
            <div>
              <p className="label-caps">Billable</p>
              <p className="tabular text-sm font-medium text-success">
                {formatHours(totals.billable)}
              </p>
            </div>
            <div>
              <p className="label-caps">Unbilled value</p>
              <p className="tabular text-sm font-medium text-warning">
                {formatCurrency(totals.unbilledValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day, index) => {
            const dayEntries = (entries.data ?? []).filter((entry) => {
              const d = new Date(Number(entry.date / 1_000_000n));
              return isSameDay(d, day);
            });
            const dayHours = dayEntries.reduce((sum, e) => sum + e.hours, 0n);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => openNew(day)}
                data-ocid={`timesheet.day.${index + 1}`}
                className={cn(
                  "rounded-md border border-border bg-card p-3 text-left shadow-subtle transition-smooth hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                <p className="label-caps">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="tabular mt-1 text-lg font-semibold text-foreground">
                  {day.getDate()}
                </p>
                <p className="tabular mt-1 text-xs text-muted-foreground">
                  {dayHours > 0n ? formatHours(dayHours) : "—"}
                </p>
              </button>
            );
          })}
        </div>

        <SectionCard
          title="This week's entries"
          description="Edit, invoice, or remove logged time."
          ocid="timesheet.entries_panel"
        >
          {entries.isLoading ? (
            <div data-ocid="timesheet.loading_state" className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => `entry-skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-12 rounded-md" />
                ),
              )}
            </div>
          ) : (entries.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Clock}
              title="No time logged this week"
              description="Log your first entry for the week, or move to another week to review past work."
              ocid="timesheet.empty_state"
              action={
                <Button
                  type="button"
                  onClick={() => openNew()}
                  data-ocid="timesheet.empty_add_button"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Log time
                </Button>
              }
            />
          ) : (
            <Table data-ocid="timesheet.table">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Invoiced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.data?.map((entry, index) => (
                  <TableRow
                    key={entry.id.toString()}
                    data-ocid={`timesheet.row.${index + 1}`}
                    className="transition-smooth hover:bg-muted/40"
                  >
                    <TableCell className="tabular text-muted-foreground">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate font-medium">
                      {engagementName(entry.engagementId)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleInvoiced(entry)}
                        disabled={setInvoiced.isPending}
                        className={cn(
                          "h-7 px-2 text-xs",
                          entry.invoiced ? "text-success" : "text-warning",
                        )}
                        data-ocid={`timesheet.invoiced_toggle.${index + 1}`}
                      >
                        {entry.invoiced ? "Invoiced" : "Unbilled"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(entry)}
                          aria-label="Edit entry"
                          data-ocid={`timesheet.edit_button.${index + 1}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(entry)}
                          aria-label="Delete entry"
                          className="text-destructive hover:text-destructive"
                          data-ocid={`timesheet.delete_button.${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      <EntryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultDate={defaultDate}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="timesheet.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete time entry</DialogTitle>
            <DialogDescription>
              This permanently removes the logged entry. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="timesheet.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
              data-ocid="timesheet.confirm_button"
            >
              {deleteEntry.isPending ? "Deleting…" : "Delete entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
