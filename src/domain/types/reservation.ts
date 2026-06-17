import { Types } from "mongoose";

/**
 * Possible states of a reservation.
 * - confirmed: active reservation
 * - cancelled: reservation was cancelled by user or admin
 */
export type ReservationStatus = "confirmed" | "cancelled";

/**
 * Represents a desk reservation for a specific day.
 *
 * Business rules enforced:
 * - One user can hold at most one confirmed reservation per day
 * - One table can have at most one confirmed reservation per day
 * - The `date` field stores the calendar day (time portion is always 00:00 UTC)
 */
export interface IReservation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tableId: Types.ObjectId;
  date: Date;
  status: ReservationStatus;
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
  status: ReservationStatus;
  userName?: string;
  tableLabel?: string;
}
