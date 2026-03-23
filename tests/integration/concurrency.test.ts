/**
 * Concurrency tests for the reservation system.
 *
 * Simulates simultaneous reservation attempts to verify that:
 * - MongoDB unique partial indexes prevent double bookings
 * - Only one of N competing requests succeeds
 * - The losing requests fail with a conflict error, not a crash
 */

import { describe, it, expect } from "vitest";
import { insertReservation } from "@/lib/db";
import { normalizeDate } from "@/lib/dates";
import { createReservation as createResService } from "@/services/reservation.service";
import { createUser, createTable } from "../helpers";

describe("concurrent reservation attempts", () => {
  it("only one insert succeeds when two users race for the same table+day", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable({ type: "flexible" });
    const date = normalizeDate("2026-04-10");

    // Launch both inserts simultaneously
    const results = await Promise.allSettled([
      insertReservation(user1._id.toString(), table._id.toString(), date),
      insertReservation(user2._id.toString(), table._id.toString(), date),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // The rejected one should be E11000
    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error.code).toBe(11000);
  });

  it("only one insert succeeds when same user races for two tables on same day", async () => {
    const user = await createUser();
    const table1 = await createTable({ type: "flexible" });
    const table2 = await createTable({ type: "flexible" });
    const date = normalizeDate("2026-04-10");

    const results = await Promise.allSettled([
      insertReservation(user._id.toString(), table1._id.toString(), date),
      insertReservation(user._id.toString(), table2._id.toString(), date),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error.code).toBe(11000);
  });

  it("service layer handles concurrent race for same table gracefully", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable({ type: "flexible" });

    // Both go through the full service pipeline simultaneously
    const results = await Promise.allSettled([
      createResService(user1._id.toString(), table._id.toString(), "2026-04-11"),
      createResService(user2._id.toString(), table._id.toString(), "2026-04-11"),
    ]);

    // Both should resolve (not reject) — the service catches errors
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const values = results.map(
      (r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof createResService>>>).value
    );

    const successes = values.filter((v) => v.ok);
    const failures = values.filter((v) => !v.ok);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    if (!failures[0].ok) {
      expect(failures[0].code).toBe("conflict");
    }
  });

  it("service layer handles concurrent race for same user gracefully", async () => {
    const user = await createUser();
    const table1 = await createTable({ type: "flexible" });
    const table2 = await createTable({ type: "flexible" });

    const results = await Promise.allSettled([
      createResService(user._id.toString(), table1._id.toString(), "2026-04-12"),
      createResService(user._id.toString(), table2._id.toString(), "2026-04-12"),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const values = results.map(
      (r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof createResService>>>).value
    );

    const successes = values.filter((v) => v.ok);
    const failures = values.filter((v) => !v.ok);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    if (!failures[0].ok) {
      expect(failures[0].code).toBe("conflict");
    }
  });

  it("three-way race: only one wins", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const user3 = await createUser();
    const table = await createTable({ type: "flexible" });

    const results = await Promise.allSettled([
      createResService(user1._id.toString(), table._id.toString(), "2026-04-13"),
      createResService(user2._id.toString(), table._id.toString(), "2026-04-13"),
      createResService(user3._id.toString(), table._id.toString(), "2026-04-13"),
    ]);

    const values = results.map(
      (r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof createResService>>>).value
    );

    const successes = values.filter((v) => v.ok);
    expect(successes).toHaveLength(1);
  });

  it("concurrent inserts on different tables + different days all succeed", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table1 = await createTable({ type: "flexible" });
    const table2 = await createTable({ type: "flexible" });

    const results = await Promise.allSettled([
      createResService(user1._id.toString(), table1._id.toString(), "2026-04-14"),
      createResService(user2._id.toString(), table2._id.toString(), "2026-04-15"),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const values = results.map(
      (r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof createResService>>>).value
    );
    expect(values.every((v) => v.ok)).toBe(true);
  });
});
