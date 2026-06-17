"use client";

import { useReducer, useEffect, useCallback } from "react";
import type { TableAvailability } from "@/domain/types/table";

export interface UseAvailabilityResult {
  data: TableAvailability[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

type State = {
  data: TableAvailability[] | null;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: TableAvailability[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { data: null, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { data: action.payload, loading: false, error: null };
    case "FETCH_ERROR":
      return { data: null, loading: false, error: action.payload };
    case "RESET":
      return { data: null, loading: false, error: null };
    default:
      return state;
  }
}

const initialState: State = { data: null, loading: false, error: null };

/**
 * Fetches desk availability for a given date from GET /api/availability.
 *
 * @param date - ISO date string in YYYY-MM-DD format. Empty string disables fetching.
 * @returns `{ data, loading, error, refetch }` — data is null while loading or on error.
 *
 * Aborts in-flight requests when date changes or the component unmounts.
 */
export function useAvailability(date: string): UseAvailabilityResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [fetchCounter, incrementFetch] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!date) {
      dispatch({ type: "RESET" });
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    dispatch({ type: "FETCH_START" });

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
          dispatch({ type: "FETCH_ERROR", payload: message });
          return;
        }
        const json: TableAvailability[] = await response.json();
        dispatch({ type: "FETCH_SUCCESS", payload: json });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Intentionally aborted — do not update state
          return;
        }
        const message =
          err instanceof Error ? err.message : "Error de red desconocido";
        dispatch({ type: "FETCH_ERROR", payload: message });
      });

    return () => {
      controller.abort();
    };
  }, [date, fetchCounter]);

  const refetch = useCallback(() => {
    incrementFetch();
  }, []);

  return { data: state.data, loading: state.loading, error: state.error, refetch };
}
