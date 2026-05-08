import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DateSelectionProvider } from "@/components/booking/DateSelectionProvider";
import { FloorPlan } from "@/components/floor-plan";

/**
 * Página principal — punto de entrada tras autenticarse.
 *
 * Muestra el selector de semana/día y el contenedor del plano (FloorPlan).
 * El fetching real de mesas y su renderizado completo se integran en
 * tickets posteriores (OP-222, OP-230). Mientras tanto, FloorPlan recibe
 * un array vacío y renderiza el estado "sin mesas configuradas".
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
        <FloorPlan tables={[]} />
      </DateSelectionProvider>
    </main>
  );
}
