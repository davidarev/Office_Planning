/**
 * Unit tests for floor-plan utilities: statusColorMap and getOccupantName.
 *
 * No DOM, no React, no MongoDB — pure function tests compatible with
 * vitest environment: "node".
 */

import { describe, it, expect } from "vitest";
import {
  statusColorMap,
  getStatusColorClasses,
  getOccupantName,
} from "@/components/floor-plan/desk-status";
import type { TableAvailability } from "@/domain/types";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const basePosition: TableAvailability["position"] = {
  x: 0,
  y: 0,
  width: 80,
  height: 60,
  rotation: 0,
  cornerExtension: null,
};

function makeTable(
  overrides: Partial<TableAvailability> = {}
): TableAvailability {
  return {
    tableId: "t1",
    label: "A1",
    type: "flexible",
    position: basePosition,
    status: "green",
    reservation: null,
    assignedUser: null,
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/*  statusColorMap                                                             */
/* -------------------------------------------------------------------------- */

describe("statusColorMap", () => {
  it("has a non-empty entry for green", () => {
    expect(statusColorMap.green).toBeTruthy();
  });

  it("has a non-empty entry for yellow", () => {
    expect(statusColorMap.yellow).toBeTruthy();
  });

  it("has a non-empty entry for red", () => {
    expect(statusColorMap.red).toBeTruthy();
  });

  it("has a non-empty entry for gray", () => {
    expect(statusColorMap.gray).toBeTruthy();
  });

  describe("getStatusColorClasses — fallback for unexpected values", () => {
    it("does not throw for an unknown status string", () => {
      expect(() => getStatusColorClasses("unknown")).not.toThrow();
    });

    it("returns the gray fallback for an unknown status string", () => {
      expect(getStatusColorClasses("unknown")).toBe(statusColorMap.gray);
    });

    it("returns the gray fallback for an empty string", () => {
      expect(getStatusColorClasses("")).toBe(statusColorMap.gray);
    });
  });
});

/* -------------------------------------------------------------------------- */
/*  getOccupantName                                                            */
/* -------------------------------------------------------------------------- */

describe("getOccupantName", () => {
  it("returns reservation.userName when reservation exists", () => {
    const table = makeTable({
      reservation: { _id: "r1", userName: "Ana García" },
    });
    expect(getOccupantName(table)).toBe("Ana García");
  });

  it("returns assignedUser.name when there is no reservation but assignedUser exists", () => {
    const table = makeTable({
      reservation: null,
      assignedUser: { _id: "u1", name: "Carlos López" },
    });
    expect(getOccupantName(table)).toBe("Carlos López");
  });

  it("returns reservation.userName (not assignedUser.name) when both exist", () => {
    const table = makeTable({
      reservation: { _id: "r1", userName: "Ana García" },
      assignedUser: { _id: "u1", name: "Carlos López" },
    });
    expect(getOccupantName(table)).toBe("Ana García");
  });

  it("returns null when neither reservation nor assignedUser exist", () => {
    const table = makeTable({ reservation: null, assignedUser: null });
    expect(getOccupantName(table)).toBeNull();
  });

  it("returns null when reservation.userName is an empty string", () => {
    const table = makeTable({
      reservation: { _id: "r1", userName: "" },
      assignedUser: null,
    });
    expect(getOccupantName(table)).toBeNull();
  });

  it("returns null when assignedUser.name is an empty string", () => {
    const table = makeTable({
      reservation: null,
      assignedUser: { _id: "u1", name: "" },
    });
    expect(getOccupantName(table)).toBeNull();
  });

  it("falls back to assignedUser.name when reservation.userName is empty", () => {
    const table = makeTable({
      reservation: { _id: "r1", userName: "" },
      assignedUser: { _id: "u1", name: "Carlos López" },
    });
    expect(getOccupantName(table)).toBe("Carlos López");
  });
});
