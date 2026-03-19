/**
 * Data-access layer for the Table (desk) entity.
 *
 * All functions in this module perform direct database queries.
 * They do NOT contain business logic — that belongs in the service layer.
 *
 * @module tableRepository
 */

import { connectDB } from "@/lib/mongodb";
import { Table } from "@/lib/models";
import type { ITable } from "@/domain/types";

/**
 * Returns all active tables, sorted by label.
 *
 * @returns Array of active table documents
 */
export async function listActiveTables(): Promise<ITable[]> {
  await connectDB();
  return Table.find({ isActive: true }).sort({ label: 1 }).lean<ITable[]>();
}

/**
 * Finds a table by its database ID.
 *
 * @param id - The MongoDB ObjectId as a string
 * @returns The table document, or null if not found
 */
export async function getTableById(id: string): Promise<ITable | null> {
  await connectDB();
  return Table.findById(id).lean<ITable>();
}
