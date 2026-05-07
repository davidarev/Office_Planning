/**
 * Authentication mock utilities for API route tests.
 *
 * These helpers work with vi.mock("@/lib/api-auth") declared
 * in the test files. The mock must be declared before importing
 * the auth module.
 */

import { vi } from "vitest";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { UserRole } from "@/domain/types";
import * as apiAuth from "@/lib/api-auth";

/**
 * Creates a mock session object matching the NextAuth session shape
 * used throughout the application.
 */
export function mockSession(overrides: {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole;
}): Session {
  return {
    user: {
      id: overrides.id,
      name: overrides.name ?? "Test User",
      email: overrides.email ?? "test@example.com",
      role: overrides.role ?? "user",
    },
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Mocks requireSession() to return a valid authenticated session.
 */
export function mockAuthenticated(session: Session) {
  vi.mocked(apiAuth.requireSession).mockResolvedValue({
    session,
    error: null,
  });
}

/**
 * Mocks requireSession() to return a 401 unauthorized response.
 */
export function mockUnauthenticated() {
  vi.mocked(apiAuth.requireSession).mockResolvedValue({
    session: null,
    error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
  });
}
