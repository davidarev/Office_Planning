import { Types } from "mongoose";

/**
 * User roles within the application.
 * - user: standard team member who can view and book desks
 * - admin: can manage users, tables, and reservations
 */
export type UserRole = "user" | "admin";

/**
 * Represents a team member in the system.
 *
 * Users are pre-created by an admin — there is no self-registration.
 * Only active users can log in and make reservations.
 */
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subset of user data safe to expose to the client.
 * Omits internal fields like timestamps.
 */
export interface UserPublic {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}
