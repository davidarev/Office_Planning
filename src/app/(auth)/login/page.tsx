"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

/**
 * Login page — permite al usuario solicitar un magic link por email.
 *
 * Flujo:
 * 1. El usuario introduce su email y envía el formulario.
 * 2. Se llama a signIn("email") de NextAuth con el callbackUrl original.
 * 3. Si tiene éxito, el usuario ve la pantalla de verificación.
 * 4. Tras hacer clic en el enlace, NextAuth redirige a callbackUrl (o a /).
 * 5. Si el email no está autorizado, NextAuth redirige a /login/error.
 *
 * Nota de seguridad: no se revela si el email existe o no en el sistema.
 * El mensaje de error es genérico para todos los casos de fallo.
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("email", {
        email: email.trim().toLowerCase(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Ha ocurrido un error. Inténtalo de nuevo.");
        setIsLoading(false);
        return;
      }

      // Redirigir a la pantalla de verificación
      window.location.href = "/login/verify";
    } catch {
      setError("Ha ocurrido un error. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Office Desk Booking</h1>
          <p className="mt-2 text-gray-600">
            Introduce tu email corporativo para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Enviando..." : "Enviar enlace de acceso"}
          </button>
        </form>
      </div>
    </main>
  );
}
