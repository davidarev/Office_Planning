import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Middleware de autenticación y autorización.
 *
 * Reglas:
 * - Rutas públicas (/login y variantes, /api/auth): acceso libre.
 * - Rutas /admin: solo accesibles por usuarios con role === "admin".
 * - Resto de rutas privadas: requieren sesión activa.
 * - Usuarios autenticados que intentan acceder a /login son redirigidos a /.
 */
export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isAuthenticated = !!session;
  const isAuthPage = pathname.startsWith("/login");
  const isAdminRoute = pathname.startsWith("/admin");

  // Redirigir usuarios ya autenticados fuera de las páginas de auth
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Ruta /admin: requiere sesión y rol admin
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // Rutas privadas sin sesión: redirigir a login
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
  ],
};
