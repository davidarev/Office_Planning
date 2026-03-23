import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getTableAvailabilityForDate } from "@/services";
import { isValidDateString } from "@/lib/dates";

/**
 * GET /api/availability?date=YYYY-MM-DD
 *
 * Returns the computed availability status for all active tables on a given day.
 * Each table includes its status (green/yellow/red/gray), reservation info,
 * and assigned user info when applicable.
 *
 * @param request - Must include a `date` query parameter in YYYY-MM-DD format
 * @returns 200 with array of TableAvailability objects
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
    const availability = await getTableAvailabilityForDate(date);
    return NextResponse.json(availability);
  } catch {
    return NextResponse.json(
      { error: "Error al calcular la disponibilidad" },
      { status: 500 }
    );
  }
}
