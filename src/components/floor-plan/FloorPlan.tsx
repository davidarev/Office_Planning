"use client";

import { useDateSelection } from "@/context/date-selection.context";
import type { TableAvailability } from "@/domain/types";

/** Ancho por defecto del lienzo del plano, en píxeles. */
export const DEFAULT_FLOOR_PLAN_WIDTH = 900;
/** Alto por defecto del lienzo del plano, en píxeles. */
export const DEFAULT_FLOOR_PLAN_HEIGHT = 600;

interface FloorPlanProps {
  /** Mesas a renderizar con su disponibilidad para el día activo. */
  tables: TableAvailability[];
  /** Ancho del lienzo en píxeles. Valores ≤ 0 caen al default. */
  width?: number;
  /** Alto del lienzo en píxeles. Valores ≤ 0 caen al default. */
  height?: number;
}

/**
 * Contenedor raíz del plano de la oficina.
 *
 * Define el lienzo (canvas lógico) sobre el que se posicionan las mesas
 * en coordenadas absolutas. No realiza fetching de datos: recibe el array
 * `tables` ya resuelto desde el nivel superior.
 *
 * Consume `useDateSelection()` para que el día seleccionado esté disponible
 * en el árbol; el render real de cada mesa lo asume `DeskItem` (OP-222).
 *
 * En este ticket renderiza un placeholder mínimo por mesa para validar el
 * posicionamiento absoluto; será sustituido por `DeskItem` en OP-222.
 *
 * @param props - Mesas y dimensiones opcionales del lienzo.
 */
export function FloorPlan({
  tables,
  width,
  height,
}: FloorPlanProps) {
  // Suscribe al contexto de fecha para que el árbol disponga de selectedDay,
  // aunque este componente aún no lo use directamente (preparación para OP-222+).
  useDateSelection();

  const safeWidth =
    typeof width === "number" && width > 0 ? width : DEFAULT_FLOOR_PLAN_WIDTH;
  const safeHeight =
    typeof height === "number" && height > 0
      ? height
      : DEFAULT_FLOOR_PLAN_HEIGHT;

  if (tables.length === 0) {
    return (
      <div
        className="relative mx-auto flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500"
        style={{ width: safeWidth, height: safeHeight }}
        role="status"
      >
        No hay mesas configuradas
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto overflow-auto rounded border border-gray-200 bg-white"
      style={{ width: safeWidth, height: safeHeight }}
      aria-label="Plano de la oficina"
    >
      {tables.map((table) => (
        <div
          key={table.tableId}
          data-testid={`floor-plan-desk-${table.label}`}
          className="absolute"
          style={{
            left: table.position.x,
            top: table.position.y,
            width: table.position.width,
            height: table.position.height,
          }}
        />
      ))}
    </div>
  );
}
