/**
 * Date normalization and comparison utilities for the reservation system.
 *
 * All reservations are stored as day-level dates (no time component).
 * Dates are normalized to UTC midnight (00:00:00.000Z) to prevent
 * timezone-related bugs in queries and comparisons.
 *
 * @module dates
 */

/**
 * Normalizes a date to UTC midnight (YYYY-MM-DDT00:00:00.000Z).
 * Strips the time component so only the calendar day remains.
 *
 * @param input - A Date object or ISO date string (e.g. "2026-03-19")
 * @returns A new Date set to UTC 00:00:00.000
 * @throws {Error} If the input cannot be parsed into a valid date
 */
export function normalizeDate(input: Date | string): Date {
  const date = typeof input === "string" ? new Date(input) : new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(input)}`);
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/**
 * Checks whether two dates refer to the same calendar day (UTC).
 *
 * @param a - First date
 * @param b - Second date
 * @returns True if both dates fall on the same UTC day
 */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  const na = normalizeDate(a);
  const nb = normalizeDate(b);
  return na.getTime() === nb.getTime();
}

/**
 * Returns the normalized date for today (UTC midnight).
 *
 * @returns Today's date at UTC 00:00:00.000
 */
export function today(): Date {
  return normalizeDate(new Date());
}

/**
 * Formats a normalized date as an ISO date string (YYYY-MM-DD).
 *
 * @param date - A Date object
 * @returns The date portion as a string (e.g. "2026-03-19")
 */
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Validates that a date string matches the expected YYYY-MM-DD format
 * and represents a real calendar date.
 *
 * @param value - The string to validate
 * @returns True if it is a valid YYYY-MM-DD date string
 */
export function isValidDateString(value: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return false;

  const parsed = new Date(value + "T00:00:00.000Z");
  if (isNaN(parsed.getTime())) return false;

  // Verify roundtrip to catch invalid dates like 2026-02-30
  return toDateString(parsed) === value;
}

/**
 * Returns the start (Monday) and end (Friday) dates for the week
 * that contains the given date.
 *
 * @param date - A date within the desired week
 * @returns Object with `start` (Monday) and `end` (Friday), both normalized
 */
export function getWeekRange(date: Date | string): { start: Date; end: Date } {
  const normalized = normalizeDate(date);
  const dayOfWeek = normalized.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Calculate offset to Monday (day 1)
  // Sunday (0) → go back 6 days; other days → go back (day - 1) days
  const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(normalized);
  monday.setUTCDate(monday.getUTCDate() - offsetToMonday);

  const friday = new Date(monday);
  friday.setUTCDate(friday.getUTCDate() + 4);

  return { start: normalizeDate(monday), end: normalizeDate(friday) };
}
