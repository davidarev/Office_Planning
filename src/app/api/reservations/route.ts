import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { getReservationsForDay, createReservation } from "@/services";
import { isValidDateString } from "@/lib/dates";
import type { ServiceErrorCode } from "@/domain/types";

/** Maps service error codes to HTTP status codes. */
const HTTP_STATUS: Record<ServiceErrorCode, number> = {
  validation: 400,
  not_found: 404,
  forbidden: 403,
  conflict: 409,
};

/**
 * GET /api/reservations?date=YYYY-MM-DD
 *
 * Returns all confirmed reservations for a specific date.
 * Requires an authenticated session.
 *
 * @param request - Must include a `date` query parameter in YYYY-MM-DD format
 * @returns 200 with array of reservations for that day
 * @returns 400 if `date` is missing or invalid
 * @returns 401 if not authenticated
 * @returns 500 on internal error
 */
export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const date = request.nextUrl.searchParams.get("date");

  if (!date || !isValidDateString(date)) {
    return NextResponse.json(
      { error: "Parámetro 'date' requerido en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const reservations = await getReservationsForDay(date);
    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las reservas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 *
 * Creates a new desk reservation for the authenticated user.
 * Requires a JSON body with `tableId` (string) and `date` (YYYY-MM-DD).
 *
 * Business rules enforced by the service layer:
 * - User can have at most one reservation per day
 * - Table must be active, not blocked, not fixed
 * - Table must not already be reserved for that day
 * - Concurrency is handled via MongoDB unique indexes
 *
 * @returns 201 with the created reservation
 * @returns 400 if body is invalid
 * @returns 401 if not authenticated
 * @returns 403 if not authorized
 * @returns 409 if there is a booking conflict
 * @returns 500 on internal error
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido" },
      { status: 400 }
    );
  }

  // Validate body shape
  if (
    typeof body !== "object" ||
    body === null ||
    !("tableId" in body) ||
    !("date" in body)
  ) {
    return NextResponse.json(
      { error: "Se requieren los campos 'tableId' y 'date'" },
      { status: 400 }
    );
  }

  const { tableId, date } = body as { tableId: unknown; date: unknown };

  if (typeof tableId !== "string" || !Types.ObjectId.isValid(tableId)) {
    return NextResponse.json(
      { error: "'tableId' debe ser un ID válido" },
      { status: 400 }
    );
  }

  if (typeof date !== "string") {
    return NextResponse.json(
      { error: "'date' debe ser una cadena en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const result = await createReservation(session.user.id, tableId, date);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: HTTP_STATUS[result.code] }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  }
}
