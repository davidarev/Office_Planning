/**
 * Unit tests for desk-detail-utils: shouldShowReserveButton,
 * shouldShowCancelButton, and getDetailMessage.
 *
 * No DOM, no React — pure function tests compatible with vitest environment: "node".
 */

import { describe, it, expect } from "vitest";
import {
  shouldShowReserveButton,
  shouldShowCancelButton,
  getDetailMessage,
} from "@/components/floor-plan/desk-detail-utils";
import type { TableStatus, TableType } from "@/domain/types";

/* -------------------------------------------------------------------------- */
/*  shouldShowReserveButton                                                     */
/* -------------------------------------------------------------------------- */

describe("shouldShowReserveButton", () => {
  it("returns true for green desk without own reservation", () => {
    expect(shouldShowReserveButton("green", false)).toBe(true);
  });

  it("returns true for yellow desk without own reservation", () => {
    expect(shouldShowReserveButton("yellow", false)).toBe(true);
  });

  it("returns false for green desk when user already has reservation today", () => {
    expect(shouldShowReserveButton("green", true)).toBe(false);
  });

  it("returns false for yellow desk when user already has reservation today", () => {
    expect(shouldShowReserveButton("yellow", true)).toBe(false);
  });

  it("returns false for red desk", () => {
    expect(shouldShowReserveButton("red", false)).toBe(false);
  });

  it("returns false for gray desk", () => {
    expect(shouldShowReserveButton("gray", false)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  shouldShowCancelButton                                                      */
/* -------------------------------------------------------------------------- */

describe("shouldShowCancelButton", () => {
  it("returns true for red flexible desk with own reservation", () => {
    expect(shouldShowCancelButton("red", "flexible", true, true)).toBe(true);
  });

  it("returns true for red preferential desk with own reservation", () => {
    expect(shouldShowCancelButton("red", "preferential", true, true)).toBe(true);
  });

  it("returns false for red flexible desk with another user's reservation", () => {
    expect(shouldShowCancelButton("red", "flexible", true, false)).toBe(false);
  });

  it("returns false for red fixed desk even with own reservation", () => {
    expect(shouldShowCancelButton("red", "fixed", true, true)).toBe(false);
  });

  it("returns false for red flexible desk with no reservation", () => {
    expect(shouldShowCancelButton("red", "flexible", false, false)).toBe(false);
  });

  it("returns false for green desk", () => {
    expect(shouldShowCancelButton("green", "flexible", false, false)).toBe(false);
  });

  it("returns false for gray blocked desk", () => {
    expect(shouldShowCancelButton("gray", "blocked", false, false)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  getDetailMessage                                                            */
/* -------------------------------------------------------------------------- */

type Reservation = { _id: string; userName: string } | null;
type AssignedUser = { _id: string; name: string } | null;

interface Params {
  status: TableStatus;
  type: TableType;
  reservation: Reservation;
  assignedUser: AssignedUser;
  userHasReservationToday: boolean;
  isOwnReservation: boolean;
}

function makeParams(overrides: Partial<Params> = {}): Params {
  return {
    status: "green",
    type: "flexible",
    reservation: null,
    assignedUser: null,
    userHasReservationToday: false,
    isOwnReservation: false,
    ...overrides,
  };
}

describe("getDetailMessage", () => {
  it('returns "Mesa no disponible" for gray desk', () => {
    expect(
      getDetailMessage(makeParams({ status: "gray" }))
    ).toBe("Mesa no disponible");
  });

  it('returns "Tu reserva para hoy" when isOwnReservation is true', () => {
    expect(
      getDetailMessage(
        makeParams({
          status: "red",
          reservation: { _id: "r1", userName: "Ana" },
          isOwnReservation: true,
        })
      )
    ).toBe("Tu reserva para hoy");
  });

  it('returns "Ocupada por Ana García" for red desk with another user reservation', () => {
    expect(
      getDetailMessage(
        makeParams({
          status: "red",
          reservation: { _id: "r1", userName: "Ana García" },
          isOwnReservation: false,
        })
      )
    ).toBe("Ocupada por Ana García");
  });

  it('returns "Mesa asignada a Carlos" for red fixed desk with assignedUser and no reservation', () => {
    expect(
      getDetailMessage(
        makeParams({
          status: "red",
          type: "fixed",
          reservation: null,
          assignedUser: { _id: "u1", name: "Carlos" },
          isOwnReservation: false,
        })
      )
    ).toBe("Mesa asignada a Carlos");
  });

  it('returns "Mesa preferente de María" for yellow preferential desk with assignedUser', () => {
    expect(
      getDetailMessage(
        makeParams({
          status: "yellow",
          type: "preferential",
          assignedUser: { _id: "u2", name: "María" },
        })
      )
    ).toBe("Mesa preferente de María");
  });

  it('returns "Mesa preferente" for preferential desk without assignedUser name', () => {
    expect(
      getDetailMessage(
        makeParams({
          status: "yellow",
          type: "preferential",
          assignedUser: { _id: "u2", name: "" },
        })
      )
    ).toBe("Mesa preferente");
  });

  it('returns "Ya tienes una reserva para hoy" for green desk when userHasReservationToday is true', () => {
    expect(
      getDetailMessage(
        makeParams({
          status: "green",
          userHasReservationToday: true,
        })
      )
    ).toBe("Ya tienes una reserva para hoy");
  });

  it("returns null for green desk with no reservations or assignedUser", () => {
    expect(
      getDetailMessage(makeParams({ status: "green" }))
    ).toBeNull();
  });

  it("returns null for yellow desk without assignedUser and no own reservation", () => {
    expect(
      getDetailMessage(
        makeParams({
          status: "yellow",
          type: "flexible",
          assignedUser: null,
          userHasReservationToday: false,
        })
      )
    ).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  Mutual exclusion of buttons                                                 */
/* -------------------------------------------------------------------------- */

describe("mutual exclusion: shouldShowReserveButton and shouldShowCancelButton", () => {
  const statuses: TableStatus[] = ["green", "yellow", "red", "gray"];
  const types: TableType[] = ["flexible", "fixed", "preferential", "blocked"];
  const booleans = [true, false];

  it("never returns true for both buttons at the same time for any valid combination", () => {
    for (const status of statuses) {
      for (const type of types) {
        for (const userHasReservationToday of booleans) {
          for (const hasReservation of booleans) {
            for (const isOwnReservation of booleans) {
              const reserve = shouldShowReserveButton(status, userHasReservationToday);
              const cancel = shouldShowCancelButton(status, type, hasReservation, isOwnReservation);
              expect(
                reserve && cancel,
                `Both buttons true for status=${status} type=${type} userHasReservationToday=${userHasReservationToday} hasReservation=${hasReservation} isOwnReservation=${isOwnReservation}`
              ).toBe(false);
            }
          }
        }
      }
    }
  });
});
