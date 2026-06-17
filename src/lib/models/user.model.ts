import mongoose, { Schema, Model } from "mongoose";
import type { IUser } from "@/domain/types";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email format is invalid"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
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

/** H-111-3: explicit unique index declaration (complements unique:true hint in field). */
UserSchema.index({ email: 1 }, { unique: true });

/**
 * Mongoose model for the User entity.
 *
 * Uses a conditional export to prevent model recompilation
 * during hot-reload in development.
 */
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
