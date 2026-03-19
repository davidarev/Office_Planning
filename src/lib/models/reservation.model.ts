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
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index: one table can only have one CONFIRMED reservation per day.
 * Uses partialFilterExpression so cancelled reservations don't block new ones.
 * This is the primary concurrency safeguard — even if two requests arrive
 * simultaneously, MongoDB will reject the second insert.
 */
ReservationSchema.index(
  { tableId: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } }
);

/**
 * Compound unique index: one user can only have one CONFIRMED reservation per day.
 * Uses partialFilterExpression so cancelled reservations don't block new ones.
 */
ReservationSchema.index(
  { userId: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } }
);

/** Index for querying reservations by date (common access pattern). */
ReservationSchema.index({ date: 1 });

/**
 * Mongoose model for the Reservation entity.
 */
const Reservation: Model<IReservation> =
  mongoose.models.Reservation ||
  mongoose.model<IReservation>("Reservation", ReservationSchema);

export default Reservation;
