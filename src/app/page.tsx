import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Root page — redirects authenticated users to the booking view.
 * Unauthenticated users are handled by the middleware (redirected to /login).
 */
export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Office Desk Booking</h1>
        <p className="text-lg text-gray-600">
          Bienvenido, {session.user.name}
        </p>
        <p className="text-sm text-gray-500">
          El plano de mesas estará disponible próximamente.
        </p>
      </div>
    </main>
  );
}
