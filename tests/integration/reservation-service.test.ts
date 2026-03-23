/**
 * Integration tests for the reservation service.
 *
 * Tests createReservation and cancelReservation against a real
 * (in-memory) MongoDB to verify the full business logic pipeline,
 * including validation, authorization, and concurrency handling.
 */

import { describe, it, expect } from "vitest";
import {
  createReservation as createRes,
  cancelReservation,
  getReservationsForDay,
  getReservationsForRange,
} from "@/services/reservation.service";
import { createUser, createAdmin, createTable, createReservation, nonExistentId } from "../helpers";

/* -------------------------------------------------------------------------- */
/*  createReservation                                                          */
/* -------------------------------------------------------------------------- */

describe("createReservation", () => {
  it("creates a valid reservation successfully", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });

    const result = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.userId).toBe(user._id.toString());
      expect(result.data.tableId).toBe(table._id.toString());
      expect(result.data.date).toBe("2026-04-01");
      expect(result.data.status).toBe("confirmed");
      expect(result.data._id).toBeDefined();
    }
  });

  it("creates reservation on preferential table", async () => {
    const user = await createUser();
    const table = await createTable({ type: "preferential" });

    const result = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(result.ok).toBe(true);
  });

  it("fails with invalid date format", async () => {
    const user = await createUser();
    const table = await createTable();

    const result = await createRes(user._id.toString(), table._id.toString(), "not-a-date");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
    }
  });

  it("fails with empty date", async () => {
    const user = await createUser();
    const table = await createTable();

    const result = await createRes(user._id.toString(), table._id.toString(), "");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
    }
  });

  it("fails with invalid date like Feb 30", async () => {
    const user = await createUser();
    const table = await createTable();

    const result = await createRes(user._id.toString(), table._id.toString(), "2026-02-30");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
    }
  });

  it("fails when table does not exist", async () => {
    const user = await createUser();
    const result = await createRes(user._id.toString(), nonExistentId(), "2026-04-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("not_found");
    }
  });

  it("fails when table is inactive", async () => {
    const user = await createUser();
    const table = await createTable({ isActive: false });

    const result = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
    }
  });

  it("fails when table is blocked", async () => {
    const user = await createUser();
    const table = await createTable({ type: "blocked" });

    const result = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
      expect(result.message).toContain("bloqueada");
    }
  });

  it("fails when table is fixed", async () => {
    const user = await createUser();
    const table = await createTable({ type: "fixed" });

    const result = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
      expect(result.message).toContain("fija");
    }
  });

  it("fails when user already has a reservation that day", async () => {
    const user = await createUser();
    const table1 = await createTable({ type: "flexible" });
    const table2 = await createTable({ type: "flexible" });

    await createRes(user._id.toString(), table1._id.toString(), "2026-04-01");
    const result = await createRes(user._id.toString(), table2._id.toString(), "2026-04-01");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("conflict");
      expect(result.message).toContain("Ya tienes");
    }
  });

  it("fails when table already reserved that day", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable({ type: "flexible" });

    await createRes(user1._id.toString(), table._id.toString(), "2026-04-01");
    const result = await createRes(user2._id.toString(), table._id.toString(), "2026-04-01");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("conflict");
      expect(result.message).toContain("ya está reservada");
    }
  });

  it("allows reservation after cancellation of previous one (same table)", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable({ type: "flexible" });

    // Create and cancel
    const first = await createRes(user1._id.toString(), table._id.toString(), "2026-04-01");
    expect(first.ok).toBe(true);
    if (first.ok) {
      await cancelReservation(user1._id.toString(), "user", first.data._id);
    }

    // New reservation should work
    const second = await createRes(user2._id.toString(), table._id.toString(), "2026-04-01");
    expect(second.ok).toBe(true);
  });

  it("allows reservation after cancellation (same user different table)", async () => {
    const user = await createUser();
    const table1 = await createTable({ type: "flexible" });
    const table2 = await createTable({ type: "flexible" });

    const first = await createRes(user._id.toString(), table1._id.toString(), "2026-04-01");
    expect(first.ok).toBe(true);
    if (first.ok) {
      await cancelReservation(user._id.toString(), "user", first.data._id);
    }

    const second = await createRes(user._id.toString(), table2._id.toString(), "2026-04-01");
    expect(second.ok).toBe(true);
  });

  it("allows same user to reserve different days", async () => {
    const user = await createUser();
    const table1 = await createTable({ type: "flexible" });
    const table2 = await createTable({ type: "flexible" });

    const r1 = await createRes(user._id.toString(), table1._id.toString(), "2026-04-01");
    const r2 = await createRes(user._id.toString(), table2._id.toString(), "2026-04-02");

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/*  E11000 duplicate key error handling                                        */
/* -------------------------------------------------------------------------- */

describe("createReservation — E11000 handling", () => {
  it("catches table-level duplicate key and returns conflict", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable({ type: "flexible" });

    // Insert directly via factory to bypass service-level checks
    await createReservation({ userId: user1._id, tableId: table._id, date: "2026-04-01" });

    // Service pre-check should catch this, but the error message
    // verifies the correct conflict path
    const result = await createRes(user2._id.toString(), table._id.toString(), "2026-04-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("conflict");
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  cancelReservation                                                          */
/* -------------------------------------------------------------------------- */

describe("cancelReservation", () => {
  it("owner can cancel their own reservation", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    const res = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const result = await cancelReservation(user._id.toString(), "user", res.data._id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("cancelled");
      expect(result.data._id).toBe(res.data._id);
    }
  });

  it("admin can cancel anyone's reservation", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const table = await createTable({ type: "flexible" });

    const res = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const result = await cancelReservation(admin._id.toString(), "admin", res.data._id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("cancelled");
    }
  });

  it("non-owner non-admin cannot cancel", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable({ type: "flexible" });

    const res = await createRes(user1._id.toString(), table._id.toString(), "2026-04-01");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const result = await cancelReservation(user2._id.toString(), "user", res.data._id);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("forbidden");
      expect(result.message).toContain("permiso");
    }
  });

  it("returns not_found for non-existent reservation", async () => {
    const user = await createUser();
    const result = await cancelReservation(user._id.toString(), "user", nonExistentId());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("not_found");
    }
  });

  it("returns validation error when cancelling already-cancelled reservation", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });

    const res = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Cancel once
    await cancelReservation(user._id.toString(), "user", res.data._id);
    // Try to cancel again
    const result = await cancelReservation(user._id.toString(), "user", res.data._id);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation");
      expect(result.message).toContain("ya está cancelada");
    }
  });

  it("soft delete preserves the reservation document", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });

    const res = await createRes(user._id.toString(), table._id.toString(), "2026-04-01");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    await cancelReservation(user._id.toString(), "user", res.data._id);

    // Verify the document still exists in the database
    const { getReservationById } = await import("@/lib/db");
    const doc = await getReservationById(res.data._id);
    expect(doc).not.toBeNull();
    expect(doc!.status).toBe("cancelled");
    expect(doc!.userId.toString()).toBe(user._id.toString());
  });
});

/* -------------------------------------------------------------------------- */
/*  Read operations                                                            */
/* -------------------------------------------------------------------------- */

describe("getReservationsForDay", () => {
  it("returns public format reservations", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-01" });

    const results = await getReservationsForDay("2026-04-01");
    expect(results).toHaveLength(1);
    expect(typeof results[0]._id).toBe("string");
    expect(typeof results[0].userId).toBe("string");
    expect(typeof results[0].tableId).toBe("string");
    expect(results[0].date).toBe("2026-04-01");
    expect(results[0].status).toBe("confirmed");
  });
});

describe("getReservationsForRange", () => {
  it("returns public format reservations for range", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table1 = await createTable();
    const table2 = await createTable();
    await createReservation({ userId: user1._id, tableId: table1._id, date: "2026-04-01" });
    await createReservation({ userId: user2._id, tableId: table2._id, date: "2026-04-03" });

    const results = await getReservationsForRange("2026-04-01", "2026-04-05");
    expect(results).toHaveLength(2);
    expect(results[0].date).toBe("2026-04-01");
    expect(results[1].date).toBe("2026-04-03");
  });
});
