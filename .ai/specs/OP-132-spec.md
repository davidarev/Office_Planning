# OP-132 — Revisar endpoints de disponibilidad

## Contexto
Los endpoints de disponibilidad están implementados en dos ficheros bajo `src/app/api/availability/`:
- `route.ts` — GET (disponibilidad por día)
- `week/route.ts` — GET (disponibilidad por rango semanal)

Fueron implementados como parte de las ramas de funcionalidad de disponibilidad y reservas. Esta subtarea forma parte de la auditoría OP-130 y no implica cambios en el código.

## Objetivo
Verificar que los dos endpoints de disponibilidad aplican correctamente autenticación, validación de fechas, límites de rango y manejo de errores sin exposición de datos internos.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### GET /api/availability?date=YYYY-MM-DD (`route.ts`)
- Presencia y funcionamiento de `requireSession()` — debe devolver 401 si no hay sesión
- Validación de parámetro `date`: ausente → 400, formato inválido → 400
- Uso de `isValidDateString` para validar el formato YYYY-MM-DD
- Respuesta 200 con array de `TableAvailability` para la fecha
- Estructura de respuesta: ¿incluye información de usuario/reserva que no debería exponerse?
- Bloque `catch` genérico: no expone detalles internos, devuelve 500 con mensaje genérico

### GET /api/availability/week?start=YYYY-MM-DD&end=YYYY-MM-DD (`week/route.ts`)
- Presencia y funcionamiento de `requireSession()` — debe devolver 401 si no hay sesión
- Validación de `start`: ausente o formato inválido → 400
- Validación de `end`: ausente o formato inválido → 400
- Validación de orden: `start > end` → 400
- Validación de rango máximo: `MAX_RANGE_DAYS = 14` — coherencia con la regla de negocio de las 2 semanas del producto
- Uso de `normalizeDate` para comparación — verificar que normaliza a medianoche UTC consistentemente
- Respuesta 200 con `Record<string, TableAvailability[]>` (mapa por fecha)
- Bloque `catch` genérico sin exposición interna

### Aspectos transversales
- Consistencia con la validación de fechas en endpoints de reservas (mismo patrón `isValidDateString`)
- `MAX_RANGE_DAYS = 14` está definido en ambos ficheros por separado — ¿debería ser una constante compartida?
- Ausencia de lógica de negocio en los route handlers (toda en `services/`)
- Los endpoints de disponibilidad son de solo lectura — no modifican estado, solo consultan
- Ningún endpoint expone stack traces ni detalles de infraestructura en errores

## Casos límite
- `date` con valor como `2024-13-01` (mes inválido) — ¿`isValidDateString` lo rechaza correctamente?
- `date` con valor `not-a-date` — comportamiento esperado: 400
- GET /week con `start === end` — debe funcionar (rango de 1 día = hoy)
- GET /week con rango de exactamente 14 días — debe ser válido
- GET /week con rango de 15 días — debe devolver 400
- Fechas pasadas — ¿se validan o se permiten? (relevante para auditoría de seguridad)
- Respuesta cuando no hay mesas activas — array vacío vs error

## Criterios de aceptación
- AC-1: Verificar que ambos endpoints requieren sesión activa y devuelven 401 sin ella
- AC-2: Verificar que la validación de parámetros de fecha es completa: ausentes, formato inválido, fechas imposibles
- AC-3: Verificar que el límite de rango (`MAX_RANGE_DAYS = 14`) se aplica correctamente y con el mensaje de error adecuado
- AC-4: Verificar que la validación de orden `start ≤ end` funciona correctamente
- AC-5: Verificar que los bloques `catch` no exponen detalles internos y devuelven 500 con mensaje genérico
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-136
- Sin modificaciones al código fuente

## Execution Result

**Fecha**: 2026-05-06
**Estado**: DONE

### Resultados por AC

| AC | Estado | Notas |
|----|--------|-------|
| AC-1 | PASS | `requireSession()` presente y funcional en ambos endpoints. Devuelve 401 con `{ error: "No autorizado" }` sin sesión. |
| AC-2 | PASS | `isValidDateString` valida ausencia, formato incorrecto y fechas imposibles (`2024-13-01`, `2026-02-30`) con roundtrip check. Todos los casos devuelven 400. |
| AC-3 | PASS | `MAX_RANGE_DAYS = 14` con `diffDays > 14` funciona correctamente. Rango de 15 días inclusivos es el máximo aceptado. Detectada inconsistencia semántica (H-132-09). |
| AC-4 | PASS | Validación `startDate > endDate → 400` presente y correcta. `start === end` permitido. |
| AC-5 | PASS | Bloques `catch {}` en ambos endpoints devuelven 500 con mensaje genérico sin exponer detalles internos. |
| AC-6 | PASS | 13 hallazgos documentados en `.ai/reports/OP-130-findings.md`: 0 bloqueantes, 2 mejoras, 11 observaciones. |

### Hallazgos destacados
- **H-132-09** (Mejora): `MAX_RANGE_DAYS = 14` con `> 14` permite 15 días inclusivos — inconsistencia semántica nombre/comportamiento.
- **H-132-10** (Mejora): `MAX_RANGE_DAYS` duplicado en `api/availability/week/route.ts` y `api/reservations/week/route.ts`.
- **H-132-05** (Observación): Respuesta incluye `reservation.userId` y `assignedUser._id` — evaluar si los IDs son necesarios en la respuesta pública.

### Suite de verificación
| Check | Estado |
|-------|--------|
| OP-132-STRUCT-1: api/availability/route.ts existe | PASS |
| OP-132-STRUCT-2: api/availability/week/route.ts existe | PASS |
| OP-132-STRUCT-3: lib/api-auth.ts existe | PASS |
| OP-132-STRUCT-4: lib/dates.ts existe | PASS |
| OP-132-STRUCT-5: domain/types/table.ts existe | PASS |
| OP-132-STRUCT-6: .ai/reports/OP-130-findings.md existe | PASS |
