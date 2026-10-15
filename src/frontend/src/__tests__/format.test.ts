import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatHours,
  formatPercent,
  monthLabel,
} from "@/lib/format";

describe("monthLabel", () => {
  it("renders a short month name for a valid 1-based month", () => {
    expect(monthLabel(2024, 1)).toBe("Jan");
    expect(monthLabel(2024, 12)).toBe("Dec");
    expect(monthLabel(2023, 6)).toBe("Jun");
  });

  it("returns an empty string instead of throwing for an out-of-range month", () => {
    // A backend trend point with month 0 or 13 must not crash the dashboard
    // chart; the guard degrades to an empty label.
    expect(monthLabel(2024, 0)).toBe("");
    expect(monthLabel(2024, 13)).toBe("");
    expect(monthLabel(2024, -1)).toBe("");
  });

  it("returns an empty string for non-finite year or month", () => {
    expect(monthLabel(Number.NaN, 6)).toBe("");
    expect(monthLabel(2024, Number.NaN)).toBe("");
    expect(monthLabel(Number.POSITIVE_INFINITY, 6)).toBe("");
    expect(monthLabel(2024, Number.NEGATIVE_INFINITY)).toBe("");
  });
});

describe("format helpers", () => {
  it("formats currency without fractional dollars", () => {
    expect(formatCurrency(10_000n)).toBe("$10,000");
    expect(formatCurrency(0n)).toBe("$0");
  });

  it("formats hours with a trailing unit", () => {
    expect(formatHours(80n)).toBe("80h");
    expect(formatHours(7.5)).toBe("7.5h");
  });

  it("formats percentages", () => {
    expect(formatPercent(80n)).toBe("80%");
    expect(formatPercent(12.5)).toBe("12.5%");
  });
});
