# OP-124 — Revisar availability.service

## Contexto
`src/services/availability.service.ts` implementa el cálculo de disponibilidad de mesas para una fecha o rango de fechas. Es el servicio que determina qué ve el usuario en el plano: qué mesas están libres, ocupadas, preferentes o bloqueadas. Fue creado en la rama `04-availability-booking-concurrency`. Esta subtarea forma parte de la auditoría OP-120 y no implica cambios en el código.

## Objetivo
Verificar que la lógica de cálculo de estados (`green/yellow/red/gray`) es correcta según las reglas de `README.md`, que las prioridades de estado se aplican en el orden adecuado, que la resolución de nombres de usuario es eficiente (batch, sin N+1), y que el servicio maneja rangos de fechas correctamente.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-127 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### `computeStatus(table, reservation)` — lógica de prioridades
Orden actual de evaluación:
1. `!table.isActive` → `"gray"`
2. `table.type === "blocked"` → `"gray"`
3. `reservation !== null` → `"red"` (ocupada por reserva)
4. `table.type === "fixed"` → `"red"` (fija sin reserva explícita)
5. `table.type === "preferential"` → `"yellow"`
6. default → `"green"`

Verificar contra `README.md §6`:
- Mesa inactiva → gris ✓
- Mesa bloqueada → gris ✓
- Mesa con reserva confirmada → rojo ✓
- Mesa fija (sin reserva) → rojo ✓ (siempre ocupada por su asignado)
- Mesa preferente (sin reserva) → amarillo ✓
- Mesa libre → verde ✓

### `getTableAvailabilityForDate(date)`
- Consultas en paralelo (`Promise.all`) para tablas y reservas — verificar corrección
- Index de reservas por `tableId` para O(1) lookup — verificar que el key es correcto
- Resolución batch de nombres con `buildUserNameMap` — verificar que evita N+1
- Construcción del objeto `TableAvailability` — verificar que todos los campos están cubiertos
- Nota sobre tablas inactivas: solo se obtienen las activas via `listActiveTables()` — verificar coherencia con README.md

### `getTableAvailabilityForRange(start, end)`
- Consultas en paralelo para tablas y reservas del rango
- Index compuesto `tableId:date` para lookup en el rango — verificar corrección del key
- Iteración de fechas con cursor `while (cursor <= normalizedEnd)` — verificar que no produce bucle infinito en rangos válidos
- Reutilización de `buildUserNameMap` para todo el rango en batch
- Verificar que el resultado está keyed por `YYYY-MM-DD` consistentemente

### `buildUserNameMap(reservations, tables)`
- Recopila userIds de reservas **y** de `assignedTo` de tablas (para mesas fijas/preferentes)
- Llama a `getUserById` en paralelo para todos los IDs únicos
- Fallback `"Usuario desconocido"` si el usuario no existe

### `resolveUserName(userId)`
- Función simple que llama a `getUserById` — verificar que no se usa directamente para evitar N+1

## Casos límite
- `listActiveTables()` excluye tablas inactivas — si una mesa tiene reserva y luego se desactiva, no aparece en el plano (¿es el comportamiento esperado?)
- `getTableAvailabilityForRange` con rango de un solo día — debe devolver el mismo resultado que `getTableAvailabilityForDate`
- Rango muy amplio (ej. todo un año) — no hay límite en el código, puede ser un problema de rendimiento
- `assignedTo` puede ser `null` (mesa sin asignado) — verificar que `buildUserNameMap` no añade `null` al Set
- Mesa `fixed` sin `assignedTo` — `computeStatus` devuelve `"red"` pero `assignedUser` sería `null` — ¿inconsistente?
- `cursor.setUTCDate` para avanzar fechas — verificar corrección con meses de diferente longitud y cambios de horario

## Criterios de aceptación
- AC-1: Verificar que `computeStatus` aplica las prioridades en el orden correcto según README.md
- AC-2: Verificar que `buildUserNameMap` evita consultas N+1 correctamente
- AC-3: Verificar que el índice `tableId:date` en `getTableAvailabilityForRange` es correcto
- AC-4: Verificar que la iteración de fechas en el rango es correcta y no produce bucle infinito
- AC-5: Identificar casos límite donde el comportamiento podría ser inconsistente (ej. mesa fija sin `assignedTo`)
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-127
- Sin modificaciones al código fuente

---

## Execution result

**Fecha**: 2026-04-07
**Estado**: DONE

### Veredicto por AC

| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | `computeStatus` aplica las 6 prioridades en el orden exacto del README.md §6. |
| AC-2 | PASS | `buildUserNameMap` usa un Set de IDs únicos + `Promise.all` paralelo. Sin N+1. |
| AC-3 | PASS con mejora | Key `tableId:date` consistente cuando las fechas están normalizadas. Dependencia de H-121-1 documentada en H-124-2. |
| AC-4 | PASS | Iteración con `setUTCDate` segura en UTC. Sin bugs de DST ni bucle infinito. Rango de un día = `getTableAvailabilityForDate`. |
| AC-5 | PASS | 5 casos límite identificados y documentados (H-124-1 a H-124-5). |
| AC-6 | PASS | Hallazgos registrados en `.ai/reports/OP-120-findings.md` con severidad y acción sugerida. |

### Hallazgos registrados

| ID | Severidad | Resumen |
|----|-----------|---------|
| H-124-1 | Mejora | Mesa `fixed` sin `assignedTo`: estado `red` con `assignedUser=null` — combinación huérfana sin representación clara en UI. |
| H-124-2 | Mejora | Índice `tableId:date` en `getTableAvailabilityForRange` depende de normalización de `r.date`. Riesgo si H-121-1 no se corrige. |
| H-124-3 | Observación | Mesa desactivada con reserva activa desaparece del plano sin cancelar la reserva. |
| H-124-4 | Observación | Rango sin límite superior — potencial crecimiento de memoria para rangos muy amplios. |
| H-124-5 | Observación | `resolveUserName` sin protección contra uso en loops — posible N+1 si un caller futuro la usa incorrectamente. |

### Notas
- El servicio está bien estructurado y sigue las reglas de negocio correctamente.
- El hallazgo más relevante para OP-162 es H-124-1 (estado inconsistente en mesas fixed sin asignado).
- H-124-2 es dependiente de la corrección de H-121-1 y debe coordinarse en OP-162.
