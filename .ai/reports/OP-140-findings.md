# OP-140 — Informe de hallazgos: Seguridad y Autenticación

> Auditoría de la capa de autenticación. Cada subtarea contribuye sus hallazgos a este informe consolidado.
> Los hallazgos se aplican como mejoras en OP-160.

---

## OP-141 — Configuración de NextAuth (`src/lib/auth.ts`)

**Fecha de auditoría**: 2026-05-06
**Auditor**: Claude Code (IA-asistido)

### AC-1: Adapter y conexión MongoDB — PASS

`MongoDBAdapter(getMongoClient())` es correcto:
- `getMongoClient()` devuelve `Promise<MongoClient>`, que es exactamente la firma que espera `@auth/mongodb-adapter`.
- El cliente usa `global.mongoClientCache` (singleton con `MongoClient` nativo de `mongodb`).
- Es completamente independiente de `connectDB()`, que usa `global.mongooseCache` (Mongoose). No hay conflicto de cierre ni cliente compartido.
- La gestión de singleton con `global.*` previene múltiples conexiones en hot-reload / serverless.

### AC-2: EmailProvider y variables de entorno — PASS con observación

- Todas las variables referenciadas: `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`. Sin hardcoding.
- `EMAIL_SERVER_PORT` se convierte correctamente con `Number(...)`.
- **Observación (mejora)**: Si `EMAIL_SERVER_PORT` no está definida en el entorno, `Number(undefined)` produce `NaN`. El proveedor aceptará el valor sin lanzar error inmediato, pero fallará en el envío del primer magic link. No hay validación defensiva que alerte en arranque. Se recomienda añadir una comprobación explícita similar a la de `MONGODB_URI` en `auth-mongodb-client.ts`.
- **Severidad**: Mejora (no bloqueante, pero puede causar errores silenciosos en producción si el entorno no está bien configurado).

### AC-3: Session strategy — PASS

- `strategy: "database"` es la opción correcta cuando se usa `MongoDBAdapter`: la sesión se almacena en MongoDB, no en JWT.
- `maxAge: 90 * 24 * 60 * 60` = 7 776 000 segundos = 90 días exactos. ✅
- `updateAge: 24 * 60 * 60` = 86 400 segundos = 24 horas. Valor razonable para evitar escrituras excesivas sin dejar sesiones obsoletas demasiado tiempo. ✅
- La combinación adapter + `strategy: "database"` garantiza persistencia en BD. Sin JWT en cliente.

### AC-4: Páginas personalizadas — PASS

- `/login` → `src/app/(auth)/login/` existe. ✅
- `/login/verify` → `src/app/(auth)/login/verify/` existe. ✅
- `/login/error` → `src/app/(auth)/login/error/` existe. ✅
- Keys `signIn`, `verifyRequest`, `error` son los correctos para NextAuth v5. ✅
- El flujo magic link (solicitud → verificación → error) es coherente con las rutas definidas.

### AC-5: Exportaciones y ausencia de credenciales hardcodeadas — PASS

- `export const { handlers, signIn, signOut, auth } = NextAuth(...)` exporta todas las entidades esperadas por NextAuth v5.
- Sin credenciales, tokens ni secretos hardcodeados en el fichero. Todo se lee de `process.env.*`.
- El fichero tiene documentación JSDoc adecuada explicando las decisiones clave.

### AC-6: Hallazgos consolidados para OP-160

| ID | Severidad | Descripción | Fichero |
|---|---|---|---|
| H-141-1 | Mejora | `EMAIL_SERVER_PORT` puede ser `NaN` si la variable no está definida. Añadir validación defensiva en arranque similar a `MONGODB_URI`. | `src/lib/auth.ts` o nuevo `src/lib/env-validation.ts` |

### Observaciones adicionales

- El callback `signIn` usa un mensaje de error genérico (`AccessDenied`) sin revelar si el email existe. Correcto desde el punto de vista de seguridad.
- El callback `session` consulta la BD en cada refresco para garantizar datos actualizados. El bloque `catch` silencia el error sin propagar — es una decisión deliberada y documentada (la sesión sigue siendo válida).
- No se detectaron credenciales, tokens ni rutas hardcodeadas.

