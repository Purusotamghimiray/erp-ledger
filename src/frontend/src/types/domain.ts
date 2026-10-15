import type {
  Client,
  ClientFilter,
  ClientInput,
  DashboardSummary,
  Engagement,
  EngagementFilter,
  EngagementInput,
  MonthlyTrendPoint,
  ProfitabilityRow,
  TimeEntry,
  TimeEntryFilter,
  TimeEntryInput,
  UnbilledSummary,
} from "@/backend";
import { BillingModel, ClientStatus, EngagementStatus } from "@/backend";

export type {
  Client,
  ClientFilter,
  ClientInput,
  DashboardSummary,
  Engagement,
  EngagementFilter,
  EngagementInput,
  MonthlyTrendPoint,
  ProfitabilityRow,
  TimeEntry,
  TimeEntryFilter,
  TimeEntryInput,
  UnbilledSummary,
};

export { BillingModel, ClientStatus, EngagementStatus };

export type ClientId = bigint;
export type EngagementId = bigint;
export type TimeEntryId = bigint;

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  [ClientStatus.lead]: "Lead",
  [ClientStatus.active]: "Active",
  [ClientStatus.archived]: "Archived",
};

export const ENGAGEMENT_STATUS_LABEL: Record<EngagementStatus, string> = {
  [EngagementStatus.proposed]: "Proposed",
  [EngagementStatus.active]: "Active",
  [EngagementStatus.completed]: "Completed",
  [EngagementStatus.archived]: "Archived",
};

export const BILLING_MODEL_LABEL: Record<BillingModel, string> = {
  [BillingModel.hourly]: "Hourly",
  [BillingModel.fixedFee]: "Fixed fee",
};

export const CLIENT_STATUSES: ClientStatus[] = [
  ClientStatus.lead,
  ClientStatus.active,
  ClientStatus.archived,
];

export const ENGAGEMENT_STATUSES: EngagementStatus[] = [
  EngagementStatus.proposed,
  EngagementStatus.active,
  EngagementStatus.completed,
  EngagementStatus.archived,
];
