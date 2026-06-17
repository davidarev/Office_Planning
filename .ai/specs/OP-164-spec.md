# OP-164 — Aplicar correcciones a autenticación

## Contexto

La auditoría OP-140 identificó 7 hallazgos en la capa de autenticación (0 bloqueantes, 3 mejoras, 4 observaciones), recogidos en `.ai/reports/OP-140-findings.md`. Esta subtarea aplica las correcciones de severidad Mejora y las observaciones accionables de mayor impacto sin cambiar el comportamiento del caso feliz ni introducir nuevas dependencias.

Ficheros afectados:
- `src/lib/auth.ts` — callbacks `signIn` y `session`
- `src/lib/api-auth.ts` — helper `requireSession()`
- `src/app/(auth)/layout.tsx` — layout del grupo de rutas de auth
- `src/app/(auth)/login/page.tsx` — validación de `callbackUrl`

## Objetivo

Aplicar los tres hallazgos de severidad Mejora de OP-140 más las dos observaciones accionables con bajo riesgo de regresión:

- El callback `session` debe verificar `isActive: true` al consultar el usuario — un usuario desactivado no debe poder seguir enriqueciendo su sesión
- Las variables de entorno de email deben validarse en tiempo de módulo para que el servidor falle rápido en arranque si el entorno no está configurado correctamente
- `requireSession()` debe envolver `auth()` en un `try/catch` para responder de forma controlada si la BD falla durante la lectura de sesión
- `callbackUrl` en la página de login debe validarse defensivamente en la app (solo rutas relativas) además de confiar en NextAuth
- `<Suspense>` en el layout de auth debe tener un `fallback` mínimo para evitar flash de pantalla vacía

## Restricciones

- No cambiar el comportamiento del caso feliz (login correcto, sesión válida, usuario activo)
- No introducir nuevas dependencias
- Todos los cambios deben estar trazados a hallazgos de OP-140
- Los tests existentes de autenticación deben seguir pasando

## Correcciones a aplicar

### `src/lib/auth.ts`

**H-140-1** — Añadir `isActive: true` a la query del callback `session`:
```ts
// Antes
const dbUser = await User.findOne({ email: user.email.toLowerCase() }).lean();

// Después
const dbUser = await User.findOne({
  email: user.email.toLowerCase(),
  isActive: true,
}).lean();
```
Efecto: si el usuario está desactivado, `dbUser` será `null`, los campos `id`, `role` y `name` no se asignan en la sesión, y `requireSession()` rechazará la petición con 401 (porque `session.user.id` quedará sin asignar). Cubre también H-140-6 (usuario eliminado directamente de BD).

**H-140-2** — Añadir validación de variables de entorno de email en tiempo de módulo. Las variables necesarias son: `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`. Si alguna no está definida, lanzar `Error` con mensaje claro — igual que hace `auth-mongodb-client.ts` con `MONGODB_URI`. La validación se añade al inicio del módulo `auth.ts`, antes de la configuración de NextAuth.

### `src/lib/api-auth.ts`

**H-140-3** — Envolver `await auth()` en `try/catch` en `requireSession()`:
```ts
let session: Session | null;
try {
  session = await auth();
} catch {
  return {
    session: null,
    error: NextResponse.json({ error: "Error de servidor" }, { status: 503 }),
  };
}
```
Efecto: si `auth()` lanza excepción (BD caída durante lectura de sesión), la respuesta es un 503 controlado en lugar de un 500 genérico del framework.

### `src/app/(auth)/login/page.tsx`

**H-140-5** — Añadir validación defensiva de `callbackUrl` en la app:
```ts
// Antes
const callbackUrl = searchParams.get("callbackUrl") ?? "/";

// Después
const raw = searchParams.get("callbackUrl") ?? "/";
const callbackUrl = raw.startsWith("/") ? raw : "/";
```
Efecto: garantiza que `callbackUrl` es siempre una ruta relativa, independientemente de la configuración de `NEXTAUTH_URL` en el despliegue.

### `src/app/(auth)/layout.tsx`

**H-140-7** — Añadir `fallback` mínimo al `<Suspense>`:
```tsx
// Antes
<Suspense>{children}</Suspense>

// Después
<Suspense fallback={<div className="flex-1" />}>{children}</Suspense>
```
Efecto: evita el flash de pantalla vacía durante la hidratación SSR→cliente.

## Casos límite