---

## OP-142 — Callbacks `signIn` y `session` (`src/lib/auth.ts`)

**Fecha de auditoría**: 2026-05-06
**Auditor**: Claude Code (IA-asistido)

### AC-1: `signIn` rechaza usuarios inexistentes e inactivos con mensaje genérico — PASS

- `user.email` se comprueba antes de consultar la BD. Si es falsy → redirige a `/login/error?error=AccessDenied`.
- Query: `{ email: user.email.toLowerCase(), isActive: true }` — filtra por ambas condiciones simultáneamente en una sola consulta.
- Mensaje genérico `AccessDenied` sin revelar si el email existe en el sistema. Correcto desde el punto de vista de seguridad (previene enumeración de usuarios).

### AC-2: `signIn` usa `toLowerCase()`, `isActive: true` y el `catch` redirige a error — PASS

- `email.toLowerCase()` presente en la query. ✅
- `isActive: true` presente en la query. ✅
- Bloque `catch` devuelve `"/login/error?error=AccessDenied"` — no devuelve `true` ni deja pasar la excepción. ✅
- Devolver una URL de redirección en lugar de `false` es el patrón correcto en NextAuth v5 para garantizar la redirección a la página de error personalizada.
- `connectDB()` (Mongoose) es correcto aquí: accede al modelo `User` del dominio propio, independiente del adapter.

### AC-3: `session` enriquece correctamente con `id`, `role` y `name` — PASS con observación

- Comprueba `user?.email` antes de consultar BD. ✅
- Query: `{ email: user.email.toLowerCase() }` — coherente con `lowercase: true` del schema. ✅
- Asigna `session.user.id = dbUser._id.toString()`, `session.user.role = dbUser.role as UserRole`, `session.user.name = dbUser.name`. ✅
- Se consulta la BD en cada refresco de sesión, garantizando datos actualizados.
- **Observación**: si `dbUser` es `null` (usuario no encontrado en BD pero con sesión vigente en NextAuth), los campos `id`, `role` y `name` quedan sin asignar en la sesión. La sesión sigue siendo técnicamente válida pero incompleta. En el contexto de este sistema esto es poco probable (el usuario existía al hacer `signIn`), pero es un hueco de robustez.

### AC-4: `session` no verifica `isActive` — hallazgo de mejora

- El callback `session` busca el usuario **sin** filtrar por `isActive`. Un usuario desactivado después de iniciar sesión mantiene su sesión activa.
- La sesión se renueva cada `updateAge` (24h), pero en cada renovación `session` callback vuelve a enriquecer la sesión sin comprobar `isActive`. El usuario desactivado seguirá accediendo hasta que su sesión expire (máx. 90 días).
- **Severidad**: Mejora (no bloqueante en el contexto de una app interna con pocos usuarios, pero es un gap de seguridad real que debe corregirse).
- **Recomendación**: añadir `isActive: true` a la query en el callback `session`, y si el usuario está inactivo, no enriquecer la sesión o invalida activamente redirigiendo al error.

### AC-5: Coherencia entre `session` callback y `next-auth.d.ts` — PASS con observación

- `next-auth.d.ts` declara `id: string`, `name: string`, `email: string`, `role: UserRole` como **no opcionales**, `image?: string | null` como opcional.
- El callback asigna `id`, `role` y `name` — `email` lo gestiona NextAuth internamente desde el objeto `user`. ✅
- `dbUser.role as UserRole`: el schema tiene `default: "user"` y `enum: ["user","admin"]`, por lo que en práctica nunca es `undefined`. El cast es seguro para documentos actuales.
- **Observación**: si el enriquecimiento falla (entra en el `catch`), `session.user.id`, `session.user.role` y `session.user.name` quedan como `undefined` en tiempo de ejecución, aunque `next-auth.d.ts` los declara como no opcionales. TypeScript no lo detecta porque el tipo ya está declarado. No hay garantía de consistencia entre tipos declarados y valor real cuando el enriquecimiento falla.
- **Severidad**: Observación (el `catch` silenciante es una decisión documentada y deliberada, pero la inconsistencia de tipos es un riesgo latente).

### AC-6: Hallazgos consolidados para OP-160

