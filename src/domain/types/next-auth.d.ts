import type { UserRole } from "./user";

/**
 * Extends NextAuth's default Session and User types
 * to include our custom fields (role, database ID).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      image?: string | null;
    };
  }
}
