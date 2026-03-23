/**
 * Integration tests for the availability service.
 *
 * Tests getTableAvailabilityForDate and getTableAvailabilityForRange
 * against a real (in-memory) MongoDB instance to verify the full
 * pipeline: DB queries → status computation → enrichment.
 */

import { describe, it, expect } from "vitest";
import {
  getTableAvailabilityForDate,
  getTableAvailabilityForRange,
} from "@/services/availability.service";
import { createUser, createTable, createReservation } from "../helpers";

/* -------------------------------------------------------------------------- */
/*  getTableAvailabilityForDate                                                */
/* -------------------------------------------------------------------------- */

describe("getTableAvailabilityForDate", () => {
  const DATE = "2026-04-06";

  it("returns empty array when no active tables exist", async () => {
    const result = await getTableAvailabilityForDate(DATE);
    expect(result).toEqual([]);
  });

  it("returns all active tables with correct statuses", async () => {
    const user = await createUser({ name: "Ana" });
    await createTable({ type: "flexible", label: "F-01" });
    await createTable({ type: "blocked", label: "B-01" });
    await createTable({ type: "preferential", label: "P-01", assignedTo: user._id });
    await createTable({ type: "fixed", label: "X-01", assignedTo: user._id });

    const result = await getTableAvailabilityForDate(DATE);
    expect(result).toHaveLength(4);

    const byLabel = new Map(result.map((r) => [r.label, r]));
    expect(byLabel.get("F-01")!.status).toBe("green");
    expect(byLabel.get("B-01")!.status).toBe("gray");
    expect(byLabel.get("P-01")!.status).toBe("yellow");
    expect(byLabel.get("X-01")!.status).toBe("red");
  });

  it("handles multiple reservations for same date", async () => {
    const user1 = await createUser({ name: "User A" });
    const user2 = await createUser({ name: "User B" });
    const table1 = await createTable({ type: "flexible", label: "T-01" });
    const table2 = await createTable({ type: "flexible", label: "T-02" });
    const table3 = await createTable({ type: "flexible", label: "T-03" });

    await createReservation({ userId: user1._id, tableId: table1._id, date: DATE });
    await createReservation({ userId: user2._id, tableId: table2._id, date: DATE });

    const result = await getTableAvailabilityForDate(DATE);
    const byLabel = new Map(result.map((r) => [r.label, r]));

    expect(byLabel.get("T-01")!.status).toBe("red");
    expect(byLabel.get("T-01")!.reservation!.userName).toBe("User A");
    expect(byLabel.get("T-02")!.status).toBe("red");
    expect(byLabel.get("T-02")!.reservation!.userName).toBe("User B");
    expect(byLabel.get("T-03")!.status).toBe("green");
    expect(byLabel.get("T-03")!.reservation).toBeNull();
  });

  it("accepts Date object input", async () => {
    await createTable({ type: "flexible" });
    const result = await getTableAvailabilityForDate(new Date("2026-04-06T00:00:00Z"));
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("green");
  });

  it("ignores reservations from different dates", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-05" });

    const result = await getTableAvailabilityForDate("2026-04-06");
    expect(result[0].status).toBe("green");
    expect(result[0].reservation).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  getTableAvailabilityForRange                                               */
/* -------------------------------------------------------------------------- */

describe("getTableAvailabilityForRange", () => {
  it("returns a map keyed by date strings", async () => {
    await createTable({ type: "flexible" });

    const result = await getTableAvailabilityForRange("2026-04-06", "2026-04-08");

    expect(Object.keys(result)).toEqual(["2026-04-06", "2026-04-07", "2026-04-08"]);
    expect(result["2026-04-06"]).toHaveLength(1);
    expect(result["2026-04-07"]).toHaveLength(1);
    expect(result["2026-04-08"]).toHaveLength(1);
  });

  it("computes status per day correctly", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-07" });

    const result = await getTableAvailabilityForRange("2026-04-06", "2026-04-08");

    expect(result["2026-04-06"][0].status).toBe("green");
    expect(result["2026-04-07"][0].status).toBe("red");
    expect(result["2026-04-08"][0].status).toBe("green");
  });

  it("handles single-day range", async () => {
    await createTable({ type: "flexible" });
    const result = await getTableAvailabilityForRange("2026-04-06", "2026-04-06");
    expect(Object.keys(result)).toEqual(["2026-04-06"]);
  });

  it("handles range with multiple tables and reservations", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table1 = await createTable({ type: "flexible", label: "T-01" });
    const table2 = await createTable({ type: "flexible", label: "T-02" });

    await createReservation({ userId: user1._id, tableId: table1._id, date: "2026-04-06" });
    await createReservation({ userId: user2._id, tableId: table2._id, date: "2026-04-07" });

    const result = await getTableAvailabilityForRange("2026-04-06", "2026-04-07");

    // April 6: T-01 red, T-02 green
    const day6 = new Map(result["2026-04-06"].map((r) => [r.label, r]));
    expect(day6.get("T-01")!.status).toBe("red");
    expect(day6.get("T-02")!.status).toBe("green");

    // April 7: T-01 green, T-02 red
    const day7 = new Map(result["2026-04-07"].map((r) => [r.label, r]));
    expect(day7.get("T-01")!.status).toBe("green");
    expect(day7.get("T-02")!.status).toBe("red");
  });
});
