import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DateSelectionProvider } from "@/components/booking/DateSelectionProvider";
import { FloorPlanSection } from "@/components/floor-plan";

/**
 * Página principal — punto de entrada tras autenticarse.
 *
 * Obtiene la sesión del usuario y delega el fetching de disponibilidad
 * y el renderizado del plano a FloorPlanSection, que reacciona al día
 * seleccionado via useDateSelection() y useAvailability().
 */
export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex-1 flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Reserva tu mesa</h1>
        <p className="text-sm text-gray-600">
          Bienvenido, {session.user.name}
        </p>
      </div>

      <DateSelectionProvider>
        <FloorPlanSection currentUserId={session.user.id} />
      </DateSelectionProvider>
    </main>
  );
}
