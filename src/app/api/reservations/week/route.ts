import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getReservationsForRange } from "@/services";
import { isValidDateString, normalizeDate } from "@/lib/dates";

/**
 * Maximum allowed range in days for week queries.
 * Two business weeks (14 calendar days) is more than enough.
 */
const MAX_RANGE_DAYS = 14;

/**
 * GET /api/reservations/week?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns all confirmed reservations within an inclusive date range.
 * Requires an authenticated session.
 *
 * @param request - Must include `start` and `end` query parameters in YYYY-MM-DD format
 * @returns 200 with array of reservations in the range
 * @returns 400 if parameters are missing, invalid, or range is too large
 * @returns 401 if not authenticated
 * @returns 500 on internal error
 */
export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (!start || !isValidDateString(start)) {
    return NextResponse.json(
      { error: "Parámetro 'start' requerido en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  if (!end || !isValidDateString(end)) {
    return NextResponse.json(
      { error: "Parámetro 'end' requerido en formato YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);

  if (startDate > endDate) {
    return NextResponse.json(
      { error: "'start' debe ser anterior o igual a 'end'" },
      { status: 400 }
    );
  }

  const diffDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `El rango máximo permitido es de ${MAX_RANGE_DAYS} días` },
      { status: 400 }
    );
  }

  try {
    const reservations = await getReservationsForRange(start, end);
    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las reservas" },
      { status: 500 }
    );
  }
}
