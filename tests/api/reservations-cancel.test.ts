/**
 * API tests for DELETE /api/reservations/:id.
 *
 * Tests auth, authorization (owner vs admin vs other user),
 * validation, and correct HTTP status codes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { createUser, createAdmin, createTable, createReservation, nonExistentId } from "../helpers";
import { mockSession, mockAuthenticated, mockUnauthenticated } from "../helpers/auth-mock";

vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { DELETE } from "@/app/api/reservations/[id]/route";

function makeDeleteRequest(id: string) {
  return new Request(`http://localhost:3000/api/reservations/${id}`, {
    method: "DELETE",
  });
}

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/reservations/:id", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await DELETE(
      makeDeleteRequest(nonExistentId()),
      makeParams(nonExistentId())
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 with invalid ObjectId", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await DELETE(
      makeDeleteRequest("not-valid-id"),
      makeParams("not-valid-id")
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when reservation does not exist", async () => {
    const user = await createUser();
    const fakeId = nonExistentId();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await DELETE(
      makeDeleteRequest(fakeId),
      makeParams(fakeId)
    );
    expect(response.status).toBe(404);
  });

  it("owner can cancel their own reservation (200)", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
    });
    const resId = reservation._id.toString();

    mockAuthenticated(mockSession({ id: user._id.toString(), role: "user" }));

    const response = await DELETE(makeDeleteRequest(resId), makeParams(resId));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("cancelled");
  });

  it("admin can cancel any reservation (200)", async () => {
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

    const body = await response.json();
    expect(body.status).toBe("cancelled");
  });

  it("non-owner non-admin gets 403", async () => {
    const owner = await createUser();
    const other = await createUser();
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({
      userId: owner._id,
      tableId: table._id,
      date: "2026-04-01",
    });
    const resId = reservation._id.toString();

    mockAuthenticated(mockSession({ id: other._id.toString(), role: "user" }));

    const response = await DELETE(makeDeleteRequest(resId), makeParams(resId));
    expect(response.status).toBe(403);
  });

  it("returns 400 when reservation already cancelled", async () => {
    const user = await createUser();
    const table = await createTable({ type: "flexible" });
    const reservation = await createReservation({
      userId: user._id,
      tableId: table._id,
      date: "2026-04-01",
      status: "cancelled",
    });
    const resId = reservation._id.toString();

    mockAuthenticated(mockSession({ id: user._id.toString(), role: "user" }));

    const response = await DELETE(makeDeleteRequest(resId), makeParams(resId));
    expect(response.status).toBe(400);
  });
});