| ID | Severidad | Descripción | Fichero |
|---|---|---|---|
| H-142-1 | Mejora | `session` callback no verifica `isActive`. Un usuario desactivado mantiene sesión activa hasta que expire (máx. 90 días). Añadir `isActive: true` a la query de `session`. | `src/lib/auth.ts` |
| H-142-2 | Observación | Si el enriquecimiento de sesión falla (catch), los campos `id`, `role` y `name` son `undefined` en runtime aunque `next-auth.d.ts` los declara como no opcionales. | `src/lib/auth.ts`, `src/domain/types/next-auth.d.ts` |
| H-142-3 | Observación | Si `dbUser` es `null` en `session` (usuario eliminado de BD con sesión vigente en NextAuth), la sesión queda sin enriquecimiento. Bajo riesgo en app interna, pero hueco de robustez. | `src/lib/auth.ts` |

---

## OP-143 — `auth-mongodb-client.ts` y `api-auth.ts`

**Fecha de auditoría**: 2026-05-06
**Auditor**: Claude Code (IA-asistido)

### AC-1: Singleton `getMongoClient()` con `global` cache — PASS

- Patrón `global.mongoClientCache` correcto para Next.js con hot-reload: previene múltiples conexiones en desarrollo y en invocaciones serverless.
- La función cachea primero la `Promise<MongoClient>` y luego el `MongoClient` resuelto. Llamadas concurrentes antes de resolver comparten la misma promesa — no se crean instancias duplicadas.
- `cached.client` se evalúa con retorno temprano antes de crear la promesa: evita doble conexión en el caso ya resuelto.
- `MongoClientCache { client: MongoClient | null; promise: Promise<MongoClient> | null }` cubre los tres estados posibles: sin conectar (ambos null), conectando (solo promise set), conectado (ambos set). ✅
- Completamente independiente de `connectDB()` — usa `global.mongoClientCache` vs `global.mongooseCache`. Sin riesgo de interferencia. ✅

### AC-2: Validación de `MONGODB_URI` y cast `as string` — PASS

- `if (!MONGODB_URI)` en nivel de módulo detecta tanto `undefined` como string vacío `""` (ambos son falsy). ✅
- El `throw new Error(...)` en nivel de módulo hace que el servidor falle en arranque si la variable no está configurada — comportamiento deseable y explícito.
- `MONGODB_URI as string` en `new MongoClient(MONGODB_URI as string)` es seguro: la guarda anterior garantiza que el valor no es `undefined`/vacío en tiempo de ejecución. TypeScript no puede deducirlo por scope, pero el cast es correcto. ✅

### AC-3: `requireSession()` usa `auth()` correctamente — PASS

- `auth()` de NextAuth v5 es la función correcta para obtener la sesión en contextos server-side (API routes, Server Components). ✅
- `!session?.user?.id` es suficiente: comprueba que la sesión existe, tiene `user` y tiene `id`. Dado que `id` solo se asigna en el `session` callback para usuarios válidos y enriquecidos, su ausencia indica sesión inválida o enriquecimiento fallido.
- Comportamiento ante H-142-2 (enriquecimiento fallido → `id` undefined): `requireSession()` rechaza la petición con 401. Esto es **fail-secure**: ante duda, deniega. Comportamiento correcto. ✅

### AC-4: Tipo `AuthResult` y status 401 — PASS

- `AuthResult` como discriminated union `{ session: Session; error: null } | { session: null; error: NextResponse }` permite type narrowing limpio con `if (error) return error` — en el bloque siguiente `session` es `Session` (no null). ✅
- `import type { Session } from "next-auth"` recoge el tipo extendido declarado en `next-auth.d.ts` mediante declaration merging de TypeScript. Los campos `id`, `role`, `name` están disponibles en el tipo `Session` tras el narrowing. ✅
- Status `401` correcto para sesión ausente/inválida. `403` se reserva para sesión presente sin permisos suficientes (comprobación de rol en los handlers). ✅
- Mensaje `"No autorizado"` genérico — no revela información interna. ✅

### AC-5: Ausencia de manejo de errores en `auth()` — hallazgo de mejora

