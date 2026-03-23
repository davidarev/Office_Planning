/**
 * Unit tests for date normalization and comparison utilities.
 *
 * These functions are critical for the reservation system —
 * all date comparisons and storage depend on correct UTC normalization.
 */

import { describe, it, expect } from "vitest";
import {
  normalizeDate,
  isSameDay,
  today,
  toDateString,
  isValidDateString,
  getWeekRange,
} from "@/lib/dates";

/* -------------------------------------------------------------------------- */
/*  normalizeDate                                                              */
/* -------------------------------------------------------------------------- */

describe("normalizeDate", () => {
  it("normalizes a date string to UTC midnight", () => {
    const result = normalizeDate("2026-03-19");
    expect(result.toISOString()).toBe("2026-03-19T00:00:00.000Z");
  });

  it("normalizes a Date object to UTC midnight", () => {
    const input = new Date("2026-03-19T15:30:45.123Z");
    const result = normalizeDate(input);
    expect(result.toISOString()).toBe("2026-03-19T00:00:00.000Z");
  });

  it("strips time component from dates with different timezones", () => {
    const result = normalizeDate("2026-03-19T23:59:59.999Z");
    expect(result.toISOString()).toBe("2026-03-19T00:00:00.000Z");
  });

  it("handles dates at exact UTC midnight", () => {
    const result = normalizeDate("2026-03-19T00:00:00.000Z");
    expect(result.toISOString()).toBe("2026-03-19T00:00:00.000Z");
  });

  it("returns a new Date instance (no mutation)", () => {
    const input = new Date("2026-03-19T10:00:00Z");
    const result = normalizeDate(input);
    expect(result).not.toBe(input);
    expect(input.toISOString()).toBe("2026-03-19T10:00:00.000Z");
  });

  it("throws on invalid date string", () => {
    expect(() => normalizeDate("not-a-date")).toThrow("Invalid date");
  });

  it("throws on empty string", () => {
    expect(() => normalizeDate("")).toThrow("Invalid date");
  });

  it("throws on invalid Date object (NaN)", () => {
    expect(() => normalizeDate(new Date("invalid"))).toThrow("Invalid date");
  });

  it("handles leap year dates", () => {
    const result = normalizeDate("2024-02-29");
    expect(result.toISOString()).toBe("2024-02-29T00:00:00.000Z");
  });

  it("handles year boundary", () => {
    const result = normalizeDate("2025-12-31");
    expect(result.toISOString()).toBe("2025-12-31T00:00:00.000Z");
  });

  it("handles January 1st", () => {
    const result = normalizeDate("2026-01-01");
    expect(result.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

/* -------------------------------------------------------------------------- */
/*  isSameDay                                                                  */
/* -------------------------------------------------------------------------- */

describe("isSameDay", () => {
  it("returns true for same date strings", () => {
    expect(isSameDay("2026-03-19", "2026-03-19")).toBe(true);
  });

  it("returns true for same day with different times", () => {
    const a = new Date("2026-03-19T08:00:00Z");
    const b = new Date("2026-03-19T22:00:00Z");
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns false for different days", () => {
    expect(isSameDay("2026-03-19", "2026-03-20")).toBe(false);
  });

  it("returns false for same day different months", () => {
    expect(isSameDay("2026-03-19", "2026-04-19")).toBe(false);
  });

  it("returns false for same day different years", () => {
    expect(isSameDay("2025-03-19", "2026-03-19")).toBe(false);
  });

  it("handles mixed string and Date inputs", () => {
    const date = new Date("2026-03-19T12:00:00Z");
    expect(isSameDay(date, "2026-03-19")).toBe(true);
  });

  it("handles string and Date for different days", () => {
    const date = new Date("2026-03-20T00:00:00Z");
    expect(isSameDay(date, "2026-03-19")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  today                                                                      */
/* -------------------------------------------------------------------------- */

describe("today", () => {
  it("returns a date at UTC midnight", () => {
    const result = today();
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it("returns today's date (same calendar day)", () => {
    const now = new Date();
    const result = today();
    expect(result.getUTCFullYear()).toBe(now.getUTCFullYear());
    expect(result.getUTCMonth()).toBe(now.getUTCMonth());
    expect(result.getUTCDate()).toBe(now.getUTCDate());
  });
});

/* -------------------------------------------------------------------------- */
/*  toDateString                                                               */
/* -------------------------------------------------------------------------- */

describe("toDateString", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const date = new Date("2026-03-19T00:00:00.000Z");
    expect(toDateString(date)).toBe("2026-03-19");
  });

  it("pads single-digit months", () => {
    const date = new Date("2026-01-05T00:00:00.000Z");
    expect(toDateString(date)).toBe("2026-01-05");
  });

  it("pads single-digit days", () => {
    const date = new Date("2026-03-01T00:00:00.000Z");
    expect(toDateString(date)).toBe("2026-03-01");
  });

  it("handles December 31st", () => {
    const date = new Date("2026-12-31T00:00:00.000Z");
    expect(toDateString(date)).toBe("2026-12-31");
  });

  it("roundtrips with normalizeDate", () => {
    const original = "2026-06-15";
    const normalized = normalizeDate(original);
    expect(toDateString(normalized)).toBe(original);
  });
});

/* -------------------------------------------------------------------------- */
/*  isValidDateString                                                          */
/* -------------------------------------------------------------------------- */

describe("isValidDateString", () => {
  it("accepts valid YYYY-MM-DD", () => {
    expect(isValidDateString("2026-03-19")).toBe(true);
  });

  it("accepts leap day on leap year", () => {
    expect(isValidDateString("2024-02-29")).toBe(true);
  });

  it("accepts January 1st", () => {
    expect(isValidDateString("2026-01-01")).toBe(true);
  });

  it("accepts December 31st", () => {
    expect(isValidDateString("2026-12-31")).toBe(true);
  });

  it("rejects Feb 30", () => {
    expect(isValidDateString("2026-02-30")).toBe(false);
  });

  it("rejects Feb 29 on non-leap year", () => {
    expect(isValidDateString("2026-02-29")).toBe(false);
  });

  it("rejects month 13", () => {
    expect(isValidDateString("2026-13-01")).toBe(false);
  });

  it("rejects day 32", () => {
    expect(isValidDateString("2026-01-32")).toBe(false);
  });

  it("rejects month 00", () => {
    expect(isValidDateString("2026-00-15")).toBe(false);
  });

  it("rejects day 00", () => {
    expect(isValidDateString("2026-03-00")).toBe(false);
  });

  it("rejects wrong format with slashes", () => {
    expect(isValidDateString("2026/03/19")).toBe(false);
  });

  it("rejects datetime format", () => {
    expect(isValidDateString("2026-03-19T00:00:00Z")).toBe(false);
  });

  it("rejects short year", () => {
    expect(isValidDateString("26-03-19")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidDateString("")).toBe(false);
  });

  it("rejects random text", () => {
    expect(isValidDateString("hello")).toBe(false);
  });

  it("rejects single digit month/day", () => {
    expect(isValidDateString("2026-3-9")).toBe(false);
  });

  it("rejects April 31st (April has 30 days)", () => {
    expect(isValidDateString("2026-04-31")).toBe(false);
  });

  it("rejects June 31st", () => {
    expect(isValidDateString("2026-06-31")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  getWeekRange                                                               */
/* -------------------------------------------------------------------------- */

describe("getWeekRange", () => {
  it("returns Monday-Friday for a Wednesday", () => {
    // 2026-03-18 is a Wednesday
    const { start, end } = getWeekRange("2026-03-18");
    expect(toDateString(start)).toBe("2026-03-16"); // Monday
    expect(toDateString(end)).toBe("2026-03-20");   // Friday
  });

  it("returns Monday-Friday for a Monday", () => {
    // 2026-03-16 is a Monday
    const { start, end } = getWeekRange("2026-03-16");
    expect(toDateString(start)).toBe("2026-03-16");
    expect(toDateString(end)).toBe("2026-03-20");
  });

  it("returns Monday-Friday for a Friday", () => {
    // 2026-03-20 is a Friday
    const { start, end } = getWeekRange("2026-03-20");
    expect(toDateString(start)).toBe("2026-03-16");
    expect(toDateString(end)).toBe("2026-03-20");
  });

  it("returns previous Monday-Friday for a Saturday", () => {
    // 2026-03-21 is a Saturday
    const { start, end } = getWeekRange("2026-03-21");
    expect(toDateString(start)).toBe("2026-03-16");
    expect(toDateString(end)).toBe("2026-03-20");
  });

  it("returns previous Monday-Friday for a Sunday", () => {
    // 2026-03-22 is a Sunday → previous week's Monday
    const { start, end } = getWeekRange("2026-03-22");
    expect(toDateString(start)).toBe("2026-03-16");
    expect(toDateString(end)).toBe("2026-03-20");
  });

  it("handles week that spans month boundary", () => {
    // 2026-03-30 is a Monday, Friday is April 3
    const { start, end } = getWeekRange("2026-04-01");
    expect(toDateString(start)).toBe("2026-03-30");
    expect(toDateString(end)).toBe("2026-04-03");
  });

  it("handles week that spans year boundary", () => {
    // 2025-12-31 is a Wednesday
    const { start, end } = getWeekRange("2025-12-31");
    expect(toDateString(start)).toBe("2025-12-29"); // Monday
    expect(toDateString(end)).toBe("2026-01-02");   // Friday
  });

  it("start and end are both at UTC midnight", () => {
    const { start, end } = getWeekRange("2026-03-18");
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
    expect(end.getUTCHours()).toBe(0);
    expect(end.getUTCMinutes()).toBe(0);
  });

  it("accepts Date object input", () => {
    const input = new Date("2026-03-18T15:00:00Z");
    const { start, end } = getWeekRange(input);
    expect(toDateString(start)).toBe("2026-03-16");
    expect(toDateString(end)).toBe("2026-03-20");
  });

  it("Tuesday gives correct Monday", () => {
    // 2026-03-17 is a Tuesday
    const { start } = getWeekRange("2026-03-17");
    expect(toDateString(start)).toBe("2026-03-16");
  });

  it("Thursday gives correct Friday", () => {
    // 2026-03-19 is a Thursday
    const { end } = getWeekRange("2026-03-19");
    expect(toDateString(end)).toBe("2026-03-20");
  });
});
