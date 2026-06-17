import Link from "next/link";

/**
 * Auth error page — shown when authentication fails.
 * Common causes: expired/invalid magic link, unauthorized email.
 */
export default function AuthErrorPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Error de autenticación</h1>
        <p className="text-gray-600">
          No se ha podido completar el acceso. El enlace puede haber expirado o
          tu email no está autorizado.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </main>
  );
}