- `requireSession()` no tiene bloque `try/catch`. Si `auth()` lanza excepción (p. ej., BD caída durante lectura de sesión desde el adapter), la excepción se propaga al handler y puede generar una respuesta 500 no controlada.
- En el contexto actual, los handlers tampoco tienen `try/catch` alrededor de `requireSession()`, por lo que la excepción llegaría a Next.js y generaría un error genérico del framework.
- **Severidad**: Mejora (en producción, un fallo puntual de BD al leer la sesión causaría un 500 en lugar de un 503 o un mensaje controlado).
- **Recomendación**: envolver `await auth()` en un `try/catch` en `requireSession()` y devolver un `NextResponse` con status 503 o 500 con mensaje controlado.

### AC-6: Hallazgos consolidados para OP-160

| ID | Severidad | Descripción | Fichero |
|---|---|---|---|
| H-143-1 | Mejora | `requireSession()` no tiene `try/catch` alrededor de `auth()`. Si la BD falla durante la lectura de sesión, la excepción se propaga sin respuesta controlada (500 no gestionado). | `src/lib/api-auth.ts` |

### Observaciones adicionales

- No hay dependencia circular: `api-auth.ts` importa de `auth.ts`, pero `auth.ts` no importa de `api-auth.ts`. ✅
- La separación de responsabilidades es clara: `auth-mongodb-client.ts` provee el cliente para el adapter, `api-auth.ts` provee el helper de sesión para los handlers. No genera confusión sobre qué usar en cada contexto.

---

## OP-144 — Páginas de auth (`src/app/(auth)/`)

**Fecha de auditoría**: 2026-05-06
**Auditor**: Claude Code (IA-asistido)

### AC-1: Formulario de login — normalización, `redirect: false` y mensaje genérico — PASS

- `email.trim().toLowerCase()` aplicado antes de `signIn` — coherente con la normalización en BD (`lowercase: true` en schema). ✅
- `redirect: false` correcto para manejar el resultado en el cliente antes de redirigir. ✅
- `result?.error` con optional chaining cubre el caso de `result` siendo `undefined`. ✅
- Mensaje genérico `"Ha ocurrido un error. Inténtalo de nuevo."` en todos los casos de fallo (tanto `result?.error` como el bloque `catch`). No revela si el email existe. ✅
- Botón deshabilitado durante `isLoading` — previene envíos múltiples. ✅
- `type="email"` + `required` — validación de formato mínima en cliente. ✅
- `"use client"` necesario y correcto por `useState` y `useSearchParams`. ✅
- `window.location.href = "/login/verify"` tras éxito: navegación completa (no Next.js router). Aceptable en este contexto para salir del estado del formulario, aunque `router.push()` sería más idiomático en Next.js.

### AC-2: `callbackUrl` y riesgo de open redirect — PASS con observación

- `callbackUrl` se lee de `useSearchParams()` y se pasa directamente a `signIn("email", { callbackUrl })` sin validación adicional en la app.
- NextAuth v5 valida internamente el `callbackUrl` — rechaza URLs de orígenes externos y solo acepta rutas relativas o del mismo origen (`NEXTAUTH_URL`). La protección existe a nivel de framework.
- **Observación**: la protección de open redirect depende enteramente de que `NEXTAUTH_URL` esté correctamente configurado en producción. Si esta variable no está definida o está mal configurada, la validación del framework puede ser más laxa. La app no añade ninguna capa defensiva propia.
- **Severidad**: Observación (el riesgo es real pero está mitigado por NextAuth siempre que `NEXTAUTH_URL` esté bien configurado; la recomendación es añadir validación defensiva en la app o documentarlo explícitamente en la configuración de despliegue).

### AC-3: Página de error — no refleja `?error=` ni expone detalles internos — PASS

- `AuthErrorPage` no lee `useSearchParams()` ni renderiza ningún valor de la URL. El parámetro `?error=AccessDenied` es ignorado completamente. Sin riesgo de reflected XSS. ✅
- Mensaje genérico: menciona "enlace expirado" y "email no autorizado" como causas posibles sin revelar cuál ocurrió. ✅
- Enlace de vuelta a `/login` presente. ✅
- Sin referencias a detalles de infraestructura ni mensajes técnicos. ✅

