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
