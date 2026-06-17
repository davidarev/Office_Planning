"use client";

import { useState, useCallback } from "react";
import type { TableAvailability } from "@/domain/types";
import { useDateSelection } from "@/context/date-selection.context";
import { FloorPlan } from "./FloorPlan";
import { DeskDetailPanel } from "./DeskDetailPanel";
import { useReserve } from "./use-reserve";
import { useCancelReservation } from "./use-cancel-reservation";

interface FloorPlanClientProps {
  tables: TableAvailability[];
  /** true si el usuario ya tiene una reserva confirmada para el día seleccionado. */
  userHasReservationToday: boolean;
  /** ID del usuario en sesión, usado para determinar si una reserva le pertenece. */
  currentUserId: string;
  /** Callback para que el padre refresque los datos tras una reserva o cancelación exitosa. */
  onReservationCreated?: () => void;
  width?: number;
  height?: number;
}

/**
 * Wrapper cliente para `FloorPlan` que gestiona la selección de mesa y
 * muestra `DeskDetailPanel` al hacer clic en una mesa.
 *
 * Mantiene `selectedTable` en estado local para no introducir estado global.
 * Coordina las acciones de reserva y cancelación entre el panel y la API
 * vía `useReserve` y `useCancelReservation`.
 */
export function FloorPlanClient({
  tables,
  userHasReservationToday,
  currentUserId,
  onReservationCreated,
  width,
  height,
}: FloorPlanClientProps) {
  const [selectedTable, setSelectedTable] = useState<TableAvailability | null>(null);
  const { selectedDay } = useDateSelection();
  const { reserve } = useReserve();
  const { cancelReservation } = useCancelReservation();

  const isOwnReservation = selectedTable?.reservation?.isOwner === true;

  const handleReserve = useCallback(
    async (tableId: string, date: string) => {
      const errorMsg = await reserve(tableId, date);
      if (errorMsg === null) {
        setSelectedTable(null);
        onReservationCreated?.();
      } else {
        throw new Error(errorMsg);
      }
    },
    [reserve, onReservationCreated]
  );

  const handleCancelReservation = useCallback(
    async (reservationId: string) => {
      const errorMsg = await cancelReservation(reservationId);
      if (errorMsg === null) {
        setSelectedTable(null);
        onReservationCreated?.();
      } else {
        throw new Error(errorMsg);
      }
    },
    [cancelReservation, onReservationCreated]
  );

  return (
    <div className="relative">
      <FloorPlan
        tables={tables}
        width={width}
        height={height}
        onDeskClick={setSelectedTable}
      />
      <DeskDetailPanel
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
        selectedDate={selectedDay.dateString}
        userHasReservationToday={userHasReservationToday}
        onReserve={handleReserve}
        isOwnReservation={isOwnReservation}
        onCancelReservation={handleCancelReservation}
      />
    </div>
  );
}