### AC-4: `<Suspense>` en layout — PASS con observación menor

- `<Suspense>{children}</Suspense>` envuelve correctamente a todos los hijos. ✅
- Necesario porque `login/page.tsx` usa `useSearchParams()` — sin `Suspense` boundary el App Router de Next.js lanza error en SSR. ✅
- Sin navegación en el layout — correcto para rutas pre-autenticación. El layout no comprueba sesión — correcto, estas rutas son públicas. ✅
- **Observación menor**: `<Suspense>` sin prop `fallback` — durante la hidratación se renderiza `null`, lo que puede causar un flash de pantalla vacía. No es un error funcional ni de seguridad.

### AC-5: Handler de NextAuth — PASS

- `export const { GET, POST } = handlers` — forma correcta para Next.js App Router con NextAuth v5. ✅
- Sin lógica adicional en el handler: toda la lógica está en los callbacks de `auth.ts`. ✅
- JSDoc claro y suficiente. ✅

### AC-6: Hallazgos consolidados para OP-160

| ID | Severidad | Descripción | Fichero |
|---|---|---|---|
| H-144-1 | Observación | `callbackUrl` se pasa a NextAuth sin validación propia en la app. La protección de open redirect depende de que `NEXTAUTH_URL` esté correctamente configurado en producción. | `src/app/(auth)/login/page.tsx` |
| H-144-2 | Observación menor | `<Suspense>` sin `fallback` en el layout — puede causar flash de pantalla vacía durante hidratación. Sin impacto de seguridad. | `src/app/(auth)/layout.tsx` |

### Observaciones adicionales

- El flujo completo magic link (solicitud → verify page → clic en enlace → `signIn` callback → sesión → redirección a `callbackUrl`) es coherente de extremo a extremo. ✅
- El grupo de rutas `(auth)` está correctamente separado del grupo `(main)`. Las rutas de auth son accesibles sin sesión. No hay rutas de auth que deberían estar protegidas. ✅
- `window.location.href` en lugar de `router.push()` es una observación de estilo sin impacto de seguridad ni funcional.

---

## Informe consolidado OP-140 (producido por OP-145)

> Este informe es la fuente de trabajo para OP-160. Cada hallazgo tiene ID único `H-140-N`, severidad, fichero, descripción del problema, riesgo real y propuesta de corrección orientativa.

### Resumen ejecutivo

| Total | Bloqueantes | Mejoras | Observaciones |
|-------|-------------|---------|---------------|
| 7 | 0 | 3 | 4 |

La capa de autenticación es **funcionalmente correcta y segura** para el caso feliz. No se detectaron vulnerabilidades bloqueantes ni credenciales expuestas. Los hallazgos son mejoras de robustez y observaciones de coherencia interna que deben abordarse antes de producción.

---

### Hallazgos

#### H-140-1 — `session` callback no verifica `isActive`
- **Severidad**: Mejora
- **Origen**: OP-142
- **Fichero**: `src/lib/auth.ts` (línea ~83)
- **Descripción**: El callback `session` busca el usuario en BD sin filtrar por `isActive: true`. Un usuario desactivado por un administrador después de hacer login mantiene su sesión activa y puede seguir accediendo a la aplicación hasta que la sesión expire.
- **Riesgo**: Un usuario dado de baja no pierde el acceso de forma inmediata. Con `maxAge` de 90 días, el acceso puede prolongarse hasta 3 meses tras la desactivación; con `updateAge` de 24h, al menos hasta el próximo ciclo de renovación.
- **Propuesta para OP-160**: Añadir `isActive: true` a la query de `session` callback. Si el usuario está inactivo, devolver la sesión sin enriquecimiento o llamar a `signOut()` para invalidarla activamente.

```ts
// Antes
const dbUser = await User.findOne({ email: user.email.toLowerCase() }).lean();

// Después
const dbUser = await User.findOne({
  email: user.email.toLowerCase(),
  isActive: true,
}).lean();
```

---

