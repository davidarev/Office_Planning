/**
 * Integration tests for the reservation repository.
 *
 * These tests run against an in-memory MongoDB instance and verify
 * that the data-access layer behaves correctly, including:
 * - CRUD operations
 * - Partial unique indexes
 * - Date filtering
 * - Soft delete behavior
 */

import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import {
  insertReservation,
  markReservationCancelled,
  getReservationById,
  getReservationsByDate,
  getReservationsByDateRange,
  getUserReservationByDate,
  getTableReservationByDate,
} from "@/lib/db";
import { normalizeDate } from "@/lib/dates";
import { createUser, createTable, createReservation, nonExistentId } from "../helpers";

/* -------------------------------------------------------------------------- */
/*  insertReservation                                                          */
/* -------------------------------------------------------------------------- */

describe("insertReservation", () => {
  it("creates a confirmed reservation", async () => {
    const user = await createUser();
    const table = await createTable();
    const date = normalizeDate("2026-04-01");

    const reservation = await insertReservation(
      user._id.toString(),
      table._id.toString(),
      date
    );

    expect(reservation).toBeDefined();
    expect(reservation.userId.toString()).toBe(user._id.toString());
    expect(reservation.tableId.toString()).toBe(table._id.toString());
    expect(reservation.status).toBe("confirmed");
    expect(reservation.date.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("throws E11000 on duplicate tableId+date (same table same day)", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable();
    const date = normalizeDate("2026-04-01");

    await insertReservation(user1._id.toString(), table._id.toString(), date);

    await expect(
      insertReservation(user2._id.toString(), table._id.toString(), date)
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("throws E11000 on duplicate userId+date (same user same day)", async () => {
    const user = await createUser();
    const table1 = await createTable();
    const table2 = await createTable();
    const date = normalizeDate("2026-04-01");

    await insertReservation(user._id.toString(), table1._id.toString(), date);

    await expect(
      insertReservation(user._id.toString(), table2._id.toString(), date)
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("allows same table on different days", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable();

    const r1 = await insertReservation(
      user1._id.toString(),
      table._id.toString(),
      normalizeDate("2026-04-01")
    );
    const r2 = await insertReservation(
      user2._id.toString(),
      table._id.toString(),
      normalizeDate("2026-04-02")
    );

    expect(r1._id).not.toEqual(r2._id);
  });

  it("allows same user on different days", async () => {
    const user = await createUser();
    const table1 = await createTable();
    const table2 = await createTable();

    const r1 = await insertReservation(
      user._id.toString(),
      table1._id.toString(),
      normalizeDate("2026-04-01")
    );
    const r2 = await insertReservation(
      user._id.toString(),
      table2._id.toString(),
      normalizeDate("2026-04-02")
    );

    expect(r1._id).not.toEqual(r2._id);
  });
});

/* -------------------------------------------------------------------------- */
/*  Partial unique index: cancelled reservations don't block                    */
/* -------------------------------------------------------------------------- */

describe("partial unique index behavior", () => {
  it("allows new reservation after previous one was cancelled (same table same day)", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable();
    const date = normalizeDate("2026-04-01");

    // First reservation
    const r1 = await insertReservation(
      user1._id.toString(),
      table._id.toString(),
      date
    );

    // Cancel it
    await markReservationCancelled(r1._id);

    // New reservation for same table same day should work
    const r2 = await insertReservation(
      user2._id.toString(),
      table._id.toString(),
      date
    );
    expect(r2.status).toBe("confirmed");
  });

  it("allows new reservation after previous one was cancelled (same user same day)", async () => {
    const user = await createUser();
    const table1 = await createTable();
    const table2 = await createTable();
    const date = normalizeDate("2026-04-01");

    const r1 = await insertReservation(
      user._id.toString(),
      table1._id.toString(),
      date
    );
    await markReservationCancelled(r1._id);

    const r2 = await insertReservation(
      user._id.toString(),
      table2._id.toString(),
      date
    );
    expect(r2.status).toBe("confirmed");
  });
});

/* -------------------------------------------------------------------------- */
/*  markReservationCancelled                                                   */
/* -------------------------------------------------------------------------- */

describe("markReservationCancelled", () => {
  it("sets status to cancelled", async () => {
    const user = await createUser();
    const table = await createTable();
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
    });

    const updated = await markReservationCancelled(reservation._id);
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("cancelled");
  });

  it("returns null for non-existent id", async () => {
    const result = await markReservationCancelled(nonExistentId());
    expect(result).toBeNull();
  });

  it("preserves original data after cancellation", async () => {
    const user = await createUser();
    const table = await createTable();
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
    });

    const updated = await markReservationCancelled(reservation._id);
    expect(updated!.userId.toString()).toBe(user._id.toString());
    expect(updated!.tableId.toString()).toBe(table._id.toString());
    expect(updated!.date.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
});

/* -------------------------------------------------------------------------- */
/*  getReservationById                                                         */
/* -------------------------------------------------------------------------- */

describe("getReservationById", () => {
  it("returns the reservation by id", async () => {
    const user = await createUser();
    const table = await createTable();
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
    });

    const found = await getReservationById(reservation._id.toString());
    expect(found).not.toBeNull();
    expect(found!._id.toString()).toBe(reservation._id.toString());
  });

  it("returns cancelled reservations too", async () => {
    const user = await createUser();
    const table = await createTable();
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
      status: "cancelled",
    });

    const found = await getReservationById(reservation._id.toString());
    expect(found).not.toBeNull();
    expect(found!.status).toBe("cancelled");
  });

  it("returns null for non-existent id", async () => {
    const found = await getReservationById(nonExistentId());
    expect(found).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  getReservationsByDate                                                      */
/* -------------------------------------------------------------------------- */

describe("getReservationsByDate", () => {
  it("returns confirmed reservations for a date", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
    });

    const results = await getReservationsByDate("2026-04-01");
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("confirmed");
  });

  it("excludes cancelled reservations", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
      status: "cancelled",
    });

    const results = await getReservationsByDate("2026-04-01");
    expect(results).toHaveLength(0);
  });

  it("returns empty array for date with no reservations", async () => {
    const results = await getReservationsByDate("2026-04-01");
    expect(results).toEqual([]);
  });

  it("does not return reservations from other days", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-02",
    });

    const results = await getReservationsByDate("2026-04-01");
    expect(results).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------------- */
