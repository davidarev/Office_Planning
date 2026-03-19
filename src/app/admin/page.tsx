import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Admin panel entry point.
 * Protected by role — only admin users can access this page.
 * Full implementation will come in a later phase.
 */
export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-bold">Panel de administración</h1>
      <p className="mt-2 text-gray-600">
        La gestión de usuarios y mesas estará disponible próximamente.
      </p>
    </main>
  );
}
