import { handlers } from "@/lib/auth";

/**
 * NextAuth.js API route handler.
 * Delegates all auth-related requests (sign in, callback, sign out, etc.)
 * to the NextAuth handlers configured in @/lib/auth.
 */
export const { GET, POST } = handlers;
