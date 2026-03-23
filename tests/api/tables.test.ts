/**
 * API tests for GET /api/tables.
 *
 * Tests the HTTP layer: auth, response shape, status codes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser, createTable } from "../helpers";
import { mockSession, mockAuthenticated, mockUnauthenticated } from "../helpers/auth-mock";

// Must mock before importing the route handler
vi.mock("@/lib/api-auth", () => ({
  requireSession: vi.fn(),
}));

import { GET } from "@/app/api/tables/route";

describe("GET /api/tables", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session", async () => {
    mockUnauthenticated();
    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns active tables with valid session", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({ label: "A-01", type: "flexible" });
    await createTable({ label: "A-02", type: "preferential" });
    await createTable({ label: "Inactive", isActive: false });

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0].label).toBe("A-01");
    expect(body[1].label).toBe("A-02");
  });

  it("returns correct shape for each table", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    await createTable({
      label: "A-01",
      type: "flexible",
      position: { x: 10, y: 20, width: 100, height: 60 },
    });

    const response = await GET();
    const body = await response.json();

    expect(body[0]).toMatchObject({
      _id: expect.any(String),
      label: "A-01",
      type: "flexible",
      position: { x: 10, y: 20, width: 100, height: 60 },
      isActive: true,
    });
  });

  it("returns empty array when no active tables exist", async () => {
    const user = await createUser();
    mockAuthenticated(mockSession({ id: user._id.toString() }));

    const response = await GET();
    const body = await response.json();
    expect(body).toEqual([]);
  });
});
