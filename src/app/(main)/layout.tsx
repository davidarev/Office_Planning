import { Header } from "@/components/layout/Header";

/**
 * Layout para las rutas autenticadas de la aplicación.
 * Incluye el header con información del usuario y acciones de sesión.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
    </>
  );
}
