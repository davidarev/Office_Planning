import { createContext, useContext } from "react";
import type { WorkDay } from "@/lib/week-selector";

export interface DateSelectionContextValue {
  selectedDay: WorkDay;
}

export const DateSelectionContext =
  createContext<DateSelectionContextValue | null>(null);

/**
 * Returns the currently selected work day.
 * Must be used inside a DateSelectionProvider — throws otherwise.
 */
export function useDateSelection(): DateSelectionContextValue {
  const ctx = useContext(DateSelectionContext);
  if (!ctx) {
    throw new Error("useDateSelection must be used within DateSelectionProvider");
  }
  return ctx;
}
