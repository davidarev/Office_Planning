import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getReservationsForDay } from "@/services";
import { isValidDateString } from "@/lib/dates";

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
