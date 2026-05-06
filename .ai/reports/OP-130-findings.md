# OP-130 — Informe de hallazgos: API routes y middleware

## Resumen ejecutivo

> **Estado**: En construcción. Este informe se construye incrementalmente a medida que avanzan las subtareas OP-131 a OP-135.

<!-- Completar en OP-136 con el estado general consolidado -->

---

## Hallazgos por fichero

### api/availability/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-132-01 | Observación | `requireSession()` protege correctamente el endpoint. Sin hallazgos de autenticación. | — |
| H-132-02 | Observación | `isValidDateString` valida correctamente: ausente → 400, formato inválido → 400, fechas imposibles (ej. `2026-02-30`, `2024-13-01`) → 400. Implementación robusta con roundtrip check. | — |
| H-132-03 | Observación | No hay validación de fechas pasadas. El endpoint acepta `date=2020-01-01`. Correcto según producto: la UI puede necesitar visualizar histórico. No es un defecto de seguridad. | Confirmar si restricción de fechas pasadas es requisito de negocio en OP-161. |
| H-132-04 | Observación | El bloque `catch` no expone detalles internos. Devuelve 500 con mensaje genérico `"Error al calcular la disponibilidad"`. Correcto. | — |
| H-132-05 | Observación | La respuesta incluye `reservation.userId` (ID del usuario que reservó) y `assignedUser._id`. Son datos internos de usuario expuestos a cualquier sesión autenticada. Funcional para el producto, pero evaluar si la UI necesita los IDs o solo el nombre. | Evaluar en OP-161 si `userId` / `assignedUser._id` deben omitirse de la respuesta pública. |

### api/availability/week/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-132-06 | Observación | `requireSession()` protege correctamente el endpoint. Sin hallazgos de autenticación. | — |
| H-132-07 | Observación | `isValidDateString` valida `start` y `end` por separado correctamente. Ausente o inválido → 400 con mensaje descriptivo. | — |
| H-132-08 | Observación | La validación de orden `start > end` → 400 funciona correctamente. `start === end` (rango de 1 día) es válido y permitido. | — |
| H-132-09 | Mejora | `MAX_RANGE_DAYS = 14` con check `diffDays > 14` permite un rango inclusivo de 15 días (Jan 1 a Jan 15 = diff 14 = ALLOWED). Si el producto define "2 semanas" como 14 días inclusivos, el límite real es 15 — inconsistencia semántica en el nombre de la constante. No es bloqueante pero puede ser confuso al mantener el código. | Cambiar la constante a `MAX_RANGE_DAYS = 15` o ajustar la condición a `>= MAX_RANGE_DAYS` para que el nombre coincida con el comportamiento real. |
| H-132-10 | Mejora | `MAX_RANGE_DAYS = 14` está definido por duplicado: en `api/availability/week/route.ts` y en `api/reservations/week/route.ts`. Si se cambia el límite hay que actualizarlo en dos sitios. | Extraer a una constante compartida en `src/lib/constants.ts` o `src/domain/constants.ts`. |
| H-132-11 | Observación | El bloque `catch` no expone detalles internos. Devuelve 500 con mensaje genérico. Correcto. | — |
| H-132-12 | Observación | `normalizeDate` normaliza correctamente a UTC midnight. No hay riesgo de comparación incorrecta por zona horaria en la validación de rango. | — |
| H-132-13 | Observación | No hay validación de fechas pasadas en el rango. Mismo análisis que H-132-03: no es defecto de seguridad. | Confirmar junto a H-132-03 en OP-161. |

---

<!-- Secciones pendientes de completar en subtareas OP-131, OP-133, OP-134, OP-135 -->

### api/reservations/route.ts
<!-- Pendiente: OP-131 -->

### api/reservations/[id]/route.ts
<!-- Pendiente: OP-131 -->

### api/reservations/week/route.ts
<!-- Pendiente: OP-131 -->

