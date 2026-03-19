import mongoose, { Schema, Model } from "mongoose";
import type { IReservation } from "@/domain/types";

const ReservationSchema = new Schema<IReservation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index: one table can only have one reservation per day.
 * This is the primary concurrency safeguard — even if two requests arrive
 * simultaneously, MongoDB will reject the second insert.
 */
ReservationSchema.index({ tableId: 1, date: 1 }, { unique: true });

/**
 * Compound unique index: one user can only have one reservation per day.
 * Prevents a user from booking two desks on the same day.
 */
ReservationSchema.index({ userId: 1, date: 1 }, { unique: true });

/**
 * Mongoose model for the Reservation entity.
 */
const Reservation: Model<IReservation> =
  mongoose.models.Reservation ||
  mongoose.model<IReservation>("Reservation", ReservationSchema);

export default Reservation;
