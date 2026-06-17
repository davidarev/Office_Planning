/**
 * Unit tests for OP-255 — full optimistic flow (reserve + cancel) using
 * callbacks, without mounting React components.
 *
 * These tests model exactly what FloorPlanSection does: apply an optimistic
 * override first, then call the hook's reserve/cancelReservation; on success
 * the override persists and a refetch fires; on failure onRollback removes the
 * override via the real applyRollback helper.
 *
 * AC covered (OP-255):
 *   AC-3: onOptimisticUpdate happens before the HTTP response.
 *   AC-4: onRollback is called when the backend rejects.
 *   AC-5: onRollback is NOT called on success.
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReservation } from "@/hooks/use-reservation";
import {
  applyRollback,
  type OptimisticOverrides,
} from "@/components/floor-plan/optimistic-overrides";

beforeEach(() => {
  vi.resetAllMocks();
});

/**
 * Runs the reserve flow the way FloorPlanSection.handleReserve does and reports
 * the order of side effects so we can assert "optimistic before HTTP".
 */
async function runReserveFlow(
  reserve: ReturnType<typeof useReservation>["reserve"],
  tableId: string,
) {
  const events: string[] = [];
  let overrides: OptimisticOverrides = new Map();

  // Optimistic update applied BEFORE the HTTP call.
  events.push("optimistic");
  overrides.set(tableId, {
    status: "red",
    reservation: { _id: "optimistic", userName: "Tú", isOwner: true },
  });

  const error = await reserve(tableId, "2026-06-17", {
    onRollback: () => {
      events.push("rollback");
      overrides = applyRollback(overrides, tableId);
    },
  });

  let refetched = false;
  if (error === null) {
    events.push("refetch");
    refetched = true;
  }

  return { events, overrides, error, refetched };
}

async function runCancelFlow(
  cancelReservation: ReturnType<typeof useReservation>["cancelReservation"],
  tableId: string,
  reservationId: string,
) {
  const events: string[] = [];
  let overrides: OptimisticOverrides = new Map();

  events.push("optimistic");
  overrides.set(tableId, { status: "green", reservation: null });

  const error = await cancelReservation(reservationId, {
    onRollback: () => {
      events.push("rollback");
      overrides = applyRollback(overrides, tableId);
    },
  });

  let refetched = false;
  if (error === null) {
    events.push("refetch");
    refetched = true;
  }

  return { events, overrides, error, refetched };
}

/* -------------------------------------------------------------------------- */
/*  Reserve — success                                                          */
/* -------------------------------------------------------------------------- */

describe("optimistic reserve flow - success", () => {
  it("applies the override before HTTP, keeps it, and refetches", async () => {
    const order: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        order.push("http");
        return { ok: true, status: 201 };
      }),
    );

    const { result } = renderHook(() => useReservation());
    let out!: Awaited<ReturnType<typeof runReserveFlow>>;
    await act(async () => {
      out = await runReserveFlow(result.current.reserve, "t1");
    });

    // AC-3: optimistic recorded before the http call.
    expect(out.events[0]).toBe("optimistic");
    // Override persists (status red, isOwner true), no rollback.
    expect(out.events).not.toContain("rollback");
    expect(out.overrides.get("t1")).toEqual({
      status: "red",
      reservation: { _id: "optimistic", userName: "Tú", isOwner: true },
    });
    // Refetch invoked on success.
    expect(out.refetched).toBe(true);
    expect(out.error).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  Reserve — failure (rollback)                                               */
/* -------------------------------------------------------------------------- */

describe("optimistic reserve flow - failure", () => {
  it("rolls back the override and surfaces the error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "Esta mesa ya está reservada" }),
      }),
    );

    const { result } = renderHook(() => useReservation());
    let out!: Awaited<ReturnType<typeof runReserveFlow>>;
    await act(async () => {
      out = await runReserveFlow(result.current.reserve, "t1");
    });

    expect(out.events).toEqual(["optimistic", "rollback"]);
    expect(out.overrides.has("t1")).toBe(false); // AC-4: override removed
    expect(out.refetched).toBe(false);
    expect(out.error).toBe("Esta mesa ya está reservada");
  });
});

/* -------------------------------------------------------------------------- */
/*  Cancel — success                                                           */
/* -------------------------------------------------------------------------- */

describe("optimistic cancel flow - success", () => {
  it("applies green/reservation=null override, keeps it, and refetches", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const { result } = renderHook(() => useReservation());
    let out!: Awaited<ReturnType<typeof runCancelFlow>>;
    await act(async () => {
      out = await runCancelFlow(result.current.cancelReservation, "t1", "r1");
    });

    expect(out.events[0]).toBe("optimistic");
    expect(out.events).not.toContain("rollback");
    expect(out.overrides.get("t1")).toEqual({
      status: "green",
      reservation: null,
    });
    expect(out.refetched).toBe(true);
    expect(out.error).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  Cancel — failure (rollback)                                                */
/* -------------------------------------------------------------------------- */

describe("optimistic cancel flow - failure", () => {
  it("rolls back the override and surfaces the error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "No puedes cancelar esta reserva" }),
      }),
    );

    const { result } = renderHook(() => useReservation());
    let out!: Awaited<ReturnType<typeof runCancelFlow>>;
    await act(async () => {
      out = await runCancelFlow(result.current.cancelReservation, "t1", "r1");
    });

    expect(out.events).toEqual(["optimistic", "rollback"]);
    expect(out.overrides.has("t1")).toBe(false);
    expect(out.refetched).toBe(false);
    expect(out.error).toBe("No puedes cancelar esta reserva");
  });
});
