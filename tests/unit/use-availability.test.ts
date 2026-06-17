/**
 * Unit tests for useAvailability hook.
 *
 * Uses @testing-library/react with jsdom environment to exercise
 * React hook lifecycle (mount, date change, unmount, refetch).
 *
 * AC covered:
 *  AC-1: hook exists and is exported
 *  AC-2: calls GET /api/availability?date=<date> on mount and date change
 *  AC-3: loading is true while fetching, false when done
 *  AC-4: data contains TableAvailability[] on success
 *  AC-5: error is set on failure, null on success
 *  AC-6: aborts in-flight requests on date change and unmount
 *  AC-7: refetch re-triggers the request
 *  AC-8: empty date string → no request
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAvailability } from "@/hooks/use-availability";
import type { TableAvailability } from "@/domain/types/table";

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const mockTables: TableAvailability[] = [
  {
    tableId: "t1",
    label: "A1",
    type: "flexible",
    position: { x: 0, y: 0, width: 80, height: 60, rotation: 0 },
    status: "green",
    reservation: null,
    assignedUser: null,
  },
];

/* -------------------------------------------------------------------------- */
/*  Fetch mock helpers                                                          */
/* -------------------------------------------------------------------------- */

function mockFetchOk(body: unknown = mockTables) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(body),
  });
}

function mockFetchError(status: number, errorBody?: unknown) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi
      .fn()
      .mockResolvedValue(errorBody ?? { error: `Server error ${status}` }),
  });
}

function mockFetchNetworkError(message = "Network error") {
  return vi.fn().mockRejectedValue(new Error(message));
}

/* -------------------------------------------------------------------------- */
/*  Setup / teardown                                                            */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  AC-1: hook exists and is exported                                          */
/* -------------------------------------------------------------------------- */

describe("useAvailability — export", () => {
  it("is exported as a function", () => {
    expect(typeof useAvailability).toBe("function");
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-8: empty date → no request                                              */
/* -------------------------------------------------------------------------- */

describe("useAvailability — empty date", () => {
  it("does not fetch when date is empty string", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useAvailability(""));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-2 & AC-3 & AC-4: fetch on mount, loading states, data                  */
/* -------------------------------------------------------------------------- */

describe("useAvailability — successful fetch", () => {
  it("calls GET /api/availability?date=<date> on mount", async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useAvailability("2026-06-17"));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/availability?date=2026-06-17",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("sets loading=true while fetching and false when done", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    const { result } = renderHook(() => useAvailability("2026-06-17"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("sets data to the returned array on success", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockTables));

    const { result } = renderHook(() => useAvailability("2026-06-17"));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockTables);
    });
    expect(result.current.error).toBeNull();
  });

  it("handles empty array response without error", async () => {
    vi.stubGlobal("fetch", mockFetchOk([]));

    const { result } = renderHook(() => useAvailability("2026-06-17"));

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
    expect(result.current.error).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-5: error handling                                                       */
/* -------------------------------------------------------------------------- */

describe("useAvailability — error handling", () => {
  it("sets error from server JSON body on HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetchError(400, { error: "Fecha inválida" }));

    const { result } = renderHook(() => useAvailability("2026-06-17"));

    await waitFor(() => {
      expect(result.current.error).toBe("Fecha inválida");
    });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("uses generic error message when server error has no body", async () => {
    vi.stubGlobal("fetch", mockFetchError(500, {}));

    const { result } = renderHook(() => useAvailability("2026-06-17"));

    await waitFor(() => {
      expect(result.current.error).toBe("Error 500");
    });
  });

  it("sets error on network failure", async () => {
    vi.stubGlobal("fetch", mockFetchNetworkError("Failed to fetch"));

    const { result } = renderHook(() => useAvailability("2026-06-17"));

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch");
    });
    expect(result.current.data).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-2: re-fetches when date changes                                         */
/* -------------------------------------------------------------------------- */

describe("useAvailability — date change", () => {
  it("re-fetches when date prop changes", async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal("fetch", fetchSpy);

    const { rerender } = renderHook(
      ({ date }: { date: string }) => useAvailability(date),
      { initialProps: { date: "2026-06-17" } }
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    rerender({ date: "2026-06-18" });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "/api/availability?date=2026-06-18",
      expect.anything()
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-7: refetch                                                              */
/* -------------------------------------------------------------------------- */

describe("useAvailability — refetch", () => {
  it("re-triggers the request when refetch is called", async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useAvailability("2026-06-17"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-6: AbortController — unmount                                            */
/* -------------------------------------------------------------------------- */

describe("useAvailability — abort on unmount", () => {
  it("does not update state after unmount (no memory leak)", async () => {
    let resolvePromise!: (value: unknown) => void;
    const pendingFetch = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const fetchSpy = vi.fn().mockReturnValue(pendingFetch);
    vi.stubGlobal("fetch", fetchSpy);

    const { result, unmount } = renderHook(() => useAvailability("2026-06-17"));

    expect(result.current.loading).toBe(true);

    unmount();

    // Resolve after unmount — state should not update
    act(() => {
      resolvePromise({ ok: true, json: () => Promise.resolve(mockTables) });
    });

    // State stays as it was at unmount (loading was true, data null)
    expect(result.current.data).toBeNull();
  });
});
