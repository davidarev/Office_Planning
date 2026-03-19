/**
 * Table service — provides table information for API consumers.
 *
 * This layer sits between API routes and the data-access layer.
 * Currently exposes read-only operations. Status computation
 * (green/yellow/red/gray) will be added in a later phase.
 *
 * @module tableService
 */

import { listActiveTables } from "@/lib/db";
import type { ITable, TableType, TablePosition } from "@/domain/types";

/**
 * Public representation of a table (without computed status).
 * Used in the initial read-only API before status computation exists.
 */
export interface TablePublic {
  _id: string;
  label: string;
  type: TableType;
  position: TablePosition;
  assignedTo: string | null;
  isActive: boolean;
}

/**
 * Converts an internal table document to its public representation.
 *
 * @param table - The raw table document from the database
 * @returns A client-safe table object with string IDs
 */
function toPublic(table: ITable): TablePublic {
  return {
    _id: table._id.toString(),
    label: table.label,
    type: table.type,
    position: table.position,
    assignedTo: table.assignedTo?.toString() ?? null,
    isActive: table.isActive,
  };
}

/**
 * Returns all active tables with their basic information.
 * Does not include computed status (that depends on reservations
 * and will be added in the availability phase).
 *
 * @returns Array of active tables in public format, sorted by label
 */
export async function getTablesWithBasicInfo(): Promise<TablePublic[]> {
  const tables = await listActiveTables();
  return tables.map(toPublic);
}
