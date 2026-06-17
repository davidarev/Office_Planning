"use client";

import { useState } from "react";

interface UseCancelReservationResult {
  isLoading: boolean;
  /**
   * Ejecuta DELETE /api/reservations/:id.
   * @returns null en caso de éxito, o el mensaje de error en caso de fallo.
   */
  cancelReservation: (reservationId: string) => Promise<string | null>;
}

/**
 * Encapsula la llamada a DELETE /api/reservations/:id.
 *
 * Devuelve `null` si la cancelación fue exitosa, o el mensaje de error
 * si la petición falló. El manejo del estado de éxito (refrescar datos,
 * cerrar panel) es responsabilidad del componente padre.
 */
export function useCancelReservation(): UseCancelReservationResult {
  const [isLoading, setIsLoading] = useState(false);

  async function cancelReservation(reservationId: string): Promise<string | null> {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        return null;
      }

      const data = await response.json().catch(() => ({}));
      return (data as { error?: string }).error ?? "Error al cancelar la reserva";
    } catch {
      return "Error de conexión. Inténtalo de nuevo.";
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, cancelReservation };
}
