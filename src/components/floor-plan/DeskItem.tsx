"use client";

import type { TableAvailability, TableRect } from "@/domain/types";
import { getStatusColorClasses, getOccupantName } from "./desk-status";
import "./desk-item.css";

/** Minimum visible desk size in pixels to avoid disappearing elements. */
const MIN_DESK_SIZE_PX = 40;

interface DeskItemProps {
  /** Full desk data for the active day. */
  table: TableAvailability;
  /**
   * Optional handler fired when the desk is clicked (main rect or corner
   * extension). If omitted, the desk is non-interactive.
   */
  onClick?: (table: TableAvailability) => void;
}

/**
 * Builds the CSS custom-property object for a rectangle (main or extension).
 * Properties are consumed by `.desk-item` in `desk-item.css`, keeping the
 * `style` attribute free of direct presentation values (no-inline-styles).
 */
function buildRectVars(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}): React.CSSProperties {
  return {
    "--desk-x": `${rect.x}px`,
    "--desk-y": `${rect.y}px`,
    "--desk-w": `${Math.max(rect.width, MIN_DESK_SIZE_PX)}px`,
    "--desk-h": `${Math.max(rect.height, MIN_DESK_SIZE_PX)}px`,
    "--desk-rotate": rect.rotation !== 0 ? `${rect.rotation}deg` : "0deg",
  } as React.CSSProperties;
}

/**
 * Visual component for a single desk on the office floor plan.
 *
 * Positions the main rectangle absolutely inside the `FloorPlan` container,
 * deriving coordinates from `table.position` via CSS custom properties.
 * For corner desks (`table.position.cornerExtension` non-null), renders a
 * second rectangle sharing the same click handler. Label and occupant
 * indicator are shown only on the main rectangle.
 *
 * @param props.table - Desk data with availability for the active day.
 * @param props.onClick - Optional handler when the desk is clicked.
 */
export function DeskItem({ table, onClick }: DeskItemProps) {
  const isInteractive = typeof onClick === "function";
  const handleClick = isInteractive ? () => onClick(table) : undefined;

  const statusClasses = getStatusColorClasses(table.status);
  const sharedClasses = [
    "desk-item flex flex-col items-center justify-center border border-gray-400 text-xs font-medium select-none",
    statusClasses,
    isInteractive ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showOccupant = table.status === "red" || table.status === "yellow";
  const occupantName = showOccupant ? getOccupantName(table) : null;

  const cornerExtension: TableRect | null | undefined =
    table.position.cornerExtension;

  const MainEl = isInteractive ? "button" : "div";
  const CornerEl = isInteractive ? "button" : "div";

  return (
    <>
      <MainEl
        data-testid={`desk-item-${table.label}`}
        className={sharedClasses}
        style={buildRectVars(table.position)}
        onClick={handleClick}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={`Mesa ${table.label}`}
        title={occupantName ?? undefined}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap px-1 w-full text-center">
          {table.label}
        </span>
        {occupantName ? (
          <span
            data-testid={`desk-item-${table.label}-occupant`}
            className="overflow-hidden text-ellipsis whitespace-nowrap px-1 w-full text-center text-[10px] opacity-75 leading-none"
          >
            {occupantName}
          </span>
        ) : null}
      </MainEl>
      {cornerExtension ? (
        <CornerEl
          data-testid={`desk-item-${table.label}-corner`}
          className={sharedClasses}
          style={buildRectVars(cornerExtension)}
          onClick={handleClick}
          tabIndex={isInteractive ? 0 : undefined}
          aria-hidden
        />
      ) : null}
    </>
  );
}
