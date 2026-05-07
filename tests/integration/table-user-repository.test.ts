/**
 * Integration tests for table and user repositories.
 *
 * Verifies the data-access layer returns correct results
 * from an in-memory MongoDB instance.
 */

import { describe, it, expect } from "vitest";
import {
  listActiveTables,
  getTableById,
  getUserByEmail,
  getUserById,
  listActiveUsers,
} from "@/lib/db";
import { createUser, createTable, nonExistentId } from "../helpers";

/* -------------------------------------------------------------------------- */
/*  Table repository                                                           */
/* -------------------------------------------------------------------------- */

describe("listActiveTables", () => {
  it("returns only active tables", async () => {
    await createTable({ label: "A-01", isActive: true });
    await createTable({ label: "A-02", isActive: false });
    await createTable({ label: "A-03", isActive: true });

    const tables = await listActiveTables();
    expect(tables).toHaveLength(2);
    const labels = tables.map((t) => t.label);
    expect(labels).toContain("A-01");
    expect(labels).toContain("A-03");
    expect(labels).not.toContain("A-02");
  });

  it("returns tables sorted by label", async () => {
    await createTable({ label: "C-01" });
    await createTable({ label: "A-01" });
    await createTable({ label: "B-01" });

    const tables = await listActiveTables();
    expect(tables.map((t) => t.label)).toEqual(["A-01", "B-01", "C-01"]);
  });

  it("returns empty array when no active tables exist", async () => {
    await createTable({ isActive: false });
    const tables = await listActiveTables();
    expect(tables).toEqual([]);
  });

  it("includes table metadata", async () => {
    await createTable({
      label: "A-01",
      type: "preferential",
      position: { x: 10, y: 20, width: 100, height: 60, rotation: 45 },
    });

    const tables = await listActiveTables();
    expect(tables[0].type).toBe("preferential");
    expect(tables[0].position).toMatchObject({
      x: 10,
      y: 20,
      width: 100,
      height: 60,
      rotation: 45,
    });
  });
});

describe("getTableById", () => {
  it("returns the table by id", async () => {
    const table = await createTable({ label: "A-01" });
    const found = await getTableById(table._id.toString());
    expect(found).not.toBeNull();
    expect(found!.label).toBe("A-01");
  });

  it("returns inactive tables too", async () => {
    const table = await createTable({ isActive: false });
    const found = await getTableById(table._id.toString());
    expect(found).not.toBeNull();
    expect(found!.isActive).toBe(false);
  });

  it("returns null for non-existent id", async () => {
    const found = await getTableById(nonExistentId());
    expect(found).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/*  User repository                                                            */
/* -------------------------------------------------------------------------- */

describe("getUserByEmail", () => {
  it("finds user by exact email", async () => {
    await createUser({ email: "test@company.com", name: "Test" });
    const found = await getUserByEmail("test@company.com");
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test");
  });

  it("is case-insensitive", async () => {
    await createUser({ email: "Test@Company.com" });
    const found = await getUserByEmail("test@company.com");
    expect(found).not.toBeNull();
  });

  it("returns null for non-existent email", async () => {
    const found = await getUserByEmail("nobody@company.com");
    expect(found).toBeNull();
  });
});

describe("getUserById", () => {
  it("finds user by id", async () => {
    const user = await createUser({ name: "Ana" });
    const found = await getUserById(user._id.toString());
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Ana");
  });

  it("returns null for non-existent id", async () => {
    const found = await getUserById(nonExistentId());
    expect(found).toBeNull();
  });
});

describe("listActiveUsers", () => {
  it("returns only active users", async () => {
    await createUser({ name: "Active", isActive: true });
    await createUser({ name: "Inactive", isActive: false });

    const users = await listActiveUsers();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Active");
  });

  it("returns users sorted by name", async () => {
    await createUser({ name: "Carlos" });
    await createUser({ name: "Ana" });
    await createUser({ name: "Beatriz" });

    const users = await listActiveUsers();
    expect(users.map((u) => u.name)).toEqual(["Ana", "Beatriz", "Carlos"]);
  });

  it("returns empty array when no active users exist", async () => {
    const users = await listActiveUsers();
    expect(users).toEqual([]);
  });
});
