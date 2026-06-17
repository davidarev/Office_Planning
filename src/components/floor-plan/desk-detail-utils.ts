import type { TableStatus, TableType } from "@/domain/types";

/**
 * Returns true when the Reserve button should be shown.
 * Condition: mesa libre (green/yellow) y el usuario no tiene ya reserva hoy.
 */
export function shouldShowReserveButton(
  status: TableStatus,
  userHasReservationToday: boolean
): boolean {
  return (status === "green" || status === "yellow") && !userHasReservationToday;
}

/**
 * Returns true when the Cancel button should be shown.
 * Condition: mesa ocupada, tipo no fijo, hay reserva y es propia del usuario.
 */
export function shouldShowCancelButton(
  status: TableStatus,
  type: TableType,
  hasReservation: boolean,
  isOwnReservation: boolean
): boolean {
  return (
    status === "red" &&
    type !== "fixed" &&
    hasReservation &&
    isOwnReservation
  );
}

interface GetDetailMessageParams {
  status: TableStatus;
  type: TableType;
  reservation: { _id: string; userName: string } | null;
  assignedUser: { _id: string; name: string } | null;
  userHasReservationToday: boolean;
  isOwnReservation: boolean;
}

/**
 * Returns the informational message to display in the detail panel,
 * or null if no message applies. Priority order as defined in OP-234.
 */
export function getDetailMessage({
  status,
  type,
  reservation,
  assignedUser,
  userHasReservationToday,
  isOwnReservation,
}: GetDetailMessageParams): string | null {
  if (status === "gray") {
    return "Mesa no disponible";
  }

  if (isOwnReservation) {
    return "Tu reserva para hoy";
  }

  if (status === "red" && reservation !== null && !isOwnReservation) {
    return `Ocupada por ${reservation.userName}`;
  }

  if (status === "red" && type === "fixed" && assignedUser !== null) {
    const name = assignedUser.name.trim();
    return name ? `Mesa asignada a ${name}` : "Mesa asignada";
  }

  if (type === "preferential" && assignedUser !== null) {
    const name = assignedUser.name.trim();
    return name ? `Mesa preferente de ${name}` : "Mesa preferente";
  }

  if (type === "fixed" && assignedUser !== null) {
    const name = assignedUser.name.trim();
    return name ? `Mesa asignada a ${name}` : "Mesa asignada";
  }

  if (
    userHasReservationToday &&
    (status === "green" || status === "yellow")
  ) {
    return "Ya tienes una reserva para hoy";
  }

  return null;
}