#### H-140-2 — Variables de entorno de email sin validación en arranque
- **Severidad**: Mejora
- **Origen**: OP-141
- **Fichero**: `src/lib/auth.ts` (líneas ~29-38)
- **Descripción**: Las variables `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD` y `EMAIL_FROM` se pasan directamente a `EmailProvider` sin comprobación de presencia. Si alguna no está definida en el entorno, el proveedor se registra con `undefined`/`NaN` sin error visible en arranque. El fallo ocurre silenciosamente en el primer intento de envío de magic link. En concreto, `Number(undefined)` produce `NaN` para el puerto.
- **Riesgo**: La aplicación arranca sin errores pero el flujo de autenticación completo falla en el momento de enviar el primer magic link. Difícil de diagnosticar en producción si los logs no son claros.
- **Propuesta para OP-160**: Añadir validación de variables de entorno de email en tiempo de módulo, similar al patrón de `auth-mongodb-client.ts`. Puede centralizarse en un módulo `src/lib/env-validation.ts` que valide todas las variables requeridas al arrancar.

```ts
// Al inicio de auth.ts o en env-validation.ts
const requiredEnvVars = [
  'EMAIL_SERVER_HOST', 'EMAIL_SERVER_PORT',
  'EMAIL_SERVER_USER', 'EMAIL_SERVER_PASSWORD', 'EMAIL_FROM',
];
for (const key of requiredEnvVars) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}
```

---

#### H-140-3 — `requireSession()` sin `try/catch` alrededor de `auth()`
- **Severidad**: Mejora
- **Origen**: OP-143
- **Fichero**: `src/lib/api-auth.ts` (línea ~36)
- **Descripción**: `requireSession()` no envuelve `await auth()` en un bloque `try/catch`. Si `auth()` lanza una excepción (por ejemplo, la BD cae durante la lectura de la sesión desde el adapter), la excepción se propaga al handler y Next.js responde con un 500 genérico no controlado.
- **Riesgo**: Un fallo puntual de BD al leer la sesión genera un 500 no gestionado en lugar de una respuesta controlada. No hay fuga de información (Next.js no expone el stack), pero la respuesta es menos precisa que un 503 con mensaje claro.
- **Propuesta para OP-160**: Envolver `await auth()` en `try/catch` y devolver un `NextResponse` con status 503 o 500 y mensaje genérico controlado.

```ts
export async function requireSession(): Promise<AuthResult> {
  let session: Session | null;
  try {
    session = await auth();
  } catch {
    return {
      session: null,
      error: NextResponse.json({ error: "Error de servidor" }, { status: 503 }),
    };
  }
  // ...
}
```

---

#### H-140-4 — Inconsistencia tipo/runtime cuando el enriquecimiento de sesión falla
- **Severidad**: Observación
- **Origen**: OP-142
- **Fichero**: `src/lib/auth.ts` (líneas ~79-98), `src/domain/types/next-auth.d.ts`
- **Descripción**: `next-auth.d.ts` declara `id`, `role` y `name` como no opcionales en `Session.user`. Sin embargo, si el bloque `catch` del callback `session` se activa (fallo de BD durante enriquecimiento), esos campos no se asignan y quedan como `undefined` en runtime. TypeScript no lo detecta porque el tipo ya está declarado como no opcional.
- **Riesgo**: Código que accede a `session.user.id` o `session.user.role` asume que son `string`/`UserRole` y no comprueba undefined. Si el enriquecimiento falla de forma silenciosa, puede provocar errores en tiempo de ejecución difíciles de trazar. El riesgo es bajo en condiciones normales (el fallo de BD es transitorio), pero es una inconsistencia estructural.
- **Propuesta para OP-160**: Opción A — marcar `id`, `role` y `name` como opcionales en `next-auth.d.ts` y añadir guards en el código que los consume. Opción B — si el enriquecimiento falla, invalidar la sesión en lugar de devolverla incompleta. La opción B es más segura pero más invasiva.

---

