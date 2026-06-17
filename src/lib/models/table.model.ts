import mongoose, { Schema, Model } from "mongoose";
import type { ITable } from "@/domain/types";

/**
 * Sub-schema base de un rectángulo posicionado.
 * Reutilizado tanto por la posición principal como por cornerExtension
 * (mesas esquinadas en L).
 */
const RectSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    rotation: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Sub-schema para la posición de la mesa en el plano.
 * Incluye `cornerExtension` opcional: un segundo rectángulo solidario al
 * principal para representar mesas en L (MESA 4 y MESA 6 en la disposición
 * real de la oficina). Default `null` cuando la mesa es un rectángulo simple.
 */
const PositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    rotation: { type: Number, default: 0 },
    cornerExtension: { type: RectSchema, default: null },
  },
  { _id: false }
);

const TableSchema = new Schema<ITable>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
