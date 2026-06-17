"use client";

import { useReducer, useEffect, useCallback } from "react";
import type { TableAvailability } from "@/domain/types/table";

export interface UseWeekAvailabilityResult {
  weekData: Record<string, TableAvailability[]> | null;
  loading: boolean;
  error: string | null;
  getDay: (date: string) => TableAvailability[] | null;
  refetch: () => void;
}

type State = {
  weekData: Record<string, TableAvailability[]> | null;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Record<string, TableAvailability[]> }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { weekData: null, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { weekData: action.payload, loading: false, error: null };
    case "FETCH_ERROR":
      return { weekData: null, loading: false, error: action.payload };
    case "RESET":
      return { weekData: null, loading: false, error: null };
    default:
      return state;
  }
}

const initialState: State = { weekData: null, loading: false, error: null };

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
  const [state, dispatch] = useReducer(reducer, initialState);
  const [fetchCounter, incrementFetch] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!start || !end) {
      dispatch({ type: "RESET" });
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    dispatch({ type: "FETCH_START" });

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
          dispatch({ type: "FETCH_ERROR", payload: message });
          return;
        }
        const json: Record<string, TableAvailability[]> = await response.json();
        dispatch({ type: "FETCH_SUCCESS", payload: json });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Error de red desconocido";
        dispatch({ type: "FETCH_ERROR", payload: message });
      });

    return () => {
      controller.abort();
    };
  }, [start, end, fetchCounter]);

  const getDay = useCallback(
    (date: string): TableAvailability[] | null => {
      return state.weekData?.[date] ?? null;
    },
    [state.weekData],
  );

  const refetch = useCallback(() => {
    incrementFetch();
  }, []);

  return { weekData: state.weekData, loading: state.loading, error: state.error, getDay, refetch };
}
