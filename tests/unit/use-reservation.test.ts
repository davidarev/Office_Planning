/**
 * Unit tests for OP-255 — useReservation hook (fetch mocked).
 *
 * Uses @testing-library/react with jsdom environment to exercise the hook's
 * reserve / cancelReservation behaviour, loading flags and optimistic callbacks.
 *
 * AC covered (OP-255):
 *   AC-2: covers reserve and cancelReservation.
 *   AC-3: onOptimisticUpdate is invoked before the HTTP response (here: the
 *         component is responsible for calling it before reserve — see
 *         optimistic-flow.test.ts; the hook invokes onRollback on failure).
 *   AC-4: onRollback is called when the backend rejects.
 *   AC-5: onRollback is NOT called on success.
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useReservation } from "@/hooks/use-reservation";

beforeEach(() => {
  vi.resetAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  reserve                                                                    */
/* -------------------------------------------------------------------------- */

describe("useReservation - reserve", () => {
  it("calls POST /api/reservations with body { tableId, date }", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useReservation());
    await act(async () => {
      await result.current.reserve("t1", "2026-06-17");
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/reservations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tableId: "t1", date: "2026-06-17" }),
      }),
    );
  });

  it("returns null on a 201 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 201 }));

    const { result } = renderHook(() => useReservation());
    let value: string | null = "x";
    await act(async () => {
      value = await result.current.reserve("t1", "2026-06-17");
    });

    expect(value).toBeNull();
  });

  it("returns the JSON error message on a 409 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "Esta mesa ya está reservada" }),
      }),
    );

    const { result } = renderHook(() => useReservation());
    let value: string | null = null;
    await act(async () => {
      value = await result.current.reserve("t1", "2026-06-17");
    });

    expect(value).toBe("Esta mesa ya está reservada");
  });

  it("returns a generic message when the JSON has no error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );

    const { result } = renderHook(() => useReservation());
    let value: string | null = null;
    await act(async () => {
      value = await result.current.reserve("t1", "2026-06-17");
    });

    expect(value).toBe("Error al realizar la reserva");
  });

  it("returns a connection message when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const { result } = renderHook(() => useReservation());
    let value: string | null = null;
    await act(async () => {
      value = await result.current.reserve("t1", "2026-06-17");
    });

    expect(value).toBe("Error de conexión. Inténtalo de nuevo.");
  });

  it("sets isReserving true during the call and false afterwards", async () => {
    let resolveFetch: (v: { ok: boolean; status: number }) => void = () => {};
    const pending = new Promise<{ ok: boolean; status: number }>((res) => {
      resolveFetch = res;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

    const { result } = renderHook(() => useReservation());

    let call: Promise<string | null>;
    act(() => {
      call = result.current.reserve("t1", "2026-06-17");
    });

    await waitFor(() => expect(result.current.isReserving).toBe(true));

    await act(async () => {
      resolveFetch({ ok: true, status: 201 });
      await call;
    });

    expect(result.current.isReserving).toBe(false);
  });

  it("calls onRollback when the backend rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "conflicto" }),
      }),
    );
    const onRollback = vi.fn();

    const { result } = renderHook(() => useReservation());
    await act(async () => {
      await result.current.reserve("t1", "2026-06-17", { onRollback });
    });

    expect(onRollback).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onRollback on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 201 }));
    const onRollback = vi.fn();

    const { result } = renderHook(() => useReservation());
    await act(async () => {
      await result.current.reserve("t1", "2026-06-17", { onRollback });
    });

    expect(onRollback).not.toHaveBeenCalled();
  });
});

/* -------------------------------------------------------------------------- */
/*  cancelReservation                                                          */
/* -------------------------------------------------------------------------- */

describe("useReservation - cancelReservation", () => {
  it("calls DELETE /api/reservations/:id", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useReservation());
    await act(async () => {
      await result.current.cancelReservation("r1");
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/reservations/r1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("returns null on a 200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    const { result } = renderHook(() => useReservation());
    let value: string | null = "x";
    await act(async () => {
      value = await result.current.cancelReservation("r1");
    });

    expect(value).toBeNull();
  });

  it("returns the JSON error message on a 4xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "No puedes cancelar esta reserva" }),
      }),
    );

    const { result } = renderHook(() => useReservation());
    let value: string | null = null;
    await act(async () => {
      value = await result.current.cancelReservation("r1");
    });

    expect(value).toBe("No puedes cancelar esta reserva");
  });

  it("sets isCancelling true during the call and false afterwards", async () => {
    let resolveFetch: (v: { ok: boolean; status: number }) => void = () => {};
    const pending = new Promise<{ ok: boolean; status: number }>((res) => {
      resolveFetch = res;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

    const { result } = renderHook(() => useReservation());

    let call: Promise<string | null>;
    act(() => {
      call = result.current.cancelReservation("r1");
    });

    await waitFor(() => expect(result.current.isCancelling).toBe(true));

    await act(async () => {
      resolveFetch({ ok: true, status: 200 });
      await call;
    });

    expect(result.current.isCancelling).toBe(false);
  });

  it("calls onRollback when the backend rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "conflicto" }),
      }),
    );
    const onRollback = vi.fn();

    const { result } = renderHook(() => useReservation());
    await act(async () => {
      await result.current.cancelReservation("r1", { onRollback });
    });

    expect(onRollback).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onRollback on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const onRollback = vi.fn();

    const { result } = renderHook(() => useReservation());
    await act(async () => {
      await result.current.cancelReservation("r1", { onRollback });
    });

    expect(onRollback).not.toHaveBeenCalled();
  });
});
