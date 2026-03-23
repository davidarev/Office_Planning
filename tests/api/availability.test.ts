/**
 * API tests for availability endpoints.
 *
 * - GET /api/availability?date=YYYY-MM-DD
 * - GET /api/availability/week?start=...&end=...
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createUser, createTable, createReservation } from "../helpers";
import { mockSession, mockAuthenticated, mockUnauthenticated } from "../helpers/auth-mock";

vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { GET } from "@/app/api/availability/route";
import { GET as GET_WEEK } from "@/app/api/availability/week/route";

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
  });

  it("returns 400 with invalid date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/availability?date=bad-date"));
    expect(response.status).toBe(400);
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
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-01" });

    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/availability?date=2026-04-01"));
    const body = await response.json();

    expect(body[0].status).toBe("red");
    expect(body[0].reservation).toBeDefined();
    expect(body[0].reservation.userName).toBe("Test User");
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /api/availability/week?start=...&end=...                               */
/* -------------------------------------------------------------------------- */

describe("GET /api/availability/week", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01&end=2026-04-05")
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 without start param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?end=2026-04-05")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 without end param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 with invalid start date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=bad&end=2026-04-05")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when start > end", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-10&end=2026-04-05")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when range exceeds 14 days", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01&end=2026-04-30")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("14");
  });

  it("returns availability map for valid range", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "flexible" });

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-06&end=2026-04-08")
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Object.keys(body)).toEqual(["2026-04-06", "2026-04-07", "2026-04-08"]);
    expect(body["2026-04-06"]).toHaveLength(1);
  });

  it("allows exactly 14-day range", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "flexible" });

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01&end=2026-04-15")
    );
    expect(response.status).toBe(200);
  });
});
