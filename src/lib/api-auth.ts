/**
 * Authentication helper for API route handlers.
 *
 * Provides a consistent way to check for a valid session in API routes
 * and return a typed session or a 401 response. This avoids repeating
 * auth boilerplate in every endpoint.
 *
 * @module apiAuth
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * Result of an API authentication check.
 * Either contains a valid session, or an error response ready to return.
 */
export type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

/**
 * Checks that the current request has a valid session.
 *
 * Usage in API routes:
 * ```ts
 * const { session, error } = await requireSession();
 * if (error) return error;
 * // session is guaranteed to be non-null here
 * ```
 *
 * @returns Object with either a valid session or a 401 error response
 */
export async function requireSession(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      ),
    };
  }

  return { session, error: null };
}