- **H-140-1**: tras la corrección, un usuario desactivado con sesión activa verá su próxima petición autenticada rechazada con 401. Este es el comportamiento deseado. El tiempo máximo de acceso tras desactivación pasa de 90 días a como mucho `updateAge` (24h), ya que en el siguiente refresco la sesión no se enriquecerá.
- **H-140-2**: la validación de `EMAIL_SERVER_PORT` debe verificar que es un número válido además de que la variable existe — `Number(process.env.EMAIL_SERVER_PORT)` produce `NaN` si la variable está definida pero es vacía o no numérica. Verificar `!process.env.EMAIL_SERVER_PORT || isNaN(Number(process.env.EMAIL_SERVER_PORT))`.
- **H-140-3**: el status 503 es apropiado para un fallo de BD (servicio no disponible temporalmente), distinto del 401 por sesión ausente. Los handlers no necesitan cambios — ya tienen `try/catch` propio para errores del servicio.
- **H-140-5**: `callbackUrl` con valor `null` (parámetro no presente) ya estaba manejado con `?? "/"`. La nueva validación solo añade el check de que empiece por `/`.

## Decisión sobre H-140-4 (inconsistencia tipo/runtime en sesión fallida)

H-140-4 propone marcar `id`, `role` y `name` como opcionales en `next-auth.d.ts`. Se descarta en esta subtarea por el siguiente razonamiento: con la corrección de H-140-1, si el enriquecimiento no ocurre (usuario inactivo o BD caída), los campos quedan sin asignar → `session.user.id` es `undefined` → `requireSession()` rechaza con 401. El flujo no llega a código que asuma `session.user.id` como string. Hacer los tipos opcionales introduciría guards adicionales en todos los consumers sin aportar seguridad adicional real. Se documenta como decisión intencional.

## Criterios de aceptación

- AC-1: callback `session` en `auth.ts` filtra por `isActive: true` — un usuario desactivado no enriquece su sesión
- AC-2: `auth.ts` valida al inicio todas las variables de entorno de email y lanza `Error` claro en arranque si alguna falta o es inválida
- AC-3: `requireSession()` en `api-auth.ts` envuelve `auth()` en `try/catch` y devuelve 503 si lanza excepción
- AC-4: `callbackUrl` en `login/page.tsx` validado como ruta relativa antes de pasarlo a `signIn`
- AC-5: `<Suspense>` en `layout.tsx` tiene `fallback={<div className="flex-1" />}`
- AC-6: Suite de tests pasa sin regresiones: `npm run test`

## Criterio de done

- Todos los AC en PASS
- verify en verde (`npm run test && npm run lint`)
- Spec actualizada con `## Execution Result`

## Execution Result

**Fecha:** 2026-05-07
**Rama:** feature/OP-160-correccion-deuda-tecnica

### Correcciones aplicadas

| Hallazgo | Fichero | Descripción |
|---|---|---|
| H-140-1 | `src/lib/auth.ts` | Callback `session` filtra por `isActive: true` |
| H-140-2 | `src/lib/auth.ts` | Validación de variables de entorno de email en tiempo de módulo |
| H-140-3 | `src/lib/api-auth.ts` | `requireSession()` envuelve `auth()` en try/catch → 503 si BD falla |
| H-140-5 | `src/app/(auth)/login/page.tsx` | `callbackUrl` validado como ruta relativa |
| H-140-7 | `src/app/(auth)/layout.tsx` | `<Suspense>` tiene `fallback={<div className="flex-1" />}` |

**Nota:** Se añadió también `.obsidian/**` a los ignores de ESLint para excluir archivos de plugins de terceros que causaban 3 errores de lint espurios.

### Criterios de aceptación

| AC | Estado | Notas |
|---|---|---|
| AC-1 | PASS | `isActive: true` en query del callback `session` |
| AC-2 | PASS | Validación de 5 vars de entorno + check `isNaN` en `EMAIL_SERVER_PORT` |
| AC-3 | PASS | try/catch en `requireSession()`, devuelve 503 |
| AC-4 | PASS | `raw.startsWith("/") ? raw : "/"` |
| AC-5 | PASS | `fallback={<div className="flex-1" />}` |
| AC-6 | PASS | 242/242 tests en verde |

### Verificaciones

| Check | Resultado |
|---|---|
| `npm run lint` | PASS (0 errores, 4 warnings preexistentes en tests) |
| `npm run test` | PASS (242/242) |
