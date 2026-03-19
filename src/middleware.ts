export { auth as middleware } from "@/lib/auth";

/**
 * Route matcher configuration for NextAuth middleware.
 *
 * Protects all routes except:
 * - /login and related auth pages
 * - /api/auth (NextAuth endpoints)
 * - Static files and Next.js internals
 */
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
