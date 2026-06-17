"use client";

import { useState, useCallback } from "react";
import type { TableAvailability } from "@/domain/types";
import { useDateSelection } from "@/context/date-selection.context";
import { FloorPlan } from "./FloorPlan";
import { DeskDetailPanel } from "./DeskDetailPanel";

interface FloorPlanClientProps {
  tables: TableAvailability[];
  /** true si el usuario ya tiene una reserva confirmada para el día seleccionado. */
  userHasReservationToday: boolean;
  /** ID del usuario en sesión, usado para determinar si una reserva le pertenece. */
  currentUserId: string;
  /**
   * Callback para ejecutar la reserva — la lógica optimista vive en FloorPlanSection,
   * que implementa este callback y actualiza su estado local antes de la respuesta HTTP.
   */
  onReserve: (tableId: string, date: string) => Promise<void>;
  /**
   * Callback para ejecutar la cancelación — la lógica optimista vive en
   * FloorPlanSection. Recibe los datos de la mesa para poder calcular el
   * estado al que vuelve (green/yellow) y aplicar el override.
   */
  onCancel: (
    reservationId: string,
    tableId: string,
    tableType: TableAvailability["type"],
    date: string,
  ) => Promise<void>;
  /** Callback para que el padre refresque los datos tras una cancelación exitosa. */
  onReservationCreated?: () => void;
  /** true mientras hay una reserva en curso (deshabilita acciones). */
  isReserving?: boolean;
  /** true mientras hay una cancelación en curso (deshabilita acciones). */
  isCancelling?: boolean;
  width?: number;
  height?: number;
}

/**
 * Wrapper cliente para `FloorPlan` que gestiona la selección de mesa y
 * muestra `DeskDetailPanel` al hacer clic en una mesa.
 *
 * Tanto la reserva como la cancelación con actualización optimista viven en
 * FloorPlanSection y se reciben vía `onReserve` / `onCancel`. Este componente
 * solo orquesta la selección de mesa y propaga los estados de carga.
 */
export function FloorPlanClient({
  tables,
  userHasReservationToday,
  currentUserId,
  onReserve,
  onCancel,
  onReservationCreated,
  isReserving = false,
  isCancelling = false,
  width,
  height,
}: FloorPlanClientProps) {
  const [selectedTable, setSelectedTable] = useState<TableAvailability | null>(null);
  const { selectedDay } = useDateSelection();

  const isOwnReservation = selectedTable?.reservation?.isOwner === true;

  const handleCancelReservation = useCallback(
    async (reservationId: string) => {
      if (!selectedTable) return;
      await onCancel(
        reservationId,
        selectedTable.tableId,
        selectedTable.type,
        selectedDay.dateString,
      );
      // On success the parent triggers a refetch; on error onCancel throws and
      // the panel renders the message, so we only reach here on success.
      setSelectedTable(null);
      onReservationCreated?.();
    },
    [onCancel, onReservationCreated, selectedTable, selectedDay.dateString],
  );

  const handleReserve = useCallback(
    async (tableId: string, date: string) => {
      await onReserve(tableId, date);
      // On success the parent (FloorPlanSection) already closed the panel
      // by triggering a refetch; on error it throws, so we don't reach here.
      setSelectedTable(null);
    },
    [onReserve],
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
        isReserving={isReserving}
        isCancelling={isCancelling}
      />
    </div>
  );
}
