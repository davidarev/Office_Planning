/**
 * API tests for POST /api/reservations.
 *
 * Tests the HTTP layer for reservation creation:
 * auth, body validation, business rule errors, and success.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { createUser, createTable, createReservation } from "../helpers";
import { mockSession, mockAuthenticated, mockUnauthenticated } from "../helpers/auth-mock";

vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { POST } from "@/app/api/reservations/route";

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/reservations", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(body: string): NextRequest {
  return new NextRequest(new URL("/api/reservations", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/reservations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await POST(makePostRequest({ tableId: "abc", date: "2026-04-01" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 with invalid JSON body", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makeRawRequest("not json"));
    expect(response.status).toBe(400);
  });

  it("returns 400 with empty body", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 400 when missing tableId", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({ date: "2026-04-01" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when missing date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({ tableId: new Types.ObjectId().toString() }));
    expect(response.status).toBe(400);
  });

  it("returns 400 with invalid tableId format", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({ tableId: "not-an-id", date: "2026-04-01" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 with non-string date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: new Types.ObjectId().toString(),
      date: 12345,
    }));
    expect(response.status).toBe(400);
  });

  it("returns 400 with invalid date format", async () => {
    const user = await createUser();
    const table = await createTable();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026/04/01",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when table does not exist", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: new Types.ObjectId().toString(),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(404);
  });

  it("returns 409 when table already reserved", async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    const table = await createTable({ type: "flexible" });
    await createReservation({ userId: user1._id, tableId: table._id, date: "2026-04-01" });

    mockAuthenticated(mockSession({ id: user2._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(409);
  });

  it("returns 409 when user already has reservation that day", async () => {
    const user = await createUser();
    const table1 = await createTable({ type: "flexible" });
    const table2 = await createTable({ type: "flexible" });
    await createReservation({ userId: user._id, tableId: table1._id, date: "2026-04-01" });

    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table2._id.toString(),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(409);
  });

  it("returns 201 on successful reservation", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body._id).toBeDefined();
    expect(body.userId).toBe(user._id.toString());
    expect(body.tableId).toBe(table._id.toString());
    expect(body.date).toBe("2026-04-01");
    expect(body.status).toBe("confirmed");
  });

  it("returns 400 when table is blocked", async () => {
    const user = await createUser();
    const table = await createTable({ type: "blocked" });
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when table is fixed", async () => {
    const user = await createUser();
    const table = await createTable({ type: "fixed" });
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when table is inactive", async () => {
    const user = await createUser();
    const table = await createTable({ isActive: false });
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(400);
  });
});
