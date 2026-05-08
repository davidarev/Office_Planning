"use client";

import type { CSSProperties } from "react";
import type { TableAvailability, TableRect } from "@/domain/types";

/** Tamaño mínimo visible de una mesa en píxeles para evitar que desaparezca. */
const MIN_DESK_SIZE_PX = 40;

interface DeskItemProps {
  /** Datos completos de la mesa para el día activo. */
  table: TableAvailability;
  /**
   * Handler opcional disparado al pulsar la mesa (rectángulo principal o
   * extensión esquinada). Si se omite, la mesa no es interactiva.
   */
  onClick?: (table: TableAvailability) => void;
}

/**
 * Construye el `style` inline de un rectángulo (principal o extensión).
 * Devuelve coordenadas y tamaño en píxeles, aplicando un mínimo visual
 * y omitiendo `transform` cuando la rotación es 0.
 */
function buildRectStyle(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}): CSSProperties {
  const style: CSSProperties = {
    left: rect.x,
    top: rect.y,
    width: Math.max(rect.width, MIN_DESK_SIZE_PX),
    height: Math.max(rect.height, MIN_DESK_SIZE_PX),
  };
  if (rect.rotation !== 0) {
    style.transform = `rotate(${rect.rotation}deg)`;
  }
  return style;
}

/**
 * Componente visual de una mesa individual sobre el plano de la oficina.
 *
 * Posiciona el rectángulo principal de forma absoluta dentro del contenedor
 * del `FloorPlan`, derivando `left/top/width/height` de `table.position`.
 * Si la mesa es esquinada (`table.position.cornerExtension` no es null),
 * renderiza un segundo rectángulo solidario que comparte el mismo handler
 * de click. La etiqueta y el indicador de ocupante (OP-224) se muestran
 * solo en el rectángulo principal para evitar duplicidad visual.
 *
 * No contiene lógica de negocio: el cálculo de estado y disponibilidad
 * se realiza aguas arriba (servicios). El color por estado se aplica en
 * OP-223 y el tooltip de ocupante en OP-224; aquí solo se exponen los
 * puntos de extensión (prop `status` accesible vía `table.status`,
 * `reservation`, `assignedUser`).
 *
 * @param props.table - Datos de la mesa con su disponibilidad.
 * @param props.onClick - Handler opcional al pulsar la mesa.
 */
export function DeskItem({ table, onClick }: DeskItemProps) {
  const isInteractive = typeof onClick === "function";
  const handleClick = isInteractive ? () => onClick(table) : undefined;

  const baseClassName = [
    "absolute flex items-center justify-center border border-gray-400 bg-gray-100 text-xs font-medium text-gray-800 select-none",
    isInteractive ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cornerExtension: TableRect | null | undefined =
    table.position.cornerExtension;

  return (
    <>
      <div
        data-testid={`desk-item-${table.label}`}
        className={baseClassName}
        style={buildRectStyle(table.position)}
        onClick={handleClick}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={`Mesa ${table.label}`}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap px-1">
          {table.label}
        </span>
      </div>
      {cornerExtension ? (
        <div
          data-testid={`desk-item-${table.label}-corner`}
          className={baseClassName}
          style={buildRectStyle(cornerExtension)}
          onClick={handleClick}
          role={isInteractive ? "button" : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          aria-hidden
        />
      ) : null}
    </>
  );
}
