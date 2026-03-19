import mongoose, { Schema, Model } from "mongoose";
import type { ITable } from "@/domain/types";

/**
 * Sub-schema for desk position on the floor plan.
 * Stored as a nested object (not a separate collection).
 */
const PositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    rotation: { type: Number, default: 0 },
  },
  { _id: false }
);

const TableSchema = new Schema<ITable>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["flexible", "fixed", "preferential", "blocked"],
      default: "flexible",
    },
    position: {
      type: PositionSchema,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/** Index for filtering active tables (most common query pattern). */
TableSchema.index({ isActive: 1 });

/**
 * Mongoose model for the Table (desk) entity.
 */
const Table: Model<ITable> =
  mongoose.models.Table || mongoose.model<ITable>("Table", TableSchema);

export default Table;
