import type { TableAvailability, TableStatus } from "@/domain/types";

/**
 * Maps each TableStatus to its Tailwind background and text color classes.
 * Uses a static Record to avoid dynamic class construction, which Tailwind
 * would purge at build time.
 *
 * Color rationale (WCAG AA contrast):
 *   green  → bg-green-500  + white text
 *   yellow → bg-yellow-400 + dark text (black)
 *   red    → bg-red-500    + white text
 *   gray   → bg-gray-400   + dark text (muted, communicates non-interactive)
 */
export const statusColorMap: Record<TableStatus, string> = {
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-400 text-gray-900",
  red: "bg-red-500 text-white",
  gray: "bg-gray-400 text-gray-700",
};

/**
 * Returns the Tailwind color classes for a given status.
 * Falls back to gray if the status is unexpected or undefined.
 */
export function getStatusColorClasses(status: TableStatus | string): string {
  return statusColorMap[status as TableStatus] ?? statusColorMap.gray;
}

/**
 * Derives the occupant name to display for a desk, following priority:
 * 1. reservation.userName (confirmed booking takes precedence)
 * 2. assignedUser.name (habitual user when no active reservation)
 * 3. null if neither exists or both are empty strings
 */
export function getOccupantName(table: TableAvailability): string | null {
  if (table.reservation?.userName) return table.reservation.userName;
  if (table.assignedUser?.name) return table.assignedUser.name;
  return null;
}