### api/tables/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-133-01 | Observación | `requireSession()` presente y funcional. Devuelve 401 sin sesión. Sin hallazgos de autenticación. | — |
| H-133-02 | Observación | El handler no acepta parámetros — sin superficie de inyección. Delegación limpia a `getTablesWithBasicInfo()`. Sin lógica de negocio en el route. | — |
| H-133-03 | Observación | El bloque `catch` no expone detalles internos. Devuelve 500 con mensaje genérico `"Error al obtener las mesas"`. Correcto. | — |
| H-133-04 | Mejora | `TablePublic` incluye `assignedTo: string \| null` (ID del usuario asignado). Expone un ID de usuario a cualquier sesión autenticada. La UI solo necesita saber si la mesa tiene usuario asignado, no el ID interno. La relación usuario←→mesa preferente ya está disponible vía `/api/availability`. | Evaluar en OP-161 si `assignedTo` debe omitirse o sustituirse por un campo booleano `hasAssignedUser`. |
| H-133-05 | Mejora | `TablePublic` incluye `isActive: boolean`. Como `listActiveTables()` ya filtra `isActive: true` en la query, este campo siempre vale `true` en la respuesta — información redundante que aumenta el payload sin aportar valor al cliente. | Eliminar `isActive` de `TablePublic` en OP-161, ya que la respuesta siempre contiene solo mesas activas. |
| H-133-06 | Observación | Las mesas inactivas se filtran correctamente en el repositorio (`isActive: true`). No aparecen en la respuesta. | — |

### proxy.ts (middleware)

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-134-01 | Observación | Matcher `/((?!api/\|_next/static\|_next/image\|favicon.ico).*)` excluye correctamente todas las rutas de API y assets estáticos. `/api/auth/*` también queda excluido, lo cual es correcto: NextAuth gestiona sus propias rutas. | — |
| H-134-02 | Observación | Rutas `/admin` y `/admin/*` protegidas correctamente: sin sesión → redirect a `/login?callbackUrl=<pathname>`; con sesión pero sin rol `admin` → redirect a `/`. El orden de condiciones es correcto. | — |
| H-134-03 | Observación | `session.user.role` proviene exclusivamente del callback `session` en `auth.ts`, que consulta la BD en cada refresco. El cliente no puede manipularlo. Si el callback falla (bloque catch silencioso), `role` queda `undefined` → condición `!== "admin"` es `true` → redirect a `/`. Comportamiento seguro por defecto. | — |
| H-134-04 | Observación | Todas las rutas privadas sin sesión (distintas de `/login*` y `/api/*`) redirigen correctamente a `/login?callbackUrl=<pathname>`. La rama final `!isAuthenticated && !isAuthPage` cubre el caso general. | — |
| H-134-05 | Observación | No existe riesgo de open redirect: `callbackUrl` se construye desde `nextUrl.pathname`, que es siempre una ruta relativa (el objeto URL de Next.js nunca incluye el host en `.pathname`). NextAuth v5 además valida internamente que el callbackUrl sea same-origin. | — |
| H-134-06 | Observación | `pathname.startsWith("/admin")` capturaría hipotéticamente rutas como `/administrator`. No existe ninguna ruta con ese prefijo en el proyecto actualmente, por lo que no hay impacto. Es una observación de robustez para cuando se añadan nuevas rutas. | En el futuro, si se añaden rutas con prefijo `/admin` que no sean sección de administración, usar `/admin/` en lugar de `/admin` para el check. |
| H-134-07 | Observación | `/login/verify` y `/login/error` se tratan como `isAuthPage = true` (quedan cubiertas por `startsWith("/login")`). Correcto: son páginas del flujo de autenticación y no deben requerir sesión. | — |

