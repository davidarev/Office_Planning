# OP-130 — Informe de hallazgos: API routes y middleware

## Resumen ejecutivo

La capa de API routes y middleware presenta un **nivel de seguridad sólido**. No se han encontrado hallazgos bloqueantes en ninguna de las cinco subtareas de auditoría (OP-131 a OP-135).

Los endpoints protegen correctamente sus recursos mediante `requireSession()`, no exponen información interna en errores, y el middleware cubre todos los escenarios de acceso sin posibilidad de bypass conocida.

Los hallazgos se concentran en **mejoras de mantenibilidad y robustez** (constantes duplicadas, validación incompleta de formato de fecha en un endpoint, campos redundantes en la respuesta de mesas) y **observaciones de diseño** sin impacto funcional ni de seguridad.

**Resumen cuantitativo**:
- Hallazgos totales: 27
- Bloqueantes: 0
- Mejoras: 6
- Observaciones: 21

---

## Hallazgos por fichero

### api/reservations/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-131-1 | Mejora | POST /api/reservations — `date` no se valida con `isValidDateString`. Solo se verifica que sea `typeof string`. Un valor como `"hola"` pasa la validación del route (aunque el servicio lo rechazaría internamente). Inconsistente con la validación del GET del mismo fichero. | Añadir `isValidDateString(date)` en la validación del POST en OP-161. |
| H-131-2 | Observación | `HTTP_STATUS` está definido por duplicado en `route.ts` y `[id]/route.ts`. Candidato a centralizar en módulo compartido. | Extraer a `src/lib/http-status.ts` o equivalente en OP-161. |

### api/reservations/[id]/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-131-3 | Observación | `requireSession()` presente y funcional. `userId` y `role` se obtienen de `session.user` — nunca del body. Sin hallazgos de autorización. | — |

### api/reservations/week/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-131-4 | Observación | `requireSession()` presente y funcional. Validación de `start` y `end` con `isValidDateString`. Sin hallazgos. | — |

### api/availability/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-132-01 | Observación | `requireSession()` protege correctamente el endpoint. Sin hallazgos de autenticación. | — |
| H-132-02 | Observación | `isValidDateString` valida correctamente: ausente → 400, formato inválido → 400, fechas imposibles (ej. `2026-02-30`, `2024-13-01`) → 400. Implementación robusta con roundtrip check. | — |
| H-132-03 | Observación | No hay validación de fechas pasadas. El endpoint acepta `date=2020-01-01`. Correcto según producto: la UI puede necesitar visualizar histórico. No es un defecto de seguridad. | Confirmar si restricción de fechas pasadas es requisito de negocio en OP-161. |
| H-132-04 | Observación | El bloque `catch` no expone detalles internos. Devuelve 500 con mensaje genérico. Correcto. | — |
| H-132-05 | Observación | La respuesta incluye `reservation.userId` y `assignedUser._id`. Son IDs de usuario expuestos a cualquier sesión autenticada. Funcional para el producto, pero evaluar si la UI necesita los IDs o solo el nombre. | Evaluar en OP-161 si `userId` / `assignedUser._id` deben omitirse de la respuesta pública. |

### api/availability/week/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-132-06 | Observación | `requireSession()` protege correctamente el endpoint. Sin hallazgos de autenticación. | — |
| H-132-07 | Observación | `isValidDateString` valida `start` y `end` por separado correctamente. Ausente o inválido → 400 con mensaje descriptivo. | — |
| H-132-08 | Observación | La validación de orden `start > end` → 400 funciona correctamente. `start === end` (rango de 1 día) es válido y permitido. | — |
| H-132-09 | Mejora | `MAX_RANGE_DAYS = 14` con check `diffDays > 14` permite un rango inclusivo de 15 días. Si el producto define "2 semanas" como 14 días inclusivos, hay inconsistencia semántica entre el nombre de la constante y su comportamiento real. | Cambiar la constante a `MAX_RANGE_DAYS = 15` o ajustar la condición a `>= MAX_RANGE_DAYS` en OP-161. |
| H-132-10 | Mejora | `MAX_RANGE_DAYS = 14` está definido por duplicado en `api/availability/week/route.ts` y `api/reservations/week/route.ts`. | Extraer a constante compartida en `src/lib/constants.ts` en OP-161. |
| H-132-11 | Observación | El bloque `catch` no expone detalles internos. Devuelve 500 con mensaje genérico. Correcto. | — |
| H-132-12 | Observación | `normalizeDate` normaliza a UTC midnight. Sin riesgo de comparación incorrecta por zona horaria. | — |
| H-132-13 | Observación | No hay validación de fechas pasadas en el rango. Mismo análisis que H-132-03. | Confirmar junto a H-132-03 en OP-161. |

### api/tables/route.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-133-01 | Observación | `requireSession()` presente y funcional. Sin hallazgos de autenticación. | — |
| H-133-02 | Observación | Sin parámetros de entrada — sin superficie de inyección. Delegación limpia a `getTablesWithBasicInfo()`. Sin lógica de negocio en el route. | — |
| H-133-03 | Observación | Bloque `catch` no expone detalles internos. Devuelve 500 con mensaje genérico. Correcto. | — |
| H-133-04 | Mejora | `TablePublic.assignedTo` expone el ID del usuario asignado a cualquier sesión autenticada. La UI solo necesita saber si la mesa tiene usuario asignado, no el ID interno. | Evaluar en OP-161 si `assignedTo` debe omitirse o sustituirse por `hasAssignedUser: boolean`. |
| H-133-05 | Mejora | `TablePublic.isActive` siempre es `true` en la respuesta (`listActiveTables()` ya filtra `isActive: true` en la query). Campo redundante que aumenta el payload sin aportar valor al cliente. | Eliminar `isActive` de `TablePublic` en OP-161. |
| H-133-06 | Observación | Las mesas inactivas se filtran correctamente en el repositorio. No aparecen en la respuesta. | — |

