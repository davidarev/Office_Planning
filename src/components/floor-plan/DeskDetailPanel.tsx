"use client";

import { useEffect, useRef, useState } from "react";
import type { TableAvailability, TableStatus, TableType } from "@/domain/types";
import { getOccupantName } from "./desk-status";

interface DeskDetailPanelProps {
  table: TableAvailability | null;
  onClose: () => void;
  /** Fecha activa del DateSelector en formato YYYY-MM-DD. */
  selectedDate: string;
  /** true si el usuario ya tiene una reserva confirmada para ese día. */
  userHasReservationToday: boolean;
  /** Callback de reserva — el padre ejecuta la llamada a la API. */
  onReserve: (tableId: string, date: string) => Promise<void>;
}

const typeLabels: Record<TableType, string> = {
  flexible: "Flexible",
  fixed: "Fija",
  preferential: "Preferente",
  blocked: "Bloqueada",
};

const statusLabels: Record<TableStatus, string> = {
  green: "Libre",
  yellow: "Preferente libre",
  red: "Ocupada",
  gray: "Bloqueada",
};

const statusBadgeClasses: Record<TableStatus, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
};

/**
 * Panel lateral deslizante que muestra el detalle de una mesa seleccionada.
 *
 * Aparece cuando `table` no es null y se oculta cuando es null. No tiene
 * lógica de negocio ni realiza fetching — solo renderiza la información
 * recibida por props.
 *
 * @param props.table - Mesa seleccionada, o null si no hay ninguna activa.
 * @param props.onClose - Callback para limpiar la selección en el padre.
 * @param props.selectedDate - Fecha activa en formato YYYY-MM-DD.
 * @param props.userHasReservationToday - true si el usuario ya tiene reserva ese día.
 * @param props.onReserve - Callback que ejecuta la reserva; rechaza con Error en caso de fallo.
 */
export function DeskDetailPanel({
  table,
  onClose,
  selectedDate,
  userHasReservationToday,
  onReserve,
}: DeskDetailPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  // Limpiar error de reserva al cambiar de mesa o fecha
  useEffect(() => {
    setReserveError(null);
  }, [table, selectedDate]);

  // Gestión de foco: al abrirse, enfocar el botón de cierre
  useEffect(() => {
    if (table) {
      closeButtonRef.current?.focus();
    }
  }, [table]);

  // Cierre con tecla Escape
  useEffect(() => {
    if (!table) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [table, onClose]);

  if (!table) return null;

  const occupantName = getOccupantName(table);
  const canReserve =
    (table.status === "green" || table.status === "yellow") &&
    !userHasReservationToday;

  async function handleReserve() {
    if (!table || isReserving) return;
    setIsReserving(true);
    setReserveError(null);
    try {
      await onReserve(table.tableId, selectedDate);
    } catch (err) {
      setReserveError(
        err instanceof Error ? err.message : "Error al realizar la reserva"
      );
    } finally {
      setIsReserving(false);
    }
  }

  return (
    <>
      {/* Overlay semitransparente para móvil */}
      <div
        className="fixed inset-0 z-20 bg-black/20 sm:hidden"
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de mesa ${table.label}`}
        className="fixed right-0 top-0 z-30 flex h-full w-full flex-col bg-white shadow-xl sm:w-80"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{table.label}</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Cerrar panel"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Tipo */}
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Tipo
            </span>
            <p className="mt-1">
              <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-800">
                {typeLabels[table.type]}
              </span>
            </p>
          </div>

          {/* Estado */}
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Estado
            </span>
            <p className="mt-1">
              <span
                className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${statusBadgeClasses[table.status]}`}
              >
                {statusLabels[table.status]}
              </span>
            </p>
          </div>

          {/* Ocupante / asociado */}
          {occupantName ? (
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {table.reservation ? "Ocupante" : "Usuario asignado"}
              </span>
              <p className="mt-1 text-sm text-gray-900">{occupantName}</p>
            </div>
          ) : null}

          {/* Error de reserva */}
          {reserveError ? (
            <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {reserveError}
            </p>
          ) : null}
        </div>

        {/* Acciones */}
        {canReserve ? (
          <div className="border-t border-gray-200 px-4 py-3">
            <button
              type="button"
              onClick={handleReserve}
              disabled={isReserving}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReserving ? "Reservando…" : "Reservar"}
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}
