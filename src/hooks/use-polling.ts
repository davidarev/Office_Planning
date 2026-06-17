"use client";

import { useEffect, useRef } from "react";

export const POLLING_INTERVAL_MS = 30_000;

/**
 * Executes `callback` periodically every `intervalMs` milliseconds while the
 * browser tab is visible.
 *
 * Behaviour:
 * - Pauses when `document.visibilityState === "hidden"` (Page Visibility API).
 * - On returning to foreground, fires `callback` immediately and restarts the
 *   interval so the user always sees fresh data without waiting a full cycle.
 * - Does nothing when `enabled` is `false` — useful to prevent polls during
 *   in-flight mutations (reserve / cancel).
 * - Cleans up the interval and the visibility listener on unmount.
 *
 * @param callback   - Function to call on each tick. Kept in a ref so callers
 *                     can pass an inline function without restarting the timer.
 * @param intervalMs - Milliseconds between ticks. Changes restart the interval.
 * @param enabled    - When `false`, no interval is started. Defaults to `true`.
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true,
): void {
  // Keep the latest callback without restarting the interval on every render.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timerId: ReturnType<typeof setInterval> | null = null;

    function start(): void {
      timerId = setInterval(() => callbackRef.current(), intervalMs);
    }

    function stop(): void {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        callbackRef.current();
        start();
      }
    }

    if (document.visibilityState === "visible") {
      start();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
