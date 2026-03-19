import { Types } from "mongoose";

/**
 * Represents a desk reservation for a specific day.
 *
 * Business rules enforced:
 * - One user can hold at most one reservation per day
 * - One table can have at most one reservation per day
 * - The `date` field stores the calendar day (time portion is always 00:00 UTC)
 */
export interface IReservation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tableId: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Client-facing representation of a reservation.
 */
export interface ReservationPublic {
  _id: string;
  userId: string;
  tableId: string;
  date: string;
  userName?: string;
  tableLabel?: string;
}
