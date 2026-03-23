import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { cancelReservation } from "@/services";
import type { ServiceErrorCode } from "@/domain/types";

/** Maps service error codes to HTTP status codes. */
const HTTP_STATUS: Record<ServiceErrorCode, number> = {
  validation: 400,
  not_found: 404,
  forbidden: 403,
  conflict: 409,
};

/**
 * DELETE /api/reservations/:id
 *
 * Cancels an existing reservation. The authenticated user can cancel
 * their own reservations; admins can cancel any reservation.
 *
 * The reservation is not deleted — its status is set to "cancelled"
 * to preserve booking history.
 *
 * @returns 200 with the cancelled reservation
 * @returns 400 if the ID is invalid
 * @returns 401 if not authenticated
 * @returns 403 if the user is not the owner and not an admin
 * @returns 404 if the reservation does not exist
 * @returns 500 on internal error
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "ID de reserva inválido" },
      { status: 400 }
    );
  }

  try {
    const result = await cancelReservation(
      session.user.id,
      session.user.role,
      id
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: HTTP_STATUS[result.code] }
      );
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { error: "Error al cancelar la reserva" },
      { status: 500 }
    );
  }
}