### proxy.ts (middleware)

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-134-01 | Observación | Matcher excluye correctamente `api/`, `_next/static`, `_next/image`, `favicon.ico`. `/api/auth/*` también excluido — correcto, NextAuth gestiona sus propias rutas. | — |
| H-134-02 | Observación | `/admin` y `/admin/*` protegidos correctamente: sin sesión → redirect a `/login?callbackUrl=<pathname>`; con sesión sin rol `admin` → redirect a `/`. Orden de condiciones correcto. | — |
| H-134-03 | Observación | `session.user.role` proviene del callback `session` en `auth.ts` (consulta BD en cada refresco). El cliente no puede manipularlo. Si el callback falla, `role` queda `undefined` → `!== "admin"` es `true` → redirect a `/`. Seguro por defecto. | — |
| H-134-04 | Observación | Rutas privadas sin sesión redirigen correctamente a `/login?callbackUrl=<pathname>`. `/login/verify` y `/login/error` tratadas como `isAuthPage`. | — |
| H-134-05 | Observación | Sin riesgo de open redirect: `callbackUrl` construido desde `nextUrl.pathname` (siempre ruta relativa). NextAuth v5 valida internamente same-origin. | — |
| H-134-06 | Observación | `pathname.startsWith("/admin")` capturaría hipotéticamente rutas como `/administrator`. Sin impacto actual (no existe esa ruta). Observación de robustez a futuro. | Si se añaden rutas con prefijo `/admin` que no sean admin, usar `/admin/` en el check. |
| H-134-07 | Observación | `/login/verify` y `/login/error` cubiertas por `startsWith("/login")`. Correcto: son páginas del flujo de auth y no deben requerir sesión. | — |

### Exposición de datos internos (transversal)

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-135-01 | Observación | Todos los bloques `catch` en los 6 route handlers usan `catch {}` (sin variable). El error es estructuralmente imposible de incluir en la respuesta. | — |
| H-135-02 | Observación | Sin ningún `console.log`, `console.error` ni equivalente en `src/` (excluyendo tests). Sin riesgo de logging inseguro en producción. Los errores se silencian completamente — útil para seguridad, pero dificulta diagnóstico en producción. | — |
| H-135-03 | Observación | Mensajes de `result.message` del servicio son todos amigables y de negocio. Sin nombres de colecciones, stack traces ni detalles técnicos. | — |
| H-135-04 | Observación | Error E11000 de MongoDB interceptado en el servicio antes de llegar al route handler. `getDuplicateKeyMessage` usa `err.message` solo internamente para discriminar el tipo de conflicto — el mensaje original de MongoDB nunca llega al cliente. | — |
| H-135-05 | Mejora | `getDuplicateKeyMessage` discrimina el tipo de conflicto E11000 por texto de `err.message` (`includes("userId")` / `includes("tableId")`). Frágil ante cambios en el formato de mensajes de error de MongoDB en upgrades mayores. | En OP-161, evaluar sustituir por inspección de `err.keyPattern` (disponible en `MongoServerError`). |
| H-135-06 | Observación | El middleware `proxy.ts` no genera respuestas de error directas — solo `NextResponse.redirect`. Sin exposición de datos internos. | — |

---

## Hallazgos bloqueantes

**Ninguno.** La capa de API routes y middleware no presenta defectos que comprometan la seguridad, la integridad de datos ni el correcto funcionamiento del producto.

---

## Mejoras recomendadas

Ordenadas por impacto estimado para OP-161:

| ID | Fichero | Descripción |
|----|---------|-------------|
| H-131-1 | `api/reservations/route.ts` | POST sin `isValidDateString` en `date` — inconsistente con el GET del mismo fichero y con el resto de endpoints. |
| H-133-04 | `api/tables/route.ts` + `services/table.service.ts` | `TablePublic.assignedTo` expone ID de usuario — evaluar si sustituir por `hasAssignedUser: boolean`. |
| H-133-05 | `services/table.service.ts` | `TablePublic.isActive` siempre `true` — campo redundante, eliminar. |
| H-132-10 | `api/availability/week/route.ts` + `api/reservations/week/route.ts` | `MAX_RANGE_DAYS` duplicado en dos ficheros — extraer a constante compartida. |
| H-132-09 | `api/availability/week/route.ts` | Inconsistencia semántica: `MAX_RANGE_DAYS = 14` permite 15 días inclusivos. |
| H-135-05 | `services/reservation.service.ts` | `getDuplicateKeyMessage` discrimina por texto de `err.message` — evaluar `keyPattern` para mayor robustez. |

---

## Observaciones

Aspectos a tener en cuenta en fases futuras sin requerir acción inmediata:

| ID | Fichero | Descripción |
|----|---------|-------------|
| H-131-2 | `api/reservations/route.ts` + `api/reservations/[id]/route.ts` | `HTTP_STATUS` duplicado — centralizar en módulo compartido. |
| H-132-03 | `api/availability/route.ts` | Sin restricción de fechas pasadas — confirmar si es requisito de negocio. |
| H-132-05 | `api/availability/route.ts` | Respuesta incluye `reservation.userId` y `assignedUser._id` — evaluar si los IDs son necesarios. |
| H-132-13 | `api/availability/week/route.ts` | Sin restricción de fechas pasadas en rango — mismo análisis que H-132-03. |
| H-134-06 | `proxy.ts` | `startsWith("/admin")` capturaría `/administrator` — sin impacto actual, observación de robustez. |
| H-135-02 | `src/app/api/*` + `src/services/*` | Sin logging de errores en producción — correcto para seguridad, pero dificulta diagnóstico. |
