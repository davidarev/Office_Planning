/**
 * Reservation service — read-only operations for now.
 *
 * This layer sits between API routes and the data-access layer.
 * It may contain light transformation logic (e.g. enriching reservations
 * with user/table names) but does NOT yet implement create/cancel flows.
 *
 * @module reservationService
 */

import {
  getReservationsByDate,
  getReservationsByDateRange,
} from "@/lib/db";
import { normalizeDate } from "@/lib/dates";
import type { IReservation, ReservationPublic } from "@/domain/types";

/**
 * Converts an internal reservation document to its public representation.
 *
 * @param reservation - The raw reservation document from the database
 * @returns A client-safe reservation object with string IDs and ISO date
 */
function toPublic(reservation: IReservation): ReservationPublic {
  return {
    _id: reservation._id.toString(),
    userId: reservation.userId.toString(),
    tableId: reservation.tableId.toString(),
    date: reservation.date.toISOString().split("T")[0],
    status: reservation.status,
  };
}

/**
 * Returns all confirmed reservations for a single day.
 *
 * @param date - The target date (Date or ISO string)
 * @returns Array of public reservation objects for that day
 */
export async function getReservationsForDay(
  date: Date | string
): Promise<ReservationPublic[]> {
  const normalized = normalizeDate(date);
  const reservations = await getReservationsByDate(normalized);
  return reservations.map(toPublic);
}

/**
 * Returns all confirmed reservations within an inclusive date range.
 *
 * @param start - Start date of the range (inclusive)
 * @param end - End date of the range (inclusive)
 * @returns Array of public reservation objects in the range, sorted by date
 */
export async function getReservationsForRange(
  start: Date | string,
  end: Date | string
): Promise<ReservationPublic[]> {
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);
  const reservations = await getReservationsByDateRange(
    normalizedStart,
    normalizedEnd
  );
  return reservations.map(toPublic);
}
