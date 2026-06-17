/**
 * API tests for GET /api/availability?date=YYYY-MM-DD
 *
 * Week endpoint tests are in availability-week.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createUser, createTable, createReservation } from "../helpers";
import { mockSession, mockAuthenticated, mockUnauthenticated } from "../helpers/auth-mock";

vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { GET } from "@/app/api/availability/route";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

/* -------------------------------------------------------------------------- */
/*  GET /api/availability?date=...                                             */
/* -------------------------------------------------------------------------- */

describe("GET /api/availability", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await GET(makeRequest("/api/availability?date=2026-04-01"));
    expect(response.status).toBe(401);
  });

  it("returns 400 without date param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/availability"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 with invalid date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/availability?date=bad-date"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns availability for valid date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "flexible", label: "T-01" });
    await createTable({ type: "blocked", label: "T-02" });

    const response = await GET(makeRequest("/api/availability?date=2026-04-01"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(2);

    const byLabel = new Map(body.map((t: { label: string }) => [t.label, t]));
    expect(byLabel.get("T-01").status).toBe("green");
    expect(byLabel.get("T-02").status).toBe("gray");
  });

  it("returns correct shape matching TableAvailability", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "flexible" });

    const response = await GET(makeRequest("/api/availability?date=2026-04-01"));
    const body = await response.json();

    expect(body[0]).toMatchObject({
      tableId: expect.any(String),
      label: expect.any(String),
      type: expect.any(String),
      status: expect.any(String),
      position: expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }),
    });
    // reservation and assignedUser should exist (even if null)
    expect(body[0]).toHaveProperty("reservation");
    expect(body[0]).toHaveProperty("assignedUser");
  });

  it("reflects reservation in availability", async () => {
    const user = await createUser({ name: "Test User" });
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-01" });

    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/availability?date=2026-04-01"));
    const body = await response.json();

    expect(body[0].status).toBe("red");
    // Verify complete reservation structure — userId removed per AC-4 (OP-161)
    expect(body[0].reservation).toMatchObject({
      _id: reservation._id.toString(),
      userName: "Test User",
    });
  });

  it("preferential table without reservation has status yellow", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "preferential", label: "PREF-01" });

    const response = await GET(makeRequest("/api/availability?date=2026-04-01"));
    expect(response.status).toBe(200);

    const body = await response.json();
    const pref = body.find((t: { label: string }) => t.label === "PREF-01");
    expect(pref).toBeDefined();
    expect(pref.status).toBe("yellow");
  });

  // H-150-18: smoke test Content-Type
  it("returns Content-Type: application/json (smoke)", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/availability?date=2026-04-01"));
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
