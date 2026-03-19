/**
 * Data-access layer for the User entity.
 *
 * All functions in this module perform direct database queries.
 * They do NOT contain business logic — that belongs in the service layer.
 *
 * Every function ensures a database connection before querying.
 *
 * @module userRepository
 */

import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";
import type { IUser } from "@/domain/types";

/**
 * Finds a user by their email address.
 *
 * @param email - The email to search for (case-insensitive)
 * @returns The user document, or null if not found
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ email: email.toLowerCase() }).lean<IUser>();
}

/**
 * Finds a user by their database ID.
 *
 * @param id - The MongoDB ObjectId as a string
 * @returns The user document, or null if not found
 */
export async function getUserById(id: string): Promise<IUser | null> {
  await connectDB();
  return User.findById(id).lean<IUser>();
}

/**
 * Returns all active users, sorted alphabetically by name.
 *
 * @returns Array of active user documents
 */
export async function listActiveUsers(): Promise<IUser[]> {
  await connectDB();
  return User.find({ isActive: true }).sort({ name: 1 }).lean<IUser[]>();
}
