/**
 * Authentication, authorization, and security edge case tests.
 *
 * Verifies that:
 * - All endpoints require authentication
 * - Authorization rules are enforced correctly
 * - Invalid/malicious inputs are handled safely
 * - Error responses don't leak internal details
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import {
  createUser,
  createAdmin,
  createTable,
  createReservation,
  nonExistentId,
} from "../helpers";
import {
  mockSession,
  mockAuthenticated,
  mockUnauthenticated,
} from "../helpers/auth-mock";

vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { GET as GET_TABLES } from "@/app/api/tables/route";
import { GET as GET_RESERVATIONS, POST } from "@/app/api/reservations/route";
import { DELETE } from "@/app/api/reservations/[id]/route";
import { GET as GET_AVAILABILITY } from "@/app/api/availability/route";
import { GET as GET_AVAILABILITY_WEEK } from "@/app/api/availability/week/route";
import { GET as GET_RESERVATIONS_WEEK } from "@/app/api/reservations/week/route";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/reservations", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string) {
  return new Request(`http://localhost:3000/api/reservations/${id}`, { method: "DELETE" });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

/* -------------------------------------------------------------------------- */
/*  All endpoints require auth (401)                                           */
/* -------------------------------------------------------------------------- */

describe("all endpoints return 401 without session", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUnauthenticated();
  });

  it("GET /api/tables → 401", async () => {
    expect((await GET_TABLES()).status).toBe(401);
  });

  it("GET /api/reservations → 401", async () => {
    expect((await GET_RESERVATIONS(makeRequest("/api/reservations?date=2026-04-01"))).status).toBe(401);
  });

  it("GET /api/reservations/week → 401", async () => {
    expect(
      (await GET_RESERVATIONS_WEEK(makeRequest("/api/reservations/week?start=2026-04-01&end=2026-04-05"))).status
    ).toBe(401);
  });

  it("POST /api/reservations → 401", async () => {
    expect(
      (await POST(makePostRequest({ tableId: nonExistentId(), date: "2026-04-01" }))).status
    ).toBe(401);
  });

  it("DELETE /api/reservations/:id → 401", async () => {
    expect(
      (await DELETE(makeDeleteRequest(nonExistentId()), makeParams(nonExistentId()))).status
    ).toBe(401);
  });

  it("GET /api/availability → 401", async () => {
    expect(
      (await GET_AVAILABILITY(makeRequest("/api/availability?date=2026-04-01"))).status
    ).toBe(401);
  });

  it("GET /api/availability/week → 401", async () => {
    expect(
      (await GET_AVAILABILITY_WEEK(makeRequest("/api/availability/week?start=2026-04-01&end=2026-04-05"))).status
    ).toBe(401);
  });
});

/* -------------------------------------------------------------------------- */
/*  Authorization: cancellation permissions                                    */
/* -------------------------------------------------------------------------- */

describe("cancellation authorization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("user cannot cancel another user's reservation", async () => {
    const owner = await createUser();
    const attacker = await createUser();
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({
      userId: owner._id,
      tableId: table._id,
      date: "2026-04-01",
    });
    const resId = reservation._id.toString();

    mockAuthenticated(mockSession({ id: attacker._id.toString(), role: "user" }));

    const response = await DELETE(makeDeleteRequest(resId), makeParams(resId));
    expect(response.status).toBe(403);

    // Verify the error doesn't leak who owns the reservation
    const body = await response.json();
    expect(body.error).not.toContain(owner._id.toString());
  });

  it("admin can cancel any user's reservation", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
    });
    const resId = reservation._id.toString();

    mockAuthenticated(mockSession({ id: admin._id.toString(), role: "admin" }));

    const response = await DELETE(makeDeleteRequest(resId), makeParams(resId));
    expect(response.status).toBe(200);
  });
});

/* -------------------------------------------------------------------------- */
/*  Edge cases: invalid inputs                                                 */
/* -------------------------------------------------------------------------- */

describe("invalid input edge cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POST with null body fields returns 400", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({ tableId: null, date: null }));
    expect(response.status).toBe(400);
  });

  it("POST with array body returns 400", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(
      new NextRequest(new URL("/api/reservations", "http://localhost:3000"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([]),
      })
    );
    expect(response.status).toBe(400);
  });

  it("POST with extra fields still works if required fields present", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
      extraField: "should be ignored",
    }));
    expect(response.status).toBe(201);
  });

  it("DELETE with SQL injection-like id returns 400", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const maliciousId = "'; DROP TABLE reservations; --";
    const response = await DELETE(
      makeDeleteRequest(maliciousId),
      makeParams(maliciousId)
    );
    expect(response.status).toBe(400);
  });

  it("availability with XSS-like date returns 400", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET_AVAILABILITY(
      makeRequest("/api/availability?date=<script>alert(1)</script>")
    );
    expect(response.status).toBe(400);
  });

  it("POST with very long tableId string returns 400", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: "a".repeat(10000),
      date: "2026-04-01",
    }));
    expect(response.status).toBe(400);
  });

  it("POST with numeric tableId returns 400", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await POST(makePostRequest({
      tableId: 12345,
      date: "2026-04-01",
    }));
    expect(response.status).toBe(400);
  });
});

/* -------------------------------------------------------------------------- */
/*  Error response safety                                                      */
/* -------------------------------------------------------------------------- */

describe("error responses don't leak internal details", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("401 response body has generic error", async () => {
    mockUnauthenticated();
    const response = await GET_TABLES();
    const body = await response.json();
    expect(body.error).toBe("No autorizado");
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(JSON.stringify(body)).not.toContain("mongodb");
  });

  it("404 response for invalid reservation has generic message", async () => {
    const user = await createUser();
    const fakeId = nonExistentId();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await DELETE(makeDeleteRequest(fakeId), makeParams(fakeId));
    const body = await response.json();
    expect(body.error).toBe("Reserva no encontrada");
    expect(JSON.stringify(body)).not.toContain("ObjectId");
  });
});

/* -------------------------------------------------------------------------- */
/*  Repeated operations                                                        */
/* -------------------------------------------------------------------------- */

describe("repeated operations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("cancelling the same reservation twice returns error on second attempt", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
    });
    const resId = reservation._id.toString();

    mockAuthenticated(mockSession({ id: user._id.toString(), role: "user" }));

    // First cancel succeeds
    const r1 = await DELETE(makeDeleteRequest(resId), makeParams(resId));
    expect(r1.status).toBe(200);

    // Second cancel fails
    const r2 = await DELETE(makeDeleteRequest(resId), makeParams(resId));
    expect(r2.status).toBe(400);
  });

  it("booking same table twice by same user returns conflict", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const r1 = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
    }));
    expect(r1.status).toBe(201);

    // Can't use makePostRequest again because the body stream was already consumed,
    // so create a new request
    const r2 = await POST(makePostRequest({
      tableId: table._id.toString(),
      date: "2026-04-01",
    }));
    expect(r2.status).toBe(409);
  });
});
