/**
 * Unit tests for useWeekAvailability hook.
 *
 * Uses @testing-library/react with jsdom environment to exercise
 * React hook lifecycle (mount, week change, unmount, refetch, getDay).
 *
 * AC covered:
 *  AC-1: hook exists and is exported
 *  AC-2: calls GET /api/availability/week?start=<start>&end=<end> once per active week
 *  AC-3: loading is true while fetching, false when done
 *  AC-4: weekData contains Record<string, TableAvailability[]> on success
 *  AC-5: getDay returns correct array for in-range dates, null for out-of-range
 *  AC-6: changing selected day within same week does not trigger a new request
 *  AC-7: in-flight requests are aborted on week change and unmount
 *  AC-8: refetch re-triggers the request for the active week
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWeekAvailability } from "@/hooks/use-week-availability";
import type { TableAvailability } from "@/domain/types/table";

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const table1: TableAvailability = {
  tableId: "t1",
  label: "A1",
  type: "flexible",
  position: { x: 0, y: 0, width: 80, height: 60, rotation: 0 },
  status: "green",
  reservation: null,
  assignedUser: null,
};

const mockWeekData: Record<string, TableAvailability[]> = {
  "2026-06-15": [table1],
  "2026-06-16": [{ ...table1, status: "red" }],
  "2026-06-17": [],
};

const START = "2026-06-15";
const END = "2026-06-19";

/* -------------------------------------------------------------------------- */
/*  Fetch mock helpers                                                          */
/* -------------------------------------------------------------------------- */

function mockFetchOk(body: unknown = mockWeekData) {
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

describe("useWeekAvailability — export", () => {
  it("is exported as a function", () => {
    expect(typeof useWeekAvailability).toBe("function");
  });
});

/* -------------------------------------------------------------------------- */
/*  empty start/end → no request                                               */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — empty params", () => {
  it("does not fetch when start is empty string", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useWeekAvailability("", END));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.weekData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when end is empty string", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useWeekAvailability(START, ""));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.weekData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when both params are empty", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useWeekAvailability("", ""));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-2 & AC-3 & AC-4: fetch on mount, loading states, weekData              */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — successful fetch", () => {
  it("calls GET /api/availability/week?start=<start>&end=<end> on mount", async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal("fetch", fetchSpy);

    renderHook(() => useWeekAvailability(START, END));

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/availability/week?start=${START}&end=${END}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("sets loading=true while fetching and false when done", async () => {
    vi.stubGlobal("fetch", mockFetchOk());

    const { result } = renderHook(() => useWeekAvailability(START, END));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("sets weekData to the returned map on success", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockWeekData));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => {
      expect(result.current.weekData).toEqual(mockWeekData);
    });
    expect(result.current.error).toBeNull();
  });

  it("handles empty map response without error", async () => {
    vi.stubGlobal("fetch", mockFetchOk({}));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => {
      expect(result.current.weekData).toEqual({});
    });
    expect(result.current.error).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-5: getDay                                                               */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — getDay", () => {
  it("returns the correct array for a date within the week", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockWeekData));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => expect(result.current.weekData).not.toBeNull());

    expect(result.current.getDay("2026-06-15")).toEqual(mockWeekData["2026-06-15"]);
    expect(result.current.getDay("2026-06-16")).toEqual(mockWeekData["2026-06-16"]);
    expect(result.current.getDay("2026-06-17")).toEqual([]);
  });

  it("returns null for a date outside the week range", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockWeekData));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => expect(result.current.weekData).not.toBeNull());

    expect(result.current.getDay("2026-06-22")).toBeNull();
    expect(result.current.getDay("2026-06-01")).toBeNull();
  });

  it("returns null when weekData is null (loading state)", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    expect(result.current.weekData).toBeNull();
    expect(result.current.getDay("2026-06-15")).toBeNull();
  });

  it("returns null for any date when server returns empty map", async () => {
    vi.stubGlobal("fetch", mockFetchOk({}));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => expect(result.current.weekData).toEqual({}));

    expect(result.current.getDay("2026-06-15")).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-6: changing selected day does NOT trigger new request                   */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — day change within week", () => {
  it("does not re-fetch when only the selected day changes (start/end unchanged)", async () => {
    const fetchSpy = mockFetchOk(mockWeekData);
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Simulate selecting different days within the same week by calling getDay —
    // hook state (start/end) does not change, so no new fetch occurs.
    act(() => {
      result.current.getDay("2026-06-16");
      result.current.getDay("2026-06-17");
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-2: re-fetches when week changes (start or end changes)                  */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — week change", () => {
  it("re-fetches when start changes", async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal("fetch", fetchSpy);

    const { rerender } = renderHook(
      ({ start, end }: { start: string; end: string }) =>
        useWeekAvailability(start, end),
      { initialProps: { start: START, end: END } },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    rerender({ start: "2026-06-22", end: "2026-06-26" });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "/api/availability/week?start=2026-06-22&end=2026-06-26",
      expect.anything(),
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-8: refetch                                                              */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — refetch", () => {
  it("re-triggers the request when refetch is called", async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });
});

/* -------------------------------------------------------------------------- */
/*  error handling                                                             */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — error handling", () => {
  it("sets error from server JSON body on HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetchError(400, { error: "Rango inválido" }));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => {
      expect(result.current.error).toBe("Rango inválido");
    });
    expect(result.current.weekData).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("uses generic error message when server error has no body", async () => {
    vi.stubGlobal("fetch", mockFetchError(500, {}));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => {
      expect(result.current.error).toBe("Error 500");
    });
  });

  it("sets error on network failure", async () => {
    vi.stubGlobal("fetch", mockFetchNetworkError("Failed to fetch"));

    const { result } = renderHook(() => useWeekAvailability(START, END));

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch");
    });
    expect(result.current.weekData).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-7: AbortController — unmount                                            */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — abort on unmount", () => {
  it("does not update state after unmount (no memory leak)", async () => {
    let resolvePromise!: (value: unknown) => void;
    const pendingFetch = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const fetchSpy = vi.fn().mockReturnValue(pendingFetch);
    vi.stubGlobal("fetch", fetchSpy);

    const { result, unmount } = renderHook(() =>
      useWeekAvailability(START, END),
    );

    expect(result.current.loading).toBe(true);

    unmount();

    act(() => {
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(mockWeekData),
      });
    });

    expect(result.current.weekData).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  AC-7: AbortController — week change aborts previous request                */
/* -------------------------------------------------------------------------- */

describe("useWeekAvailability — abort on week change", () => {
  it("aborts previous request when week changes", async () => {
    const abortSpy = vi.fn();
    const originalAbortController = globalThis.AbortController;

    class MockAbortController {
      signal = { aborted: false } as AbortSignal;
      abort = abortSpy;
    }

    vi.stubGlobal("AbortController", MockAbortController);
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    const { rerender } = renderHook(
      ({ start, end }: { start: string; end: string }) =>
        useWeekAvailability(start, end),
      { initialProps: { start: START, end: END } },
    );

    rerender({ start: "2026-06-22", end: "2026-06-26" });

    expect(abortSpy).toHaveBeenCalled();

    vi.stubGlobal("AbortController", originalAbortController);
  });
});
