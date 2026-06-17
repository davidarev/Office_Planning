/**
 * Unit tests for week-selector.ts — getWorkWeeks and getDefaultWorkDay.
 *
 * All tests use the `referenceDate` parameter to avoid depending on the
 * system clock. No global Date mocking needed.
 */

import { describe, it, expect } from "vitest";
import { getWorkWeeks, getDefaultWorkDay } from "@/lib/week-selector";
import { toDateString } from "@/lib/dates";

/* -------------------------------------------------------------------------- */
/*  getWorkWeeks                                                               */
/* -------------------------------------------------------------------------- */

describe("getWorkWeeks", () => {
  describe("structure invariants", () => {
    it("returns exactly 2 weeks", () => {
      const weeks = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      expect(weeks).toHaveLength(2);
    });

    it("each week has exactly 5 days", () => {
      const [current, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      expect(current.days).toHaveLength(5);
      expect(next.days).toHaveLength(5);
    });

    it("weekOffset is 0 for current and 1 for next", () => {
      const [current, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      expect(current.weekOffset).toBe(0);
      expect(next.weekOffset).toBe(1);
    });

    it("all days are at UTC midnight", () => {
      const [current, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      for (const week of [current, next]) {
        for (const day of week.days) {
          expect(day.date.getUTCHours()).toBe(0);
          expect(day.date.getUTCMinutes()).toBe(0);
          expect(day.date.getUTCSeconds()).toBe(0);
          expect(day.date.getUTCMilliseconds()).toBe(0);
        }
      }
    });

    it("days are ordered Mon–Fri (getUTCDay 1–5)", () => {
      const [current, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      for (const week of [current, next]) {
        week.days.forEach((day, i) => {
          expect(day.date.getUTCDay()).toBe(i + 1);
        });
      }
    });

    it("dateString matches YYYY-MM-DD format for all days", () => {
      const [current, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      for (const week of [current, next]) {
        for (const day of week.days) {
          expect(day.dateString).toMatch(regex);
          expect(day.dateString).toBe(toDateString(day.date));
        }
      }
    });

    it("the two weeks do not overlap", () => {
      const [current, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      const currentDates = new Set(current.days.map((d) => d.dateString));
      for (const day of next.days) {
        expect(currentDates.has(day.dateString)).toBe(false);
      }
    });

    it("next week starts exactly 7 days after current week", () => {
      const [current, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      const diff =
        next.days[0].date.getTime() - current.days[0].date.getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe("day labels", () => {
    it("labels follow Lun, Mar, Mié, Jue, Vie order", () => {
      const [current] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      expect(current.days.map((d) => d.label)).toEqual([
        "Lun",
        "Mar",
        "Mié",
        "Jue",
        "Vie",
      ]);
    });

    it("dayNumber matches getUTCDate of the day", () => {
      const [current] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      for (const day of current.days) {
        expect(day.dayNumber).toBe(day.date.getUTCDate());
      }
    });
  });

  describe("referenceDate = Wednesday (mid-week)", () => {
    // 2026-05-06 is a Wednesday
    it("current week is Mon 4 – Fri 8 may", () => {
      const [current] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      expect(current.days[0].dateString).toBe("2026-05-04"); // Mon
      expect(current.days[4].dateString).toBe("2026-05-08"); // Fri
    });

    it("next week is Mon 11 – Fri 15 may", () => {
      const [, next] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      expect(next.days[0].dateString).toBe("2026-05-11");
      expect(next.days[4].dateString).toBe("2026-05-15");
    });

    it("current week label is '4 – 8 may'", () => {
      const [current] = getWorkWeeks(new Date("2026-05-06T00:00:00.000Z"));
      expect(current.label).toBe("4 – 8 may");
    });
  });

  describe("referenceDate = Monday", () => {
    // 2026-05-04 is a Monday
    it("current week starts on the same Monday", () => {
      const [current] = getWorkWeeks(new Date("2026-05-04T00:00:00.000Z"));
      expect(current.days[0].dateString).toBe("2026-05-04");
    });
  });

  describe("referenceDate = Friday", () => {
    // 2026-05-08 is a Friday
    it("current week ends on that Friday", () => {
      const [current] = getWorkWeeks(new Date("2026-05-08T00:00:00.000Z"));
      expect(current.days[4].dateString).toBe("2026-05-08");
    });

    it("next week starts the following Monday", () => {
      const [, next] = getWorkWeeks(new Date("2026-05-08T00:00:00.000Z"));
      expect(next.days[0].dateString).toBe("2026-05-11");
    });
  });

  describe("referenceDate = Saturday", () => {
    // 2026-05-09 is a Saturday — getWeekRange returns the Mon-Fri of that calendar week
    it("current week is Mon 4 – Fri 8 may (same calendar week)", () => {
      const [current] = getWorkWeeks(new Date("2026-05-09T00:00:00.000Z"));
      expect(current.days[0].dateString).toBe("2026-05-04");
      expect(current.days[4].dateString).toBe("2026-05-08");
    });

    it("next week is Mon 11 – Fri 15 may", () => {
      const [, next] = getWorkWeeks(new Date("2026-05-09T00:00:00.000Z"));
      expect(next.days[0].dateString).toBe("2026-05-11");
    });
  });

  describe("referenceDate = Sunday", () => {
    // 2026-05-10 is a Sunday
    it("current week is Mon 4 – Fri 8 may (same calendar week)", () => {
      const [current] = getWorkWeeks(new Date("2026-05-10T00:00:00.000Z"));
      expect(current.days[0].dateString).toBe("2026-05-04");
    });

    it("next week is Mon 11 – Fri 15 may", () => {
      const [, next] = getWorkWeeks(new Date("2026-05-10T00:00:00.000Z"));
      expect(next.days[0].dateString).toBe("2026-05-11");
    });
  });

  describe("cross-month week", () => {
    // 2026-03-31 is a Tuesday; week is Mon 30 mar – Fri 3 abr
    it("days span March and April correctly", () => {
      const [current] = getWorkWeeks(new Date("2026-03-31T00:00:00.000Z"));
      expect(current.days[0].dateString).toBe("2026-03-30"); // Mon
      expect(current.days[4].dateString).toBe("2026-04-03"); // Fri
    });

    it("label shows both months", () => {
      const [current] = getWorkWeeks(new Date("2026-03-31T00:00:00.000Z"));
      expect(current.label).toBe("30 mar – 3 abr");
    });
  });

  describe("cross-year week", () => {
    // 2025-12-31 is a Wednesday; week is Mon 29 dic – Fri 2 ene
    it("days span December and January correctly", () => {
      const [current] = getWorkWeeks(new Date("2025-12-31T00:00:00.000Z"));
      expect(current.days[0].dateString).toBe("2025-12-29"); // Mon
      expect(current.days[4].dateString).toBe("2026-01-02"); // Fri
    });

    it("label shows both months across year boundary", () => {
      const [current] = getWorkWeeks(new Date("2025-12-31T00:00:00.000Z"));
      expect(current.label).toBe("29 dic – 2 ene");
    });
  });
});

/* -------------------------------------------------------------------------- */
/*  getDefaultWorkDay                                                          */
/* -------------------------------------------------------------------------- */

describe("getDefaultWorkDay", () => {
  it("returns Monday itself when referenceDate is Monday", () => {
    // 2026-05-04 is a Monday
    const day = getDefaultWorkDay(new Date("2026-05-04T00:00:00.000Z"));
    expect(day.dateString).toBe("2026-05-04");
    expect(day.label).toBe("Lun");
  });

  it("returns Wednesday itself when referenceDate is Wednesday", () => {
    // 2026-05-06 is a Wednesday
    const day = getDefaultWorkDay(new Date("2026-05-06T00:00:00.000Z"));
    expect(day.dateString).toBe("2026-05-06");
    expect(day.label).toBe("Mié");
  });

  it("returns Friday itself when referenceDate is Friday", () => {
    // 2026-05-08 is a Friday
    const day = getDefaultWorkDay(new Date("2026-05-08T00:00:00.000Z"));
    expect(day.dateString).toBe("2026-05-08");
    expect(day.label).toBe("Vie");
  });

  it("returns next Monday when referenceDate is Saturday", () => {
    // 2026-05-09 is a Saturday → next Monday is 2026-05-11
    const day = getDefaultWorkDay(new Date("2026-05-09T00:00:00.000Z"));
    expect(day.dateString).toBe("2026-05-11");
    expect(day.label).toBe("Lun");
  });

  it("returns next Monday when referenceDate is Sunday", () => {
    // 2026-05-10 is a Sunday → next Monday is 2026-05-11
    const day = getDefaultWorkDay(new Date("2026-05-10T00:00:00.000Z"));
    expect(day.dateString).toBe("2026-05-11");
    expect(day.label).toBe("Lun");
  });

  it("returned day is at UTC midnight", () => {
    const day = getDefaultWorkDay(new Date("2026-05-06T00:00:00.000Z"));
    expect(day.date.getUTCHours()).toBe(0);
    expect(day.date.getUTCMinutes()).toBe(0);
    expect(day.date.getUTCSeconds()).toBe(0);
  });

  it("dateString matches date field", () => {
    const day = getDefaultWorkDay(new Date("2026-05-06T00:00:00.000Z"));
    expect(day.dateString).toBe(toDateString(day.date));
  });

  it("Saturday across month boundary returns correct next Monday", () => {
    // 2026-05-30 is a Saturday → next Monday is 2026-06-01
    const day = getDefaultWorkDay(new Date("2026-05-30T00:00:00.000Z"));
    expect(day.dateString).toBe("2026-06-01");
    expect(day.label).toBe("Lun");
  });

  it("Saturday across year boundary returns correct next Monday", () => {
    // 2025-12-27 is a Saturday → next Monday is 2025-12-29
    const day = getDefaultWorkDay(new Date("2025-12-27T00:00:00.000Z"));
    expect(day.dateString).toBe("2025-12-29");
    expect(day.label).toBe("Lun");
  });
});
