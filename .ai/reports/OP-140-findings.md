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
