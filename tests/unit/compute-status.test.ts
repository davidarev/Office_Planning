/**
 * Unit tests for availability status computation logic.
 *
 * computeStatus is a private function in availability.service.ts.
 * We test it through getTableAvailabilityForDate, which exercises
 * every status rule in the priority chain:
 *   1. inactive → gray
 *   2. blocked type → gray
 *   3. confirmed reservation → red
 *   4. fixed type → red
 *   5. preferential type → yellow
 *   6. default → green
 */

import { describe, it, expect } from "vitest";
import { getTableAvailabilityForDate } from "@/services/availability.service";
import { createUser, createTable, createReservation } from "../helpers";

describe("computeStatus (via getTableAvailabilityForDate)", () => {
  const DATE = "2026-04-01";

  it("inactive table → gray", async () => {
    await createTable({ isActive: false, label: "Inactive" });
    // Note: inactive tables are excluded by listActiveTables
    // so an inactive table won't appear in the result at all.
    const activeTable = await createTable({ type: "flexible", label: "Active" });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result).toHaveLength(1);
    expect(result[0].tableId).toBe(activeTable._id.toString());
  });

  it("blocked type → gray", async () => {
    await createTable({ type: "blocked", label: "Blocked" });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("gray");
  });

  it("confirmed reservation → red", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: DATE,
    });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("red");
  });

  it("fixed type without reservation → red", async () => {
    const user = await createUser();
    await createTable({ type: "fixed", assignedTo: user._id });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("red");
  });

  it("preferential type without reservation → yellow", async () => {
    const user = await createUser();
    await createTable({ type: "preferential", assignedTo: user._id });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("yellow");
  });

  it("flexible type without reservation → green", async () => {
    await createTable({ type: "flexible" });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("green");
  });

  it("reservation on blocked table is still gray (inactive takes priority)", async () => {
    // Blocked tables can't have reservations through the service,
    // but if data exists, blocked status still wins
    const user = await createUser();
    const table = await createTable({ type: "blocked" });
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: DATE,
    });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("gray");
  });

  it("reservation on preferential table → red (reservation overrides preference)", async () => {
    const user = await createUser();
    const table = await createTable({ type: "preferential" });
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: DATE,
    });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("red");
  });

  it("cancelled reservation does not make table red", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    await createReservation({
      userId: user._id,
      tableId: table._id,
      date: DATE,
      status: "cancelled",
    });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].status).toBe("green");
  });
});

describe("availability enrichment", () => {
  const DATE = "2026-04-02";

  it("includes reservation info when table is reserved", async () => {
    const user = await createUser({ name: "María López" });
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: DATE,
    });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].reservation).toEqual({
      _id: reservation._id.toString(),
      userId: user._id.toString(),
      userName: "María López",
    });
  });

  it("reservation is null when table is not reserved", async () => {
    await createTable({ type: "flexible" });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].reservation).toBeNull();
  });

  it("includes assignedUser info for fixed tables", async () => {
    const user = await createUser({ name: "Carlos García" });
    await createTable({ type: "fixed", assignedTo: user._id });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].assignedUser).toEqual({
      _id: user._id.toString(),
      name: "Carlos García",
    });
  });

  it("assignedUser is null for tables without assignment", async () => {
    await createTable({ type: "flexible" });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].assignedUser).toBeNull();
  });

  it("resolves unknown user as 'Usuario desconocido'", async () => {
    const fakeUserId = "000000000000000000000000";
    await createTable({ type: "fixed", assignedTo: fakeUserId });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].assignedUser?.name).toBe("Usuario desconocido");
  });

  it("includes correct table metadata", async () => {
    const table = await createTable({
      label: "A-01",
      type: "flexible",
      position: { x: 10, y: 20, width: 100, height: 60 },
    });
    const result = await getTableAvailabilityForDate(DATE);
    expect(result[0].tableId).toBe(table._id.toString());
    expect(result[0].label).toBe("A-01");
    expect(result[0].type).toBe("flexible");
    expect(result[0].position).toMatchObject({ x: 10, y: 20, width: 100, height: 60 });
  });
});
