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
<!-- Pendiente: OP-133 -->

### middleware.ts (proxy)
<!-- Pendiente: OP-134 -->

### Exposición de datos internos (transversal)
<!-- Pendiente: OP-135 -->

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

<!-- Completar con mejoras de OP-131, OP-133, OP-134, OP-135 -->

---

## Observaciones

| ID | Fichero | Descripción |
|----|---------|-------------|
| H-132-03 | `api/availability/route.ts` | No hay restricción de fechas pasadas. Confirmar si es requisito de negocio. |
| H-132-05 | `api/availability/route.ts` | Respuesta incluye `reservation.userId` y `assignedUser._id`. Evaluar si los IDs son necesarios en la respuesta pública. |
| H-132-13 | `api/availability/week/route.ts` | No hay restricción de fechas pasadas en rango. Mismo análisis que H-132-03. |

<!-- Completar con observaciones de OP-131, OP-133, OP-134, OP-135 -->
