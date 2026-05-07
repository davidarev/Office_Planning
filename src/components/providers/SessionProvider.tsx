"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Wrapper de SessionProvider para el App Router de Next.js.
 * Necesario para que los client components puedan usar useSession().
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
