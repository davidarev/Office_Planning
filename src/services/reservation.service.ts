/**
 * Reservation service — handles read, create, and cancel operations.
 *
 * This layer sits between API routes and the data-access layer.
 * It enforces all business rules related to reservations:
 * - A user can have at most one confirmed reservation per day
 * - A table can have at most one confirmed reservation per day
 * - Fixed and blocked tables cannot be reserved
 * - Only the reservation owner or an admin can cancel
 * - Concurrency is handled via MongoDB unique indexes (E11000)
 *
 * @module reservationService
 */

import {
  getReservationsByDate,
  getReservationsByDateRange,
  getReservationById,
  getTableById,
  getUserReservationByDate,
  getTableReservationByDate,
  insertReservation,
  markReservationCancelled,
} from "@/lib/db";
import { normalizeDate, isValidDateString } from "@/lib/dates";
import type {
  IReservation,
  ReservationPublic,
  ServiceResult,
  UserRole,
} from "@/domain/types";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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
 * Checks whether a MongoDB error is a duplicate key error (E11000).
 * This error is thrown when a unique index constraint is violated,
 * which is our primary concurrency safeguard for reservations.
 */
function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

/**
 * Determines a user-friendly conflict message from the duplicate key error.
 * MongoDB includes the violated index name in the error message, which
 * lets us distinguish between table-level and user-level conflicts.
 */
function getDuplicateKeyMessage(err: unknown): string {
  const message =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: string }).message)
      : "";

  if (message.includes("userId")) {
    return "Ya tienes una reserva confirmada para este día";
  }
  if (message.includes("tableId")) {
    return "Esta mesa ya está reservada para este día";
  }

  // Fallback — should not happen but covers edge cases
  return "Conflicto al crear la reserva. Inténtalo de nuevo";
}

/* -------------------------------------------------------------------------- */
/*  Read operations                                                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Create reservation                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new desk reservation after validating all business rules.
 *
 * Validation order:
 * 1. Date format is valid
 * 2. Table exists and is active
 * 3. Table type is not "blocked" or "fixed"
 * 4. User does not already have a confirmed reservation for that day
 * 5. Table does not already have a confirmed reservation for that day
 *
 * Even after all pre-checks pass, MongoDB unique indexes serve as the
 * final concurrency guard. If two requests pass validation simultaneously,
 * only one insert will succeed — the other gets a duplicate key error (E11000)
 * which is caught and returned as a conflict.
 *
 * @param userId - The authenticated user's ID
 * @param tableId - The target table's ID
 * @param date - The reservation date as YYYY-MM-DD string
 * @returns ServiceResult with the created reservation or an error
 */
export async function createReservation(
  userId: string,
  tableId: string,
  date: string
): Promise<ServiceResult<ReservationPublic>> {
  // 1. Validate date format
  if (!isValidDateString(date)) {
    return { ok: false, code: "validation", message: "Formato de fecha inválido. Usa YYYY-MM-DD" };
  }

  const normalized = normalizeDate(date);

  // 2. Table must exist and be active
  const table = await getTableById(tableId);

  if (!table) {
    return { ok: false, code: "not_found", message: "Mesa no encontrada" };
  }

  if (!table.isActive) {
    return { ok: false, code: "validation", message: "Esta mesa no está disponible" };
  }

  // 3. Table type restrictions
  if (table.type === "blocked") {
    return { ok: false, code: "validation", message: "Esta mesa está bloqueada y no se puede reservar" };
  }

  if (table.type === "fixed") {
    return { ok: false, code: "validation", message: "Esta mesa es fija y no se puede reservar" };
  }

  // 4. Check if user already has a reservation for this day
  const existingUserReservation = await getUserReservationByDate(userId, normalized);
  if (existingUserReservation) {
    return { ok: false, code: "conflict", message: "Ya tienes una reserva confirmada para este día" };
  }

  // 5. Check if table already has a reservation for this day
  const existingTableReservation = await getTableReservationByDate(tableId, normalized);
  if (existingTableReservation) {
    return { ok: false, code: "conflict", message: "Esta mesa ya está reservada para este día" };
  }

  // 6. Attempt insert — MongoDB unique indexes are the final safeguard
  try {
    const reservation = await insertReservation(userId, tableId, normalized);
    return { ok: true, data: toPublic(reservation) };
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      return { ok: false, code: "conflict", message: getDuplicateKeyMessage(err) };
    }
    // Re-throw unexpected errors for the API layer to handle
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*  Cancel reservation                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Cancels an existing reservation.
 *
 * Authorization rules:
 * - The reservation owner can cancel their own reservation
 * - An admin can cancel any reservation
 *
 * The reservation document is not deleted — its status is set to "cancelled"
 * to preserve booking history.
 *
 * @param userId - The ID of the user requesting cancellation
 * @param userRole - The role of the user requesting cancellation
 * @param reservationId - The ID of the reservation to cancel
 * @returns ServiceResult with the cancelled reservation or an error
 */
export async function cancelReservation(
  userId: string,
  userRole: UserRole,
  reservationId: string
): Promise<ServiceResult<ReservationPublic>> {
  // 1. Find the reservation
  const reservation = await getReservationById(reservationId);

  if (!reservation) {
    return { ok: false, code: "not_found", message: "Reserva no encontrada" };
  }

  // 2. Already cancelled
  if (reservation.status === "cancelled") {
    return { ok: false, code: "validation", message: "Esta reserva ya está cancelada" };
  }

  // 3. Authorization: only owner or admin
  const isOwner = reservation.userId.toString() === userId;
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    return { ok: false, code: "forbidden", message: "No tienes permiso para cancelar esta reserva" };
  }

  // 4. Mark as cancelled
  const updated = await markReservationCancelled(reservation._id);

  if (!updated) {
    return { ok: false, code: "not_found", message: "Error al cancelar la reserva" };
  }

  return { ok: true, data: toPublic(updated) };
}
