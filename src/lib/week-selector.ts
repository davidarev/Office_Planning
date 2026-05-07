/**
 * Utilities for computing selectable work weeks and the default work day.
 *
 * Builds on top of `src/lib/dates.ts` — does not reimplement date logic.
 * All returned dates are normalized to UTC midnight.
 * Functions are pure and accept an optional `referenceDate` for testability.
 *
 * @module week-selector
 */

import { normalizeDate, today, getWeekRange, toDateString } from "@/lib/dates";

/** A single working day within a work week. */
export interface WorkDay {
  /** Normalized date (UTC midnight). */
  date: Date;
  /** ISO date string "YYYY-MM-DD". */
  dateString: string;
  /** Abbreviated day name in Spanish: "Lun" | "Mar" | "Mié" | "Jue" | "Vie". */
  label: string;
  /** Day of month (1–31). */
  dayNumber: number;
}

/** A working week (Monday–Friday) with display metadata. */
export interface WorkWeek {
  /** Exactly 5 WorkDay entries, ordered Monday to Friday. */
  days: WorkDay[];
  /**
   * Human-readable range label.
   * Same-month example: "5 – 9 may"
   * Cross-month example: "30 mar – 3 abr"
   * Cross-year example: "29 dic – 2 ene"
   */
  label: string;
  /** 0 = current week, 1 = next week. */
  weekOffset: number;
}

const DAY_LABELS: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
};

const MONTH_LABELS: Record<number, string> = {
  0: "ene",
  1: "feb",
  2: "mar",
  3: "abr",
  4: "may",
  5: "jun",
  6: "jul",
  7: "ago",
  8: "sep",
  9: "oct",
  10: "nov",
  11: "dic",
};

/** Builds a WorkDay from a normalized Date. */
function buildWorkDay(date: Date): WorkDay {
  const dayOfWeek = date.getUTCDay(); // 1=Mon … 5=Fri
  return {
    date,
    dateString: toDateString(date),
    label: DAY_LABELS[dayOfWeek],
    dayNumber: date.getUTCDate(),
  };
}

/**
 * Builds the 5 WorkDay entries (Mon–Fri) for the week containing `monday`.
 * @param monday - The Monday of the target week (normalized).
 */
function buildWorkWeekDays(monday: Date): WorkDay[] {
  const days: WorkDay[] = [];
  for (let offset = 0; offset < 5; offset++) {
    const day = new Date(monday);
    day.setUTCDate(day.getUTCDate() + offset);
    days.push(buildWorkDay(normalizeDate(day)));
  }
  return days;
}

/**
 * Formats a date range label.
 * Shows month only on the end date when it differs from the start date.
 * Example same month: "5 – 9 may"
 * Example cross-month: "30 mar – 3 abr"
 */
function buildWeekLabel(start: Date, end: Date): string {
  const startMonth = start.getUTCMonth();
  const endMonth = end.getUTCMonth();
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();

  if (startMonth === endMonth) {
    return `${startDay} – ${endDay} ${MONTH_LABELS[endMonth]}`;
  }
  return `${startDay} ${MONTH_LABELS[startMonth]} – ${endDay} ${MONTH_LABELS[endMonth]}`;
}

/**
 * Returns the Monday of the week following the week that contains `date`.
 * @param date - Any normalized date.
 */
function nextWeekMonday(date: Date): Date {
  const { start: currentMonday } = getWeekRange(date);
  const monday = new Date(currentMonday);
  monday.setUTCDate(monday.getUTCDate() + 7);
  return normalizeDate(monday);
}

/**
 * Returns the two selectable work weeks: current week and next week.
 *
 * @param referenceDate - Date used as "today". Defaults to actual today.
 *   Pass explicitly in tests to avoid depending on the system clock.
 * @returns Tuple [currentWeek, nextWeek], each with 5 WorkDay entries.
 */
export function getWorkWeeks(referenceDate?: Date): [WorkWeek, WorkWeek] {
  const ref = referenceDate ? normalizeDate(referenceDate) : today();

  const { start: currentMonday } = getWeekRange(ref);
  const nextMonday = nextWeekMonday(ref);

  const currentDays = buildWorkWeekDays(currentMonday);
  const nextDays = buildWorkWeekDays(nextMonday);

  const currentWeek: WorkWeek = {
    days: currentDays,
    label: buildWeekLabel(currentDays[0].date, currentDays[4].date),
    weekOffset: 0,
  };

  const nextWeek: WorkWeek = {
    days: nextDays,
    label: buildWeekLabel(nextDays[0].date, nextDays[4].date),
    weekOffset: 1,
  };

  return [currentWeek, nextWeek];
}

/**
 * Returns the default work day to pre-select.
 *
 * - If `referenceDate` is a working day (Mon–Fri), returns that day.
 * - If it is Saturday or Sunday, returns the Monday of the following week.
 *
 * @param referenceDate - Date used as "today". Defaults to actual today.
 */
export function getDefaultWorkDay(referenceDate?: Date): WorkDay {
  const ref = referenceDate ? normalizeDate(referenceDate) : today();
  const dayOfWeek = ref.getUTCDay(); // 0=Sun, 1=Mon … 5=Fri, 6=Sat

  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    return buildWorkDay(ref);
  }

  // Weekend: advance to next Monday
  const daysUntilMonday = dayOfWeek === 6 ? 2 : 1; // Sat→+2, Sun→+1
  const nextMonday = new Date(ref);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
  return buildWorkDay(normalizeDate(nextMonday));
}