/*  getReservationsByDateRange                                                 */
/* -------------------------------------------------------------------------- */

describe("getReservationsByDateRange", () => {
  it("returns reservations within inclusive range", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const user3 = await createUser();
    const table1 = await createTable();
    const table2 = await createTable();
    const table3 = await createTable();

    await createReservation({ userId: user1._id, tableId: table1._id, date: "2026-04-01" });
    await createReservation({ userId: user2._id, tableId: table2._id, date: "2026-04-03" });
    await createReservation({ userId: user3._id, tableId: table3._id, date: "2026-04-05" });

    const results = await getReservationsByDateRange("2026-04-01", "2026-04-05");
    expect(results).toHaveLength(3);
  });

  it("excludes reservations outside range", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-03-31" });

    const results = await getReservationsByDateRange("2026-04-01", "2026-04-05");
    expect(results).toHaveLength(0);
  });

  it("includes boundary dates", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table1 = await createTable();
    const table2 = await createTable();

    await createReservation({ userId: user1._id, tableId: table1._id, date: "2026-04-01" });
    await createReservation({ userId: user2._id, tableId: table2._id, date: "2026-04-05" });

    const results = await getReservationsByDateRange("2026-04-01", "2026-04-05");
    expect(results).toHaveLength(2);
  });

  it("results are sorted by date ascending", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table1 = await createTable();
    const table2 = await createTable();

    await createReservation({ userId: user2._id, tableId: table2._id, date: "2026-04-03" });
    await createReservation({ userId: user1._id, tableId: table1._id, date: "2026-04-01" });

    const results = await getReservationsByDateRange("2026-04-01", "2026-04-05");
    expect(results[0].date.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(results[1].date.toISOString()).toBe("2026-04-03T00:00:00.000Z");
  });
});

/* -------------------------------------------------------------------------- */
/*  getUserReservationByDate / getTableReservationByDate                        */
/* -------------------------------------------------------------------------- */

describe("getUserReservationByDate", () => {
  it("returns the user's confirmed reservation for that day", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-01" });

    const result = await getUserReservationByDate(user._id.toString(), "2026-04-01");
    expect(result).not.toBeNull();
    expect(result!.userId.toString()).toBe(user._id.toString());
  });

  it("returns null if user has no reservation that day", async () => {
    const user = await createUser();
    const result = await getUserReservationByDate(user._id.toString(), "2026-04-01");
    expect(result).toBeNull();
  });

  it("ignores cancelled reservations", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
      status: "cancelled",
    });

    const result = await getUserReservationByDate(user._id.toString(), "2026-04-01");
    expect(result).toBeNull();
  });
});

describe("getTableReservationByDate", () => {
  it("returns the table's confirmed reservation for that day", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-01" });

    const result = await getTableReservationByDate(table._id.toString(), "2026-04-01");
    expect(result).not.toBeNull();
    expect(result!.tableId.toString()).toBe(table._id.toString());
  });

  it("returns null if table has no reservation that day", async () => {
    const table = await createTable();
    const result = await getTableReservationByDate(table._id.toString(), "2026-04-01");
    expect(result).toBeNull();
  });

  it("ignores cancelled reservations", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
      status: "cancelled",
    });

    const result = await getTableReservationByDate(table._id.toString(), "2026-04-01");
    expect(result).toBeNull();
  });
});
