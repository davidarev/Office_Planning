"use client";

import { useState, useCallback } from "react";
import type { TableAvailability } from "@/domain/types";
import { useDateSelection } from "@/context/date-selection.context";
import { FloorPlan } from "./FloorPlan";
import { DeskDetailPanel } from "./DeskDetailPanel";
import { useReserve } from "./use-reserve";

interface FloorPlanClientProps {
  tables: TableAvailability[];
  /** true si el usuario ya tiene una reserva confirmada para el día seleccionado. */
  userHasReservationToday: boolean;
  /** Callback para que el padre refresque los datos tras una reserva exitosa. */
  onReservationCreated?: () => void;
  width?: number;
  height?: number;
}

/**
 * Wrapper cliente para `FloorPlan` que gestiona la selección de mesa y
 * muestra `DeskDetailPanel` al hacer clic en una mesa.
 *
 * Mantiene `selectedTable` en estado local para no introducir estado global.
 * Coordina la acción de reserva entre el panel y la API vía `useReserve`.
 */
export function FloorPlanClient({
  tables,
  userHasReservationToday,
  onReservationCreated,
  width,
  height,
}: FloorPlanClientProps) {
  const [selectedTable, setSelectedTable] = useState<TableAvailability | null>(null);
  const { selectedDay } = useDateSelection();
  const { reserve } = useReserve();

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
      />
    </div>
  );
}
