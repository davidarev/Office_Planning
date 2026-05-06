# OP-143 — Revisar auth-mongodb-client y api-auth

## Contexto
Dos módulos de infraestructura de autenticación complementan a `src/lib/auth.ts`:

- `src/lib/auth-mongodb-client.ts` — proporciona un `MongoClient` nativo cacheado para el `MongoDBAdapter` de NextAuth. Independiente de la conexión Mongoose (`connectDB`).
- `src/lib/api-auth.ts` — exporta `requireSession()`, helper que centraliza la comprobación de sesión en los API route handlers. Devuelve un discriminated union `{ session, error }` para evitar duplicar boilerplate en cada endpoint.

Esta subtarea forma parte de la auditoría OP-140 y no implica cambios en el código.

## Objetivo
Verificar que `auth-mongodb-client` implementa correctamente el singleton de `MongoClient` requerido por el adapter, y que `requireSession` centraliza la autenticación de API routes de forma segura, correcta y sin fugas de información.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### `auth-mongodb-client.ts` — singleton MongoClient

- ¿`MONGODB_URI` se comprueba en tiempo de módulo y lanza error si no está definida? ¿Es correcto hacer esto en módulo (vs. dentro de la función)?
- ¿El patrón singleton con `global.mongoClientCache` es el correcto para entornos Next.js con hot-reload? ¿Evita crear múltiples conexiones en desarrollo?
- ¿La función `getMongoClient()` es correctamente asíncrona y cachea tanto el `Promise<MongoClient>` como el `MongoClient` resuelto?
- ¿La condición `if (cached.client)` se evalúa antes de `if (!cached.promise)` — evita doble conexión en llamadas concurrentes al momento de la primera conexión?
- ¿`MONGODB_URI as string` es un cast seguro dado que ya se verificó que no es `undefined` líneas antes?
- ¿El tipo `MongoClientCache` cubre correctamente los estados posibles (sin conectar, conectando, conectado)?
- ¿Esta conexión es completamente independiente de `connectDB()` (Mongoose)? ¿Hay riesgo de que compartan estado o se interfieran?

### `api-auth.ts` — helper `requireSession`

- ¿`requireSession()` llama a `auth()` exportada desde `@/lib/auth` — es esta la función correcta de NextAuth v5 para obtener la sesión en server-side?
- ¿La comprobación `!session?.user?.id` es suficiente para garantizar que la sesión es válida? ¿Podría haber una sesión sin `id` pero con otros campos?
- ¿El mensaje de error `"No autorizado"` es genérico y no revela información interna?
- ¿El tipo `AuthResult` como discriminated union es correcto y aprovechable con type narrowing en los route handlers?
- ¿El status `401` es el código correcto para sesión ausente (vs. `403` para sesión presente pero sin permisos)?
- ¿La importación de `Session` desde `next-auth` recoge el tipo extendido definido en `next-auth.d.ts` (con `id`, `role`, `name`)?
- ¿Los route handlers que usan `requireSession()` acceden a `session.user.id` y `session.user.role` de forma segura después del narrowing?

### Aspectos transversales
- ¿Los dos módulos tienen JSDoc suficiente para entender su propósito y comportamiento?
- ¿Hay alguna dependencia circular entre `api-auth.ts` y `auth.ts`?
- ¿La arquitectura de separar el cliente del adapter del helper de sesión es clara y no genera confusión sobre qué usar en cada contexto?

## Casos límite
- Primera petición concurrente a `getMongoClient()` antes de que la promesa se resuelva — ¿se crean dos instancias o se reutiliza la misma promesa?
- `MONGODB_URI` definida pero con valor vacío (`""`) — ¿el `if (!MONGODB_URI)` la detecta?
- Sesión con `user.id` presente pero `user.role` ausente — ¿`requireSession()` la acepta y pasa un objeto de sesión incompleto a los handlers?
- `auth()` lanza excepción (BD caída durante lectura de sesión) — ¿`requireSession()` tiene manejo de errores o la excepción se propaga al handler?

## Criterios de aceptación
- AC-1: Verificar que `getMongoClient()` implementa correctamente el patrón singleton con `global` cache y evita múltiples conexiones en desarrollo (hot-reload)
- AC-2: Verificar que la validación de `MONGODB_URI` en tiempo de módulo es correcta y que el cast `as string` es seguro
- AC-3: Verificar que `requireSession()` usa `auth()` de NextAuth v5 correctamente y que la comprobación `!session?.user?.id` es suficiente para detectar sesiones inválidas
- AC-4: Verificar que el tipo `AuthResult` y el status 401 son correctos y coherentes con el uso en los route handlers
- AC-5: Verificar que `requireSession()` no tiene manejo de errores para excepción de `auth()` y documentar si esto es un riesgo
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación) para consolidar en OP-145

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados para su consolidación en OP-145
- Sin modificaciones al código fuente
