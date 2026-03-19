/**
 * Data-access layer for the Reservation entity.
 *
 * All functions in this module perform direct database queries.
 * They do NOT contain business logic — that belongs in the service layer.
 *
 * Queries filter by status: "confirmed" by default, since cancelled
 * reservations are generally not relevant for availability checks.
 *
 * @module reservationRepository
 */

import { connectDB } from "@/lib/mongodb";
import { Reservation } from "@/lib/models";
import { normalizeDate } from "@/lib/dates";
import type { IReservation } from "@/domain/types";

/**
 * Returns all confirmed reservations for a specific date.
 *
 * @param date - The target date (will be normalized to UTC midnight)
 * @returns Array of confirmed reservation documents for that day
 */
export async function getReservationsByDate(
  date: Date | string
): Promise<IReservation[]> {
  await connectDB();
  const normalized = normalizeDate(date);

  return Reservation.find({ date: normalized, status: "confirmed" })
    .lean<IReservation[]>();
}

/**
 * Returns all confirmed reservations within an inclusive date range.
 *
 * @param start - Start date of the range (inclusive, normalized)
 * @param end - End date of the range (inclusive, normalized)
 * @returns Array of confirmed reservation documents in the range
 */
export async function getReservationsByDateRange(
  start: Date | string,
  end: Date | string
): Promise<IReservation[]> {
  await connectDB();
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);

  return Reservation.find({
    date: { $gte: normalizedStart, $lte: normalizedEnd },
    status: "confirmed",
  })
    .sort({ date: 1 })
    .lean<IReservation[]>();
}

/**
 * Finds the confirmed reservation for a specific user on a specific date.
 *
 * @param userId - The user's ObjectId as a string
 * @param date - The target date (normalized)
 * @returns The reservation document, or null if the user has no reservation that day
 */
export async function getUserReservationByDate(
  userId: string,
  date: Date | string
): Promise<IReservation | null> {
  await connectDB();
  const normalized = normalizeDate(date);

  return Reservation.findOne({
    userId,
    date: normalized,
    status: "confirmed",
  }).lean<IReservation>();
}

/**
 * Finds the confirmed reservation for a specific table on a specific date.
 *
 * @param tableId - The table's ObjectId as a string
 * @param date - The target date (normalized)
 * @returns The reservation document, or null if the table is not reserved that day
 */
export async function getTableReservationByDate(
  tableId: string,
  date: Date | string
): Promise<IReservation | null> {
  await connectDB();
  const normalized = normalizeDate(date);

  return Reservation.findOne({
    tableId,
    date: normalized,
    status: "confirmed",
  }).lean<IReservation>();
}