### Exposición de datos internos (transversal)

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-135-01 | Observación | Todos los bloques `catch` en los 6 route handlers usan `catch {}` (sin variable de error). El error capturado es estructuralmente imposible de incluir en la respuesta. Todos devuelven 500 con mensaje genérico. PASS completo. | — |
| H-135-02 | Observación | No existe ningún `console.log`, `console.error` ni equivalente en ningún fichero de `src/` (excluyendo tests). No hay riesgo de exposición de datos sensibles en logs de producción (Vercel logs). | — |
| H-135-03 | Observación | Los mensajes de `result.message` del servicio son todos mensajes de negocio amigables. Ninguno contiene detalles técnicos, nombres de colecciones, rutas ni stack traces. | — |
| H-135-04 | Observación | El error E11000 de MongoDB es interceptado en `reservation.service.ts` antes de llegar al route handler. `getDuplicateKeyMessage` lee `err.message` internamente solo para discriminar entre dos tipos de conflicto (`userId` / `tableId`) y devuelve siempre un mensaje amigable. El mensaje original de MongoDB nunca llega al cliente. | — |
| H-135-05 | Mejora | `getDuplicateKeyMessage` lee `err.message` del error de MongoDB para discriminar el tipo de conflicto. Si en algún momento MongoDB cambia el formato del mensaje de error (poco probable pero posible tras upgrades mayores), la lógica de discriminación podría fallar y caer en el fallback. Sería más robusto discriminar por el nombre del índice (`keyPattern`) en lugar del mensaje de texto. | En OP-161, evaluar sustituir discriminación por `message.includes()` por inspección de `err.keyPattern` (disponible en errores MongoServerError). |
| H-135-06 | Observación | El middleware `proxy.ts` no genera respuestas de error directas — solo `NextResponse.redirect`. Las URLs de redirección se construyen con `new URL("/login", nextUrl)` y `pathname` relativo. Sin exposición de datos internos. | — |

---

## Hallazgos bloqueantes

> Ninguno identificado en OP-132. Los endpoints de disponibilidad están correctamente protegidos y validan las entradas de forma robusta.

<!-- Completar con hallazgos de OP-131, OP-133, OP-134, OP-135 -->

---

## Mejoras recomendadas

| ID | Fichero | Descripción |
|----|---------|-------------|
| H-132-09 | `api/availability/week/route.ts` | Inconsistencia semántica en `MAX_RANGE_DAYS`: la constante dice 14 pero permite 15 días inclusivos. |
| H-132-10 | `api/availability/week/route.ts` + `api/reservations/week/route.ts` | `MAX_RANGE_DAYS` duplicado en dos ficheros — extraer a constante compartida. |
| H-133-04 | `api/tables/route.ts` + `services/table.service.ts` | `TablePublic.assignedTo` expone ID de usuario — evaluar si sustituir por booleano `hasAssignedUser`. |
| H-133-05 | `services/table.service.ts` | `TablePublic.isActive` siempre es `true` — campo redundante, eliminar de la respuesta. |

| H-135-05 | `services/reservation.service.ts` | `getDuplicateKeyMessage` discrimina el tipo de conflicto E11000 por texto de `err.message` — frágil ante cambios de formato en MongoDB. Evaluar discriminar por `keyPattern`. |

---

## Observaciones

| ID | Fichero | Descripción |
|----|---------|-------------|
| H-132-03 | `api/availability/route.ts` | No hay restricción de fechas pasadas. Confirmar si es requisito de negocio. |
| H-132-05 | `api/availability/route.ts` | Respuesta incluye `reservation.userId` y `assignedUser._id`. Evaluar si los IDs son necesarios en la respuesta pública. |
| H-132-13 | `api/availability/week/route.ts` | No hay restricción de fechas pasadas en rango. Mismo análisis que H-132-03. |
| H-134-06 | `proxy.ts` | `startsWith("/admin")` capturaría rutas como `/administrator`. Sin impacto actual pero frágil si se añaden nuevas rutas. |

| H-135-02 | `src/app/api/*` + `src/services/*` | Sin `console.log` ni logging de errores en producción — los errores se silencian completamente. Útil para seguridad, pero dificulta el diagnóstico en producción. |
