import { auth, signOut } from "@/lib/auth";

/**
 * Header principal de la aplicación.
 * Muestra el nombre del usuario y el enlace de cierre de sesión.
 * Es un server component — accede a la sesión directamente.
 */
export async function Header() {
  const session = await auth();

  if (!session) return null;

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="font-semibold text-gray-900">Office Desk Booking</span>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session.user.name}</span>

          {session.user.role === "admin" && (
            <a
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Admin
            </a>
          )}

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
