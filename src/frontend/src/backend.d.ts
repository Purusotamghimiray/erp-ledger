import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export interface Client {
    id: ClientId;
    status: ClientStatus;
    owner: Principal;
    name: string;
    createdAt: Timestamp;
    contactPerson: string;
    email: string;
    industry: string;
}
export interface ClientFilter {
    status?: ClientStatus;
    search?: string;
    industry?: string;
}
export type ClientId = bigint;
export interface ClientInput {
    status: ClientStatus;
    name: string;
    contactPerson: string;
    email: string;
    industry: string;
}
export interface DashboardSummary {
    totalHours: bigint;
    grossMargin: bigint;
    totalCost: bigint;
    billableHours: bigint;
    totalRevenue: bigint;
    utilizationPercent: bigint;
}
export interface Engagement {
    id: EngagementId;
    status: EngagementStatus;
    clientId: ClientId;
    costRate: bigint;
    endDate?: Timestamp;
    owner: Principal;
    fixedFee?: bigint;
    billingModel: BillingModel;
    billableRate: bigint;
    name: string;
    createdAt: Timestamp;
    scope: string;
    startDate: Timestamp;
}
export interface EngagementFilter {
    status?: EngagementStatus;
    clientId?: ClientId;
    search?: string;
}
export type EngagementId = bigint;
export interface EngagementInput {
    status: EngagementStatus;
    clientId: ClientId;
    costRate: bigint;
    endDate?: Timestamp;
    fixedFee?: bigint;
    billingModel: BillingModel;
    billableRate: bigint;
    name: string;
    scope: string;
    startDate: Timestamp;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface MonthlyTrendPoint {
    month: bigint;
    revenue: bigint;
    hours: bigint;
    year: bigint;
}
export interface ProfitabilityRow {
    id: bigint;
    revenue: bigint;
    cost: bigint;
    name: string;
    margin: bigint;
    marginPercent: bigint;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface TimeEntry {
    id: TimeEntryId;
    engagementId: EngagementId;
    hours: bigint;
    owner: Principal;
    date: Timestamp;
    createdAt: Timestamp;
    expenseAmount?: bigint;
    description: string;
    billable: boolean;
    invoiced: boolean;
}
export interface TimeEntryFilter {
    to?: Timestamp;
    engagementId?: EngagementId;
    from?: Timestamp;
    billable?: boolean;
    invoiced?: boolean;
}
export type TimeEntryId = bigint;
export interface TimeEntryInput {
    engagementId: EngagementId;
    hours: bigint;
    date: Timestamp;
    expenseAmount?: bigint;
    description: string;
    billable: boolean;
}
export type Timestamp = bigint;
export interface UnbilledSummary {
    entryCount: bigint;
    unbilledHours: bigint;
    unbilledValue: bigint;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum BillingModel {
    fixedFee = "fixedFee",
    hourly = "hourly"
}
export enum ClientStatus {
    active = "active",
    lead = "lead",
    archived = "archived"
}
export enum EngagementStatus {
    active = "active",
    completed = "completed",
    proposed = "proposed",
    archived = "archived"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createClient(input: ClientInput): Promise<Client>;
    createEngagement(input: EngagementInput): Promise<Engagement>;
    createTimeEntry(input: TimeEntryInput): Promise<TimeEntry>;
    deleteClient(id: ClientId): Promise<boolean>;
    deleteEngagement(id: EngagementId): Promise<boolean>;
    deleteTimeEntry(id: TimeEntryId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getClient(id: ClientId): Promise<Client | null>;
    getClientProfitability(): Promise<Array<ProfitabilityRow>>;
    getDashboardSummary(): Promise<DashboardSummary>;
    getEngagement(id: EngagementId): Promise<Engagement | null>;
    getEngagementProfitability(): Promise<Array<ProfitabilityRow>>;
    getMonthlyTrend(months: bigint): Promise<Array<MonthlyTrendPoint>>;
    getTimeEntry(id: TimeEntryId): Promise<TimeEntry | null>;
    getUnbilledSummary(): Promise<UnbilledSummary>;
    isCallerAdmin(): Promise<boolean>;
    listClients(filter: ClientFilter): Promise<Array<Client>>;
    listEngagements(filter: EngagementFilter): Promise<Array<Engagement>>;
    listTimeEntries(filter: TimeEntryFilter): Promise<Array<TimeEntry>>;
    listWeekEntries(weekStart: Timestamp): Promise<Array<TimeEntry>>;
    schema(): Promise<string>;
    seedSampleData(): Promise<void>;
    setTimeEntryInvoiced(id: TimeEntryId, invoiced: boolean): Promise<TimeEntry | null>;
    updateClient(id: ClientId, input: ClientInput): Promise<Client | null>;
    updateEngagement(id: EngagementId, input: EngagementInput): Promise<Engagement | null>;
    updateTimeEntry(id: TimeEntryId, input: TimeEntryInput): Promise<TimeEntry | null>;
}
