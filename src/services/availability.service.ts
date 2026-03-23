/**
 * Availability service — computes the status of each table for a given day.
 *
 * This is the central piece of business logic that determines what the
 * user sees on the floor plan: which desks are free, occupied, preferred,
 * or blocked.
 *
 * Status computation rules (in priority order):
 * 1. table.isActive = false → gray (blocked)
 * 2. table.type = "blocked" → gray
 * 3. confirmed reservation exists for that day → red (occupied)
 * 4. table.type = "fixed" → red (occupied by assigned user)
 * 5. table.type = "preferential" → yellow (preferred, but bookable)
 * 6. otherwise → green (free)
 *
 * @module availabilityService
 */

import {
  listActiveTables,
  getReservationsByDate,
  getReservationsByDateRange,
  getUserById,
} from "@/lib/db";
import { normalizeDate } from "@/lib/dates";
import type {
  ITable,
  IReservation,
  TableAvailability,
  TableStatus,
} from "@/domain/types";

/**
 * Resolves the user name for a given ObjectId.
 * Returns "Usuario desconocido" if the user is not found.
 */
async function resolveUserName(userId: string): Promise<string> {
  const user = await getUserById(userId);
  return user?.name ?? "Usuario desconocido";
}

/**
 * Builds a lookup map of userId strings that appear in a set of reservations,
 * resolving each to their display name. This avoids N+1 queries when
 * processing multiple tables.
 */
async function buildUserNameMap(
  reservations: IReservation[],
  tables: ITable[]
): Promise<Map<string, string>> {
  const userIds = new Set<string>();

  for (const r of reservations) {
    userIds.add(r.userId.toString());
  }
  for (const t of tables) {
    if (t.assignedTo) {
      userIds.add(t.assignedTo.toString());
    }
  }

  const entries = await Promise.all(
    Array.from(userIds).map(async (id) => {
      const name = await resolveUserName(id);
      return [id, name] as const;
    })
  );

  return new Map(entries);
}

/**
 * Computes the visual status for a single table on a given day.
 *
 * @param table - The table document
 * @param reservation - The confirmed reservation for this table on this day, or null
 * @returns The computed TableStatus (green, yellow, red, gray)
 */
function computeStatus(
  table: ITable,
  reservation: IReservation | null
): TableStatus {
  // 1. Inactive table → blocked
  if (!table.isActive) return "gray";

  // 2. Blocked type → blocked
  if (table.type === "blocked") return "gray";

  // 3. Confirmed reservation → occupied
  if (reservation) return "red";

  // 4. Fixed desk (no reservation, but permanently assigned) → occupied
  if (table.type === "fixed") return "red";

  // 5. Preferential desk (no reservation) → preferred
  if (table.type === "preferential") return "yellow";

  // 6. Default → free
  return "green";
}

/**
 * Returns the availability status for all tables on a specific date.
 *
 * Fetches all active tables and all confirmed reservations for that day,
 * then computes each table's status in a single pass.
 *
 * Note: Inactive tables are excluded from the result because they are
 * fetched via listActiveTables. Only active tables appear on the floor plan.
 *
 * @param date - The target date (Date or ISO string)
 * @returns Array of TableAvailability objects for all active tables
 */
export async function getTableAvailabilityForDate(
  date: Date | string
): Promise<TableAvailability[]> {
  const normalized = normalizeDate(date);

  const [tables, reservations] = await Promise.all([
    listActiveTables(),
    getReservationsByDate(normalized),
  ]);

  // Index reservations by tableId for O(1) lookup
  const reservationByTable = new Map<string, IReservation>();
  for (const r of reservations) {
    reservationByTable.set(r.tableId.toString(), r);
  }

  // Resolve all user names in batch
  const userNames = await buildUserNameMap(reservations, tables);

  return tables.map((table): TableAvailability => {
    const tableId = table._id.toString();
    const reservation = reservationByTable.get(tableId) ?? null;

    const assignedUserId = table.assignedTo?.toString() ?? null;

    return {
      tableId,
      label: table.label,
      type: table.type,
      position: table.position,
      status: computeStatus(table, reservation),
      reservation: reservation
        ? {
            _id: reservation._id.toString(),
            userId: reservation.userId.toString(),
            userName: userNames.get(reservation.userId.toString()) ?? "Usuario desconocido",
          }
        : null,
      assignedUser: assignedUserId
        ? {
            _id: assignedUserId,
            name: userNames.get(assignedUserId) ?? "Usuario desconocido",
          }
        : null,
    };
  });
}

/**
 * Returns the availability status for all tables across a date range.
 *
 * Returns a map keyed by date string (YYYY-MM-DD) where each value
 * is an array of TableAvailability objects.
 *
 * @param start - Start date of the range (inclusive)
 * @param end - End date of the range (inclusive)
 * @returns Map of date strings to availability arrays
 */
export async function getTableAvailabilityForRange(
  start: Date | string,
  end: Date | string
): Promise<Record<string, TableAvailability[]>> {
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);

  const [tables, reservations] = await Promise.all([
    listActiveTables(),
    getReservationsByDateRange(normalizedStart, normalizedEnd),
  ]);

  // Index reservations by "tableId:date" for O(1) lookup
  const reservationIndex = new Map<string, IReservation>();
  for (const r of reservations) {
    const key = `${r.tableId.toString()}:${r.date.toISOString().split("T")[0]}`;
    reservationIndex.set(key, r);
  }

  // Resolve all user names in batch
  const userNames = await buildUserNameMap(reservations, tables);

  // Generate each date in the range
  const result: Record<string, TableAvailability[]> = {};
  const cursor = new Date(normalizedStart);

  while (cursor <= normalizedEnd) {
    const dateStr = cursor.toISOString().split("T")[0];

    result[dateStr] = tables.map((table): TableAvailability => {
      const tableId = table._id.toString();
      const reservation = reservationIndex.get(`${tableId}:${dateStr}`) ?? null;
      const assignedUserId = table.assignedTo?.toString() ?? null;

      return {
        tableId,
        label: table.label,
        type: table.type,
        position: table.position,
        status: computeStatus(table, reservation),
        reservation: reservation
          ? {
              _id: reservation._id.toString(),
              userId: reservation.userId.toString(),
              userName: userNames.get(reservation.userId.toString()) ?? "Usuario desconocido",
            }
          : null,
        assignedUser: assignedUserId
          ? {
              _id: assignedUserId,
              name: userNames.get(assignedUserId) ?? "Usuario desconocido",
            }
          : null,
      };
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}
