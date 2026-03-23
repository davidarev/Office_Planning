import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getTableAvailabilityForRange } from "@/services";
import { isValidDateString, normalizeDate } from "@/lib/dates";

/**
 * Maximum allowed range in days for availability queries.
 */
const MAX_RANGE_DAYS = 14;

/**
 * GET /api/availability/week?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns the computed availability status for all active tables
 * across an inclusive date range. The response is a map keyed by
 * date string (YYYY-MM-DD), where each value is an array of
 * TableAvailability objects.
 *
 * @param request - Must include `start` and `end` query parameters
 * @returns 200 with Record<string, TableAvailability[]>
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
    const availability = await getTableAvailabilityForRange(start, end);
    return NextResponse.json(availability);
  } catch {
    return NextResponse.json(
      { error: "Error al calcular la disponibilidad" },
      { status: 500 }
    );
  }
}
