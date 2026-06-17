"use client";

import { useState, useEffect, useCallback } from "react";
import type { TableAvailability } from "@/domain/types/table";

export interface UseAvailabilityResult {
  data: TableAvailability[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches desk availability for a given date from GET /api/availability.
 *
 * @param date - ISO date string in YYYY-MM-DD format. Empty string disables fetching.
 * @returns `{ data, loading, error, refetch }` — data is null while loading or on error.
 *
 * Aborts in-flight requests when date changes or the component unmounts.
 */
export function useAvailability(date: string): UseAvailabilityResult {
  const [data, setData] = useState<TableAvailability[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCounter, setFetchCounter] = useState<number>(0);

  useEffect(() => {
    if (!date) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setData(null);
    setError(null);

    fetch(`/api/availability?date=${date}`, { signal })
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
          setData(null);
          return;
        }
        const json: TableAvailability[] = await response.json();
        setData(json);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Intentionally aborted — do not update state
          return;
        }
        const message =
          err instanceof Error ? err.message : "Error de red desconocido";
        setError(message);
        setData(null);
      })
      .finally(() => {
        if (!signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [date, fetchCounter]);

  const refetch = useCallback(() => {
    setFetchCounter((c) => c + 1);
  }, []);

  return { data, loading, error, refetch };
}
