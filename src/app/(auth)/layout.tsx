import { Suspense } from "react";

/**
 * Layout para las páginas de autenticación (login, verify, error).
 * Sin navegación — el usuario aún no está autenticado.
 *
 * Suspense es necesario porque las páginas usan useSearchParams(),
 * que requiere un boundary de Suspense en el App Router de Next.js.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
