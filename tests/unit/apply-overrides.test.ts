/**
 * Unit tests for OP-255 — applyOverrides / applyRollback pure functions.
 *
 * No DOM, no React — pure function tests compatible with vitest environment: "node".
 *
 * AC covered (OP-255):
 *   AC-1: tests/unit/apply-overrides.test.ts exists and all tests pass.
 */

import { describe, it, expect } from "vitest";
import {
  applyOverrides,
  applyRollback,
  type OptimisticOverrides,
} from "@/components/floor-plan/optimistic-overrides";
import type { TableAvailability } from "@/domain/types";

function makeTable(
  overrides: Partial<TableAvailability> = {},
): TableAvailability {
  return {
    tableId: "t1",
    label: "Mesa 1",
    type: "flexible",
    status: "green",
    position: { x: 0, y: 0, width: 60, height: 60, rotation: 0 },
    assignedUser: null,
    reservation: null,
    ...overrides,
  };
}

describe("applyOverrides", () => {
  it("returns original tables when there are no overrides", () => {
    const tables = [makeTable(), makeTable({ tableId: "t2", label: "Mesa 2" })];
    const result = applyOverrides(tables, new Map());
    expect(result).toEqual(tables);
  });

  it("returns the same array reference when overrides is empty (no allocation)", () => {
    const tables = [makeTable()];
    const result = applyOverrides(tables, new Map());
    expect(result).toBe(tables);
  });

  it("replaces status and keeps other fields intact", () => {
    const tables = [makeTable({ status: "green" })];
    const overrides: OptimisticOverrides = new Map([
      ["t1", { status: "red", reservation: { _id: "x", userName: "Tú", isOwner: true } }],
    ]);

    const [table] = applyOverrides(tables, overrides);
    expect(table.status).toBe("red");
    expect(table.label).toBe("Mesa 1");
    expect(table.type).toBe("flexible");
    expect(table.reservation).toEqual({ _id: "x", userName: "Tú", isOwner: true });
  });

  it("applies a reservation: null override (cancel case)", () => {
    const tables = [
      makeTable({
        status: "red",
        reservation: { _id: "r1", userName: "Ana", isOwner: true },
      }),
    ];
    const overrides: OptimisticOverrides = new Map([
      ["t1", { status: "green", reservation: null }],
    ]);

    const [table] = applyOverrides(tables, overrides);
    expect(table.status).toBe("green");
    expect(table.reservation).toBeNull();
  });

  it("ignores overrides for tableIds not present in the array", () => {
    const tables = [makeTable()];
    const overrides: OptimisticOverrides = new Map([
      ["does-not-exist", { status: "red", reservation: null }],
    ]);

    const result = applyOverrides(tables, overrides);
    expect(result).toEqual(tables);
    expect(result[0].status).toBe("green");
  });

  it("applies multiple overrides at once", () => {
    const tables = [
      makeTable({ tableId: "t1" }),
      makeTable({ tableId: "t2", status: "yellow", type: "preferential" }),
      makeTable({ tableId: "t3" }),
    ];
    const overrides: OptimisticOverrides = new Map([
      ["t1", { status: "red", reservation: { _id: "a", userName: "Tú", isOwner: true } }],
      ["t2", { status: "yellow", reservation: null }],
    ]);

    const result = applyOverrides(tables, overrides);
    expect(result[0].status).toBe("red");
    expect(result[1].status).toBe("yellow");
    expect(result[1].reservation).toBeNull();
    expect(result[2].status).toBe("green"); // untouched
  });

  it("does not mutate the original tables array", () => {
    const tables = [makeTable({ status: "green" })];
    const snapshot = JSON.parse(JSON.stringify(tables));
    const overrides: OptimisticOverrides = new Map([
      ["t1", { status: "red", reservation: null }],
    ]);

    applyOverrides(tables, overrides);
    expect(tables).toEqual(snapshot);
  });
});

describe("applyRollback", () => {
  it("removes the override for the given tableId", () => {
    const overrides: OptimisticOverrides = new Map([
      ["t1", { status: "red", reservation: null }],
      ["t2", { status: "green", reservation: null }],
    ]);

    const result = applyRollback(overrides, "t1");
    expect(result.has("t1")).toBe(false);
    expect(result.has("t2")).toBe(true);
  });

  it("does not mutate the original map", () => {
    const overrides: OptimisticOverrides = new Map([
      ["t1", { status: "red", reservation: null }],
    ]);

    const result = applyRollback(overrides, "t1");
    expect(overrides.has("t1")).toBe(true); // original intact
    expect(result.has("t1")).toBe(false);
    expect(result).not.toBe(overrides);
  });

  it("returns the same map reference when tableId is not present (no-op)", () => {
    const overrides: OptimisticOverrides = new Map([
      ["t1", { status: "red", reservation: null }],
    ]);

    const result = applyRollback(overrides, "nope");
    expect(result).toBe(overrides);
  });
});
