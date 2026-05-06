# OP-144 — Revisar páginas de auth

## Contexto
Las páginas de autenticación están bajo `src/app/(auth)/` con su propio layout, y el handler de NextAuth en `src/app/api/auth/[...nextauth]/route.ts`. Los ficheros implicados son:

- `src/app/(auth)/login/page.tsx` — formulario de solicitud de magic link
- `src/app/(auth)/login/verify/page.tsx` — pantalla informativa post-envío
- `src/app/(auth)/login/error/page.tsx` — pantalla de error de autenticación
- `src/app/(auth)/layout.tsx` — layout del grupo de auth (sin navegación, con Suspense)
- `src/app/api/auth/[...nextauth]/route.ts` — handler de NextAuth que delega en `handlers`

Esta subtarea forma parte de la auditoría OP-140 y no implica cambios en el código.

## Objetivo
Verificar que el flujo completo de UI de autenticación es correcto, seguro y coherente: desde la solicitud del magic link hasta la gestión del `callbackUrl`, los estados de error, y la integración con NextAuth sin exposición de información sensible.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### `login/page.tsx` — formulario de magic link
- ¿`callbackUrl` se lee de `useSearchParams()` — qué ocurre si apunta a una URL externa? ¿NextAuth valida el destino o puede usarse para open redirect?
- ¿`email.trim().toLowerCase()` se aplica antes de llamar a `signIn` — es coherente con la normalización en BD?
- ¿`redirect: false` en `signIn("email", ...)` es correcto para manejar el resultado en el cliente antes de redirigir?
- ¿`result?.error` cubre todos los casos de fallo de NextAuth o pueden existir errores no reflejados en este campo?
- ¿`window.location.href = "/login/verify"` redirige correctamente tras éxito — es la forma adecuada en un componente cliente de Next.js?
- ¿El mensaje de error `"Ha ocurrido un error. Inténtalo de nuevo."` es suficientemente genérico — no revela si el email existe?
- ¿El campo `email` usa `type="email"` y `required` — proporciona validación básica de formato en cliente?
- ¿El botón se deshabilita durante `isLoading` — evita envíos múltiples?
- ¿La página es `"use client"` — es necesario y correcto dado el uso de `useState` y `useSearchParams`?

### `login/verify/page.tsx` — pantalla de verificación
- ¿La página es puramente informativa sin lógica — correcto para una pantalla de confirmación?
- ¿No expone ningún dato de la solicitud (email, token) en la UI?
- ¿El mensaje es claro y menciona la carpeta de spam?

### `login/error/page.tsx` — pantalla de error
- ¿El mensaje de error es genérico — no indica si el email existe, si el token expiró, ni otros detalles internos?
- ¿Se ofrece un enlace de vuelta a `/login` para que el usuario pueda reintentar?
- ¿La página no lee ni muestra el parámetro `?error=` de la URL — evita reflejar valores controlados por el atacante (reflected XSS via query param)?

### `layout.tsx` — layout de auth
- ¿`<Suspense>` envuelve a `{children}` — necesario por el uso de `useSearchParams()` en `login/page.tsx` con el App Router?
- ¿La ausencia de navegación en el layout es correcta para páginas pre-autenticación?
- ¿El layout no aplica ninguna comprobación de sesión — correcto ya que estas rutas son públicas?

### `api/auth/[...nextauth]/route.ts` — handler de NextAuth
- ¿`handlers` se importa desde `@/lib/auth` y se exporta como `GET` y `POST` — es la forma correcta en Next.js App Router con NextAuth v5?
- ¿No hay lógica adicional en el handler — correcto, toda la lógica está en los callbacks de `auth.ts`?

### Aspectos transversales
- ¿El flujo completo (solicitud → verificación → clic en enlace → `signIn` callback → sesión → redirección) es coherente de extremo a extremo?
- ¿El grupo de rutas `(auth)` está correctamente separado del grupo principal `(main)` — las rutas de auth son accesibles sin sesión?
- ¿Hay alguna ruta de auth que debería estar protegida o viceversa?

## Casos límite
- `callbackUrl` apuntando a `https://evil.com` — ¿NextAuth lo valida o lo acepta ciegamente?
- Usuario que envía el formulario varias veces rápidamente antes de que `isLoading` se active — ¿puede generar múltiples tokens de magic link?
- Magic link expirado o ya usado — ¿la página de error muestra algo diferente o siempre el mismo mensaje genérico?
- `useSearchParams()` sin `Suspense` boundary — ¿el layout lo cubre correctamente para evitar el error de Next.js en SSR?
- `result` de `signIn` siendo `undefined` — ¿el optional chaining `result?.error` cubre este caso?

## Criterios de aceptación
- AC-1: Verificar que el formulario de login normaliza el email, usa `redirect: false` y maneja errores con mensaje genérico sin revelar si el email existe
- AC-2: Identificar si `callbackUrl` puede usarse para open redirect y documentar el riesgo
- AC-3: Verificar que la página de error no refleja el parámetro `?error=` de la URL ni expone detalles de infraestructura
- AC-4: Verificar que el `<Suspense>` en el layout es correcto y necesario para el uso de `useSearchParams()`
- AC-5: Verificar que el handler de NextAuth exporta `GET` y `POST` desde `handlers` sin lógica adicional
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación) para consolidar en OP-145

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados para su consolidación en OP-145
- Sin modificaciones al código fuente

## Execution Result

- Fecha de implementación: 2026-05-06 (CET)
- Rama: feature/OP-140-implementar-mejoras-seguridad-autenticacion
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — Formulario normaliza email con `trim().toLowerCase()`, usa `redirect: false`, mensaje genérico en todos los fallos, botón deshabilitado durante carga, `type="email"` + `required`.
  - AC-2: PASS con observación — NextAuth v5 valida `callbackUrl` internamente. Sin validación adicional en la app. Riesgo mitigado por framework con `NEXTAUTH_URL` correctamente configurado. Hallazgo H-144-1.
  - AC-3: PASS — Página de error no lee ni renderiza `?error=` de la URL. Sin riesgo de reflected XSS. Mensaje genérico. Enlace de vuelta a `/login`.
  - AC-4: PASS con observación menor — `<Suspense>` correcto y necesario para `useSearchParams()`. Sin `fallback` causa flash de pantalla vacía (H-144-2, sin impacto de seguridad).
  - AC-5: PASS — `export const { GET, POST } = handlers` correcto para App Router + NextAuth v5. Sin lógica adicional en el handler.
  - AC-6: PASS — Hallazgos H-144-1 y H-144-2 registrados en `.ai/reports/OP-140-findings.md`.
- Ficheros auditados (sin modificaciones):
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/login/verify/page.tsx`
  - `src/app/(auth)/login/error/page.tsx`
  - `src/app/(auth)/layout.tsx`
  - `src/app/api/auth/[...nextauth]/route.ts`
- Ficheros modificados:
  - `.ai/reports/OP-140-findings.md` (sección OP-144 añadida)
- verify:
  - Comando ejecutado: auditoría estática (tarea de solo lectura, sin cambios de código)
  - Resultado: PASS — todos los AC verificados manualmente contra el código fuente
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: lectura y análisis de ficheros, redacción del informe de hallazgos y Execution Result
- Decisiones técnicas:
  - H-144-1 se clasifica como "Observación" porque NextAuth v5 tiene protección propia contra open redirect; el riesgo solo se materializa si `NEXTAUTH_URL` está mal configurado en producción.
  - H-144-2 se clasifica como "Observación menor" porque no tiene impacto de seguridad ni funcional — es una mejora de UX.
