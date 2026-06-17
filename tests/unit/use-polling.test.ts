/**
 * Unit tests for OP-260 — usePolling hook.
 *
 * Uses fake timers and manual visibilityState manipulation to verify interval
 * scheduling, pause-on-hidden, resume-on-visible and cleanup behaviour.
 *
 * AC covered (OP-260):
 *   AC-1: callback fires every intervalMs when tab is visible.
 *   AC-2: callback pauses when visibilityState = "hidden"; fires immediately
 *         and restarts when returning to "visible".
 *   AC-3 (enabled flag): callback never fires when enabled = false.
 *   AC-5: interval is cleared on unmount (no leaks).
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePolling } from "@/hooks/use-polling";

// ---------------------------------------------------------------------------
// Helpers to control document.visibilityState in jsdom
// ---------------------------------------------------------------------------

function setVisible(): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });
}

function setHidden(): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "hidden",
  });
}

function fireVisibilityChange(): void {
  document.dispatchEvent(new Event("visibilitychange"));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  setVisible();
});

afterEach(() => {
  vi.useRealTimers();
  setVisible(); // reset for other test suites
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC-1: periodic interval
// ---------------------------------------------------------------------------

describe("usePolling — interval", () => {
  it("calls callback after intervalMs", () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000));

    expect(cb).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("calls callback repeatedly every intervalMs", () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000));

    act(() => void vi.advanceTimersByTime(3000));
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("does not call callback before intervalMs elapses", () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000));

    act(() => void vi.advanceTimersByTime(999));
    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-3: enabled flag
// ---------------------------------------------------------------------------

describe("usePolling — enabled = false", () => {
  it("never calls callback when enabled is false", () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000, false));

    act(() => void vi.advanceTimersByTime(5000));
    expect(cb).not.toHaveBeenCalled();
  });

  it("starts calling callback when enabled switches from false to true", () => {
    const cb = vi.fn();
    let enabled = false;
    const { rerender } = renderHook(() => usePolling(cb, 1000, enabled));

    act(() => void vi.advanceTimersByTime(2000));
    expect(cb).not.toHaveBeenCalled();

    enabled = true;
    rerender();

    act(() => void vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("stops calling callback when enabled switches from true to false", () => {
    const cb = vi.fn();
    let enabled = true;
    const { rerender } = renderHook(() => usePolling(cb, 1000, enabled));

    act(() => void vi.advanceTimersByTime(2000));
    expect(cb).toHaveBeenCalledTimes(2);

    enabled = false;
    rerender();
    cb.mockClear();

    act(() => void vi.advanceTimersByTime(3000));
    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-2: Page Visibility API — pause on hidden
// ---------------------------------------------------------------------------

describe("usePolling — visibility: hidden pauses the interval", () => {
  it("stops calling callback when tab goes hidden", () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000));

    act(() => void vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);

    act(() => {
      setHidden();
      fireVisibilityChange();
    });

    act(() => void vi.advanceTimersByTime(5000));
    // No additional calls after hiding
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not start interval when hook mounts while tab is hidden", () => {
    setHidden();
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000));

    act(() => void vi.advanceTimersByTime(5000));
    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-2: Page Visibility API — resume on visible
// ---------------------------------------------------------------------------

describe("usePolling — visibility: visible resumes immediately", () => {
  it("fires callback immediately when returning to visible and then resumes interval", () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000));

    // Go hidden
    act(() => {
      setHidden();
      fireVisibilityChange();
    });

    const callsWhileHidden = cb.mock.calls.length;

    // Return to visible — should fire once immediately
    act(() => {
      setVisible();
      fireVisibilityChange();
    });

    expect(cb).toHaveBeenCalledTimes(callsWhileHidden + 1);

    // And then continue on the interval
    act(() => void vi.advanceTimersByTime(2000));
    expect(cb).toHaveBeenCalledTimes(callsWhileHidden + 3);
  });

  it("does not fire when returning to visible with enabled = false", () => {
    const cb = vi.fn();
    renderHook(() => usePolling(cb, 1000, false));

    act(() => {
      setHidden();
      fireVisibilityChange();
    });
    act(() => {
      setVisible();
      fireVisibilityChange();
    });

    act(() => void vi.advanceTimersByTime(3000));
    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AC-5: cleanup — no interval leak on unmount
// ---------------------------------------------------------------------------

describe("usePolling — cleanup on unmount", () => {
  it("clears the interval when the component unmounts", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const cb = vi.fn();
    const { unmount } = renderHook(() => usePolling(cb, 1000));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("stops calling callback after unmount", () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => usePolling(cb, 1000));

    act(() => void vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);

    unmount();
    cb.mockClear();

    act(() => void vi.advanceTimersByTime(5000));
    expect(cb).not.toHaveBeenCalled();
  });

  it("removes the visibilitychange listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const cb = vi.fn();
    const { unmount } = renderHook(() => usePolling(cb, 1000));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });
});

// ---------------------------------------------------------------------------
// Interval restart on intervalMs change
// ---------------------------------------------------------------------------

describe("usePolling — intervalMs change restarts interval", () => {
  it("uses the new interval after intervalMs changes", () => {
    const cb = vi.fn();
    let interval = 1000;
    const { rerender } = renderHook(() => usePolling(cb, interval));

    act(() => void vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);

    interval = 2000;
    rerender();
    cb.mockClear();

    // Old 1s interval should no longer fire
    act(() => void vi.advanceTimersByTime(1000));
    expect(cb).not.toHaveBeenCalled();

    // New 2s interval fires
    act(() => void vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
