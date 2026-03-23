/**
 * API tests for reservation read endpoints.
 *
 * - GET /api/reservations?date=YYYY-MM-DD
 * - GET /api/reservations/week?start=...&end=...
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createUser, createTable, createReservation } from "../helpers";
import { mockSession, mockAuthenticated, mockUnauthenticated } from "../helpers/auth-mock";

vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { GET } from "@/app/api/reservations/route";
import { GET as GET_WEEK } from "@/app/api/reservations/week/route";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

/* -------------------------------------------------------------------------- */
/*  GET /api/reservations?date=...                                             */
/* -------------------------------------------------------------------------- */

describe("GET /api/reservations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await GET(makeRequest("/api/reservations?date=2026-04-01"));
    expect(response.status).toBe(401);
  });

  it("returns 400 without date param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/reservations"));
    expect(response.status).toBe(400);
  });

  it("returns 400 with invalid date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/reservations?date=invalid"));
    expect(response.status).toBe(400);
  });

  it("returns 400 with Feb 30", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/reservations?date=2026-02-30"));
    expect(response.status).toBe(400);
  });

  it("returns reservations for valid date", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-01" });

    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/reservations?date=2026-04-01"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].date).toBe("2026-04-01");
    expect(body[0].status).toBe("confirmed");
  });

  it("returns empty array for date with no reservations", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET(makeRequest("/api/reservations?date=2026-04-01"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /api/reservations/week?start=...&end=...                               */
/* -------------------------------------------------------------------------- */

describe("GET /api/reservations/week", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await GET_WEEK(
      makeRequest("/api/reservations/week?start=2026-04-01&end=2026-04-05")
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 without start param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/reservations/week?end=2026-04-05")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 without end param", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/reservations/week?start=2026-04-01")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 with invalid start date", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/reservations/week?start=bad&end=2026-04-05")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when start > end", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/reservations/week?start=2026-04-10&end=2026-04-05")
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when range exceeds 14 days", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/reservations/week?start=2026-04-01&end=2026-04-30")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("14");
  });

  it("returns reservations for valid range", async () => {
    const user = await createUser();
    const table = await createTable();
    await createReservation({ userId: user._id, tableId: table._id, date: "2026-04-01" });

    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_WEEK(
      makeRequest("/api/reservations/week?start=2026-04-01&end=2026-04-05")
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(1);
  });
});