#### H-140-5 — `callbackUrl` sin validación propia en la app
- **Severidad**: Observación
- **Origen**: OP-144
- **Fichero**: `src/app/(auth)/login/page.tsx` (línea ~22)
- **Descripción**: `callbackUrl` se lee de `useSearchParams()` y se pasa directamente a `signIn("email", { callbackUrl })` sin ninguna validación en la app. La protección contra open redirect recae exclusivamente en NextAuth v5, que valida el `callbackUrl` contra `NEXTAUTH_URL`.
- **Riesgo**: Si `NEXTAUTH_URL` no está correctamente configurado en producción (o no está definido), la validación del framework puede ser más laxa y permitir redirecciones a orígenes externos. Riesgo bajo si el despliegue es correcto, pero sin capa defensiva propia en la app.
- **Propuesta para OP-160**: Añadir validación simple en la app que garantice que `callbackUrl` es una ruta relativa (empieza por `/`) antes de pasarlo a `signIn`. Alternativa: documentarlo explícitamente como requisito de despliegue en `NEXTAUTH_URL`.

```ts
// Validación defensiva simple
const safeCallbackUrl = callbackUrl?.startsWith('/') ? callbackUrl : '/';
```

---

#### H-140-6 — `dbUser` null en `session` deja sesión sin enriquecimiento
- **Severidad**: Observación
- **Origen**: OP-142
- **Fichero**: `src/lib/auth.ts` (líneas ~86-91)
- **Descripción**: Si `dbUser` es `null` (usuario eliminado directamente de BD después de que su sesión quedara almacenada en NextAuth), el callback `session` no asigna `id`, `role` ni `name`. La sesión sigue siendo técnicamente válida en el adapter de NextAuth, pero los campos del dominio están vacíos.
- **Riesgo**: Muy bajo en una app interna donde los usuarios se desactivan (no se eliminan) — y H-140-1 propone verificar `isActive` que mitigaría también este caso. Sin embargo, un usuario eliminado directamente de BD podría seguir con una sesión de NextAuth válida indefinidamente.
- **Propuesta para OP-160**: Si `dbUser` es `null` tras la query en el callback `session`, tratar como si `isActive` fuera falso (mismo comportamiento que H-140-1). La corrección de H-140-1 cubre parcialmente este caso si se añade la verificación correcta.

---

#### H-140-7 — `<Suspense>` sin `fallback` en layout de auth
- **Severidad**: Observación
- **Origen**: OP-144
- **Fichero**: `src/app/(auth)/layout.tsx` (línea ~15)
- **Descripción**: El `<Suspense>` que envuelve los hijos del layout de auth no tiene prop `fallback`. Durante la hidratación SSR→cliente, Next.js renderiza `null` para el subtree suspendido, lo que puede causar un flash de pantalla vacía.
- **Riesgo**: Sin impacto de seguridad ni funcional. Es una observación de UX: el usuario puede ver un parpadeo antes de que la página se hidrate completamente.
- **Propuesta para OP-160**: Añadir un `fallback` mínimo, como un spinner o un div vacío con altura fija, para evitar el flash.

```tsx
<Suspense fallback={<div className="flex-1" />}>{children}</Suspense>
```

---

### Candidatos revisados — sin hallazgo

Los siguientes puntos identificados en el diseño de specs fueron revisados durante la ejecución y **no generaron hallazgo**:

| Candidato | Resultado | Justificación |
|---|---|---|
| Race condition en `getMongoClient()` al crear dos `MongoClient` concurrentes | Sin hallazgo | La promesa se asigna a `cached.promise` antes de `await`, por lo que llamadas concurrentes comparten la misma `Promise`. No hay ventana de doble creación. |
| `MONGODB_URI` con valor vacío `""` pasa el `if (!MONGODB_URI)` | Sin hallazgo | `""` es falsy en JavaScript — el `if (!MONGODB_URI)` lo detecta y lanza error. |
| `dbUser.role as UserRole` enmascara `undefined` | Sin hallazgo | El schema Mongoose tiene `default: "user"` y `enum: ["user","admin"]`, garantizando que el campo siempre tiene valor en documentos válidos. El cast es seguro para el estado actual de la BD. |
| `login/error/page.tsx` no lee `?error=` — ¿es intencional? | Confirmado correcto | La página ignora completamente el parámetro de la URL, evitando reflected XSS. Comportamiento intencional y correcto. |
| `window.location.href` en lugar de `router.push()` | Sin hallazgo | Funcional, sin impacto de seguridad. Observación de estilo documentada pero no clasificada como hallazgo. |
