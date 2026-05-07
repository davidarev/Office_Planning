import type { UserRole } from "./user";

/**
 * Extends NextAuth's default Session and User types
 * to include our custom fields (role, database ID).
 * Both interfaces must be extended so jwt and session callbacks are typed correctly.
 */
declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    image?: string | null;
  }

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
