/**
 * Test factories for creating domain entities in tests.
 *
 * Each factory provides sensible defaults that can be overridden.
 * Documents are inserted directly into the in-memory MongoDB.
 */

import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import Table from "@/lib/models/table.model";
import Reservation from "@/lib/models/reservation.model";
import { normalizeDate } from "@/lib/dates";
import type { IUser, ITable, IReservation, UserRole, TableType, ReservationStatus } from "@/domain/types";

/* -------------------------------------------------------------------------- */
/*  User factory                                                               */
/* -------------------------------------------------------------------------- */

interface CreateUserOptions {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

let userCounter = 0;

/**
 * Creates and persists a user document with sensible defaults.
 */
export async function createUser(options: CreateUserOptions = {}): Promise<IUser> {
  await connectDB();
  userCounter++;
  const doc = await User.create({
    name: options.name ?? `Test User ${userCounter}`,
    email: options.email ?? `testuser${userCounter}@example.com`,
    role: options.role ?? "user",
    isActive: options.isActive ?? true,
  });
  return doc.toObject() as IUser;
}

/**
 * Creates and persists an admin user.
 */
export async function createAdmin(options: Omit<CreateUserOptions, "role"> = {}): Promise<IUser> {
  return createUser({ ...options, role: "admin" });
}

/* -------------------------------------------------------------------------- */
/*  Table factory                                                              */
/* -------------------------------------------------------------------------- */

interface CreateTableOptions {
  label?: string;
  type?: TableType;
  position?: { x: number; y: number; width: number; height: number; rotation?: number };
  assignedTo?: Types.ObjectId | string;
  isActive?: boolean;
}

let tableCounter = 0;

/**
 * Creates and persists a table document with sensible defaults.
 */
export async function createTable(options: CreateTableOptions = {}): Promise<ITable> {
  await connectDB();
  tableCounter++;
  const doc = await Table.create({
    label: options.label ?? `Mesa ${tableCounter}`,
    type: options.type ?? "flexible",
    position: options.position ?? { x: 0, y: 0, width: 100, height: 60 },
    assignedTo: options.assignedTo ?? null,
    isActive: options.isActive ?? true,
  });
  return doc.toObject() as ITable;
}

/* -------------------------------------------------------------------------- */
/*  Reservation factory                                                        */
/* -------------------------------------------------------------------------- */

interface CreateReservationOptions {
  userId: string | Types.ObjectId;
  tableId: string | Types.ObjectId;
  date: string | Date;
  status?: ReservationStatus;
}

/**
 * Creates and persists a reservation document.
 * Date is normalized to UTC midnight automatically.
 */
export async function createReservation(options: CreateReservationOptions): Promise<IReservation> {
  await connectDB();
  const doc = await Reservation.create({
    userId: options.userId,
    tableId: options.tableId,
    date: normalizeDate(options.date),
    status: options.status ?? "confirmed",
  });
  return doc.toObject() as IReservation;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Generates a valid but non-existent ObjectId.
 * Useful for testing "not found" scenarios.
 */
export function nonExistentId(): string {
  return new Types.ObjectId().toString();
}

/**
 * Resets the internal counters. Called automatically between tests
 * since collections are cleaned in setup.ts.
 */
export function resetCounters(): void {
  userCounter = 0;
  tableCounter = 0;
}
