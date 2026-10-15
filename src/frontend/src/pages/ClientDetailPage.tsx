import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Mail,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  BillingModelBadge,
  ClientStatusBadge,
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
import {
  useClient,
  useDeleteClient,
  useUpdateClient,
} from "@/hooks/use-clients";
import { useEngagements } from "@/hooks/use-engagements";
import { useTimeEntries } from "@/hooks/use-time";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { CLIENT_STATUSES, CLIENT_STATUS_LABEL } from "@/types/domain";
import type { ClientInput, ClientStatus } from "@/types/domain";

export function ClientDetailPage() {
  const { clientId } = useParams({ from: "/clients/$clientId" });
  const navigate = useNavigate();
  const id = BigInt(clientId);

  const client = useClient(id);
  const engagements = useEngagements({ clientId: id });
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<ClientInput | null>(null);

  const engagementIds = useMemo(
    () => (engagements.data ?? []).map((e) => e.id),
    [engagements.data],
  );

  const entries = useTimeEntries({});

  const clientEntries = useMemo(
    () =>
      (entries.data ?? []).filter((entry) =>
        engagementIds.some((eid) => eid === entry.engagementId),
      ),
    [entries.data, engagementIds],
  );

  const totals = useMemo(() => {
    const engagementById = new Map(
      (engagements.data ?? []).map((e) => [e.id.toString(), e]),
    );
    let hours = 0n;
    let revenue = 0n;
    for (const entry of clientEntries) {
      hours += entry.hours;
      if (entry.billable) {
        const engagement = engagementById.get(entry.engagementId.toString());
        if (engagement) revenue += entry.hours * engagement.billableRate;
      }
    }
    return { hours, revenue };
  }, [clientEntries, engagements.data]);

  function openEdit() {
    if (!client.data) return;
    setForm({
      name: client.data.name,
      contactPerson: client.data.contactPerson,
      email: client.data.email,
      industry: client.data.industry,
      status: client.data.status,
    });
    setEditOpen(true);
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    updateClient.mutate(
      { id, input: form },
      {
        onSuccess: () => {
          toast.success("Client updated");
          setEditOpen(false);
        },
        onError: () => toast.error("Could not update client"),
      },
    );
  }

  function handleDelete() {
    deleteClient.mutate(id, {
      onSuccess: () => {
        toast.success("Client deleted");
        void navigate({ to: "/clients", search: {} });
      },
      onError: () => toast.error("Could not delete client"),
    });
  }

  if (client.isLoading) {
    return (
      <>
        <PageHeader title="Client" />
        <div data-ocid="client.loading_state" className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
      </>
    );
  }

  if (!client.data) {
    return (
      <>
        <PageHeader title="Client not found" />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={User}
            title="This client no longer exists"
            description="It may have been deleted. Return to the directory to pick another."
            ocid="client.error_state"
            action={
              <Button asChild>
                <Link to="/clients" search={{}} data-ocid="client.back_button">
                  Back to clients
                </Link>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const c = client.data;

  return (
    <>
      <PageHeader
        title={c.name}
        description={`${c.industry || "Industry not set"} · added ${formatDate(c.createdAt)}`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openEdit}
              data-ocid="client.edit_button"
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
              data-ocid="client.delete_button"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/clients" search={{}} data-ocid="client.back_link">
              <ArrowLeft className="size-4" aria-hidden="true" />
              All clients
            </Link>
          </Button>
          <ClientStatusBadge status={c.status} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="Engagements"
            value={String(engagements.data?.length ?? 0)}
            hint="Linked to this client"
            icon={Briefcase}
          />
          <KpiCard
            index={1}
            label="Logged hours"
            value={formatHours(totals.hours)}
            hint="Across all engagements"
            icon={Clock}
          />
          <KpiCard
            index={2}
            label="Revenue to date"
            value={formatCurrency(totals.revenue)}
            hint="Billable value logged"
            icon={Mail}
            accent="success"
          />
          <KpiCard
            index={3}
            label="Contact"
            value={c.contactPerson || "—"}
            hint={c.email}
            icon={User}
            accent="accent"
          />
        </div>

        <SectionCard
          title="Engagements"
          description="Projects delivered for this client."
          ocid="client.engagements_panel"
        >
          {engagements.isLoading ? (
            <Skeleton className="h-40 rounded-md" />
          ) : (engagements.data?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No engagements yet for this client.
            </p>
          ) : (
            <Table data-ocid="client.engagements_table">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Start</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagements.data?.map((engagement, index) => (
                  <TableRow
                    key={engagement.id.toString()}
                    data-ocid={`client.engagement_row.${index + 1}`}
                    className="transition-smooth hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">
                      <Link
                        to="/engagements/$engagementId"
                        params={{ engagementId: engagement.id.toString() }}
                        className="transition-smooth hover:text-primary"
                      >
                        {engagement.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <BillingModelBadge model={engagement.billingModel} />
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
          )}
        </SectionCard>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-ocid="client.edit_dialog">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription>Update this client's details.</DialogDescription>
          </DialogHeader>
          {form ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-client-name">Client name</Label>
                <Input
                  id="edit-client-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-ocid="client.edit_name_input"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-client-contact">Contact person</Label>
                  <Input
                    id="edit-client-contact"
                    value={form.contactPerson}
                    onChange={(e) =>
                      setForm({ ...form, contactPerson: e.target.value })
                    }
                    data-ocid="client.edit_contact_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-client-email">Email</Label>
                  <Input
                    id="edit-client-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    data-ocid="client.edit_email_input"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-client-industry">Industry</Label>
                  <Input
                    id="edit-client-industry"
                    value={form.industry}
                    onChange={(e) =>
                      setForm({ ...form, industry: e.target.value })
                    }
                    data-ocid="client.edit_industry_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-client-status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm({ ...form, status: value as ClientStatus })
                    }
                  >
                    <SelectTrigger
                      id="edit-client-status"
                      data-ocid="client.edit_status_select"
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
                  onClick={() => setEditOpen(false)}
                  data-ocid="client.edit_cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateClient.isPending}
                  data-ocid="client.save_button"
                >
                  {updateClient.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent data-ocid="client.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete client</DialogTitle>
            <DialogDescription>
              This permanently removes {c.name} and its engagements. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="client.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteClient.isPending}
              data-ocid="client.confirm_button"
            >
              {deleteClient.isPending ? "Deleting…" : "Delete client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
