"use client";

import { useState } from "react";

interface UseReserveResult {
  isLoading: boolean;
  /**
   * Ejecuta POST /api/reservations.
   * @returns null en caso de éxito, o el mensaje de error en caso de fallo.
   */
  reserve: (tableId: string, date: string) => Promise<string | null>;
}

/**
 * Encapsula la llamada a POST /api/reservations.
 *
 * Devuelve `null` si la reserva se creó con éxito, o el mensaje de error
 * si la petición falló. El manejo del estado de éxito (refrescar datos,
 * cerrar panel) es responsabilidad del componente padre.
 */
export function useReserve(): UseReserveResult {
  const [isLoading, setIsLoading] = useState(false);

  async function reserve(tableId: string, date: string): Promise<string | null> {
    setIsLoading(true);

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
      return (data as { error?: string }).error ?? "Error al realizar la reserva";
    } catch {
      return "Error de conexión. Inténtalo de nuevo.";
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, reserve };
}
