import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getTablesWithBasicInfo } from "@/services";

/**
 * GET /api/tables
 *
 * Returns all active tables with their basic information.
 * Requires an authenticated session.
 *
 * @returns 200 with array of active tables
 * @returns 401 if not authenticated
 * @returns 500 on internal error
 */
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const tables = await getTablesWithBasicInfo();
    return NextResponse.json(tables);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener las mesas" },
      { status: 500 }
    );
  }
}
