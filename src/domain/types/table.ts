import { Types } from "mongoose";

/**
 * Functional types of a desk in the office.
 *
 * - flexible: freely bookable by anyone
 * - fixed: permanently assigned to one person
 * - preferential: habitually associated with a person, but bookable by others
 * - blocked: not available for booking (temporary or permanent)
 */
export type TableType = "flexible" | "fixed" | "preferential" | "blocked";

/**
 * Visual states for desk rendering on the floor plan.
 *
 * - green: available for booking
 * - yellow: preferential desk without a confirmed booking for that day
 * - red: occupied (booked, fixed assignment, etc.)
 * - gray: blocked / unavailable
 */
export type TableStatus = "green" | "yellow" | "red" | "gray";

/**
 * Position and dimensions of a desk on the floor plan.
 * Coordinates and sizes are expressed in abstract units
 * that the front-end maps to pixels or percentages.
 */
export interface TablePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Represents a physical desk in the office.
 *
 * The `assignedTo` field is relevant for fixed and preferential desks:
 * it indicates which user is associated with this desk.
 */
export interface ITable {
  _id: Types.ObjectId;
  label: string;
  type: TableType;
  position: TablePosition;
  assignedTo?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Client-facing representation of a desk,
 * enriched with computed status for a specific day.
 */
export interface TableWithStatus {
  _id: string;
  label: string;
  type: TableType;
  position: TablePosition;
  status: TableStatus;
  assignedTo?: {
    _id: string;
    name: string;
  };
  reservedBy?: {
    _id: string;
    name: string;
  };
  isActive: boolean;
}
