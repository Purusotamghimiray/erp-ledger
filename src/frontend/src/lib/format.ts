import { format } from "date-fns";

/** Motoko `Time.now()` values are nanosecond bigints. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateToTimestamp(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  return date ? format(date, "d MMM yyyy") : "—";
}

export function formatDateShort(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  return date ? format(date, "d MMM") : "—";
}

export function toDateInputValue(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function fromDateInputValue(value: string): bigint | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : dateToTimestamp(date);
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: bigint | number): string {
  return currency.format(Number(amount));
}

export function formatHours(hours: bigint | number): string {
  const value = Number(hours);
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}h`;
}

export function formatPercent(value: bigint | number): string {
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

export function formatNumber(value: bigint | number): string {
  return Number(value).toLocaleString("en-US");
}

/** Convert a `yyyy-MM-dd` input value into a Date at local midnight. */
export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Short month label (e.g. "Jan") for a year/month pair.
 *
 * `month` is treated as 1-based (1 = January). Values that cannot produce a
 * valid Date — non-finite numbers, or a month outside 1–12 — fall back to an
 * empty string instead of throwing `RangeError: Invalid time value` from
 * date-fns `format`.
 */
export function monthLabel(year: number, month: number): string {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return "";
  if (month < 1 || month > 12) return "";
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM");
}
