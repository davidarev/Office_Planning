"use client";

import { useEffect, useRef, useState } from "react";

/** Opciones para operaciones de reserva con soporte de actualización optimista. */
interface ReserveOptions {
  /** Invocado antes de la llamada HTTP para aplicar el cambio optimista. */
  onOptimisticUpdate?: () => void;
  /** Invocado si el backend rechaza, para revertir el cambio optimista. */
  onRollback?: () => void;
}

interface UseReservationResult {
  isReserving: boolean;
  isCancelling: boolean;
  /**
   * Llama a POST /api/reservations con `{ tableId, date }`.
   * @returns null en éxito, mensaje de error en fallo.
   */
  reserve: (tableId: string, date: string, options?: ReserveOptions) => Promise<string | null>;
  /**
   * Llama a DELETE /api/reservations/:id.
   * @returns null en éxito, mensaje de error en fallo.
   */
  cancelReservation: (reservationId: string, options?: ReserveOptions) => Promise<string | null>;
}

/**
 * Hook unificado para crear y cancelar reservas.
 *
 * Expone `reserve` y `cancelReservation` bajo una interfaz coherente,
 * preparada para recibir lógica de actualización optimista (OP-252/OP-253).
 * Los callbacks `onOptimisticUpdate` y `onRollback` son opcionales en esta fase.
 */
export function useReservation(): UseReservationResult {
  const [isReserving, setIsReserving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function reserve(
    tableId: string,
    date: string,
    options?: ReserveOptions,
  ): Promise<string | null> {
    setIsReserving(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, date }),
      });

      if (response.ok) {
        return null;
      }

      const data = await response.json().catch(() => ({}));
      const errorMessage = (data as { error?: string }).error ?? "Error al realizar la reserva";
      options?.onRollback?.();
      return errorMessage;
    } catch {
      options?.onRollback?.();
      return "Error de conexión. Inténtalo de nuevo.";
    } finally {
      if (isMountedRef.current) {
        setIsReserving(false);
      }
    }
  }

  async function cancelReservation(
    reservationId: string,
    options?: ReserveOptions,
  ): Promise<string | null> {
    setIsCancelling(true);

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        return null;
      }

      const data = await response.json().catch(() => ({}));
      const errorMessage = (data as { error?: string }).error ?? "Error al cancelar la reserva";
      options?.onRollback?.();
      return errorMessage;
    } catch {
      options?.onRollback?.();
      return "Error de conexión. Inténtalo de nuevo.";
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false);
      }
    }
  }

  return { isReserving, isCancelling, reserve, cancelReservation };
}
