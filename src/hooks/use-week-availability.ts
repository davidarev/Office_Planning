"use client";

import { useState, useEffect, useCallback } from "react";
import type { TableAvailability } from "@/domain/types/table";

export interface UseWeekAvailabilityResult {
  weekData: Record<string, TableAvailability[]> | null;
  loading: boolean;
  error: string | null;
  getDay: (date: string) => TableAvailability[] | null;
  refetch: () => void;
}

/**
 * Fetches desk availability for a full week from GET /api/availability/week.
 *
 * Loads all days in a single request and serves them from a local map,
 * avoiding individual requests when the selected day changes within the same week.
 * Reloads only when `start` or `end` change (week change).
 *
 * @param start - Week start date in YYYY-MM-DD format. Empty string disables fetching.
 * @param end   - Week end date in YYYY-MM-DD format. Empty string disables fetching.
 * @returns `{ weekData, loading, error, getDay, refetch }`
 *
 * Aborts in-flight requests when the week changes or the component unmounts.
 */
export function useWeekAvailability(
  start: string,
  end: string,
): UseWeekAvailabilityResult {
  const [weekData, setWeekData] = useState<Record<
    string,
    TableAvailability[]
  > | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCounter, setFetchCounter] = useState<number>(0);

  useEffect(() => {
    if (!start || !end) {
      setWeekData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setWeekData(null);
    setError(null);

    fetch(`/api/availability/week?start=${start}&end=${end}`, { signal })
      .then(async (response) => {
        if (!response.ok) {
          let message = `Error ${response.status}`;
          try {
            const body = await response.json();
            if (typeof body?.error === "string") {
              message = body.error;
            }
          } catch {
            // use generic message
          }
          setError(message);
          setWeekData(null);
          return;
        }
        const json: Record<string, TableAvailability[]> = await response.json();
        setWeekData(json);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Error de red desconocido";
        setError(message);
        setWeekData(null);
      })
      .finally(() => {
        if (!signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [start, end, fetchCounter]);

  const getDay = useCallback(
    (date: string): TableAvailability[] | null => {
      return weekData?.[date] ?? null;
    },
    [weekData],
  );

  const refetch = useCallback(() => {
    setFetchCounter((c) => c + 1);
  }, []);

  return { weekData, loading, error, getDay, refetch };
}
