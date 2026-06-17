/**
 * API tests for GET /api/availability/week?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Covers authentication, parameter validation, range limits, and response shape.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createUser, createTable, createReservation } from "../helpers";
import { mockSession, mockAuthenticated, mockUnauthenticated } from "../helpers/auth-mock";

vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { GET as GET_WEEK } from "@/app/api/availability/week/route";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/availability/week", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* ---- authentication ---- */

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01&end=2026-04-05")
    );
    expect(response.status).toBe(401);
  });

  /* ---- parameter validation ---- */

  it("returns 400 without start param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?end=2026-04-05")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 without end param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 with invalid start date format", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=bad&end=2026-04-05")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when start is after end", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-10&end=2026-04-05")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when range exceeds MAX_RANGE_DAYS (14)", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01&end=2026-04-30")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("14");
  });

  /* ---- successful responses ---- */

  it("returns a map with one entry per day in range (5-day work week)", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "flexible" });

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-06&end=2026-04-10")
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Object.keys(body)).toEqual([
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-09",
      "2026-04-10",
    ]);
    // AC-6: one entry per day
    expect(Object.keys(body)).toHaveLength(5);
  });

  it("each day entry contains TableAvailability objects with correct shape", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "flexible" });

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-06&end=2026-04-08")
    );
    const body = await response.json();

    const dayEntry = body["2026-04-06"];
    expect(dayEntry).toHaveLength(1);
    // AC-5: verify TableAvailability shape
    expect(dayEntry[0]).toMatchObject({
      tableId: expect.any(String),
      label: expect.any(String),
      type: expect.any(String),
      status: expect.any(String),
      position: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    });
    expect(dayEntry[0]).toHaveProperty("reservation");
    expect(dayEntry[0]).toHaveProperty("assignedUser");
  });

  it("reflects reservations correctly across multiple days", async () => {
    const user = await createUser({ name: "Week User" });
    const table = await createTable({ type: "flexible" });
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-07" });

    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-06&end=2026-04-08")
    );
    const body = await response.json();

    expect(body["2026-04-06"][0].status).toBe("green");
    expect(body["2026-04-07"][0].status).toBe("red");
    expect(body["2026-04-08"][0].status).toBe("green");
  });

  it("allows exactly MAX_RANGE_DAYS (14-day range)", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ type: "flexible" });

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-01&end=2026-04-15")
    );
    expect(response.status).toBe(200);
    expect(Object.keys(await response.json())).toHaveLength(15);
  });

  it("returns empty arrays per day when no tables exist", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/availability/week?start=2026-04-06&end=2026-04-08")
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Object.keys(body)).toHaveLength(3);
    for (const day of Object.values(body) as unknown[]) {
      expect(day).toEqual([]);
    }
  });
});
