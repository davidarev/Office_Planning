# OP-113 — Revisar schema Reservation

## Contexto
El schema Mongoose `Reservation` está definido en `src/lib/models/reservation.model.ts` y se basa en la interfaz `IReservation` de `src/domain/types/reservation.ts`. Es el schema más crítico del sistema: implementa las garantías de concurrencia mediante índices únicos parciales. Esta subtarea forma parte de la auditoría OP-110 y no implica cambios en el código.

## Objetivo
Verificar que `ReservationSchema` es correcto y que los índices únicos parciales garantizan correctamente las reglas de negocio: una mesa no puede tener más de una reserva confirmada por día, y un usuario no puede tener más de una reserva confirmada por día. Identificar cualquier gap de cobertura o inconsistencia con `README.md §8`.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-115 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Campos del schema
- `userId`: ObjectId ref `"User"`, required — verificar que no puede ser nulo
- `tableId`: ObjectId ref `"Table"`, required — verificar que no puede ser nulo
- `date`: Date, required — verificar si hay normalización a 00:00 UTC (crítico para los índices únicos)
- `status`: enum `["confirmed", "cancelled"]`, default `"confirmed"` — verificar coherencia con `ReservationStatus`

### Índices únicos parciales (críticos)
- `{ tableId: 1, date: 1 }` con `partialFilterExpression: { status: "confirmed" }` — garantiza 1 reserva confirmada por mesa/día
- `{ userId: 1, date: 1 }` con `partialFilterExpression: { status: "confirmed" }` — garantiza 1 reserva confirmada por usuario/día
- `{ date: 1 }` — índice simple para queries por fecha

### Análisis de los índices parciales
- Verificar que `partialFilterExpression: { status: "confirmed" }` es suficiente para el modelo de concurrencia
- Evaluar si MongoDB garantiza atomicidad ante inserciones simultáneas con estos índices
- Verificar que las reservas canceladas no bloquean nuevas reservas (comportamiento correcto)
- Evaluar si se necesita un índice adicional en `{ userId: 1 }` para queries de reservas de un usuario

### Normalización de fechas
- El campo `date` debe almacenarse siempre como medianoche UTC (00:00:00.000Z) para que los índices únicos funcionen correctamente
- Verificar si esta normalización se hace en el schema (no existe `set`), en el servicio o en el repositorio
- Si no hay normalización garantizada, los índices únicos podrían fallar (dos fechas del mismo día con diferentes horas serían distintas)

### Timestamps
- `timestamps: true` — verificar coherencia con `IReservation` que declara `createdAt` y `updatedAt`

### Coherencia con tipos
- Verificar que todos los campos de `IReservation` tienen correspondencia en el schema
- Verificar que el enum `status` coincide con `ReservationStatus = "confirmed" | "cancelled"`

## Casos límite
- Dos reservas simultáneas para la misma mesa el mismo día — los índices únicos deben rechazar la segunda
- Fecha con componente horario no nulo — podría romper la unicidad del índice
- Reserva cancelada seguida de nueva reserva para la misma mesa/día — debe ser posible
- Usuario que intenta reservar mesa bloqueada — responsabilidad del servicio, no del schema

## Criterios de aceptación
- AC-1: Verificar que los dos índices únicos parciales están correctamente definidos y cubren las reglas de negocio
- AC-2: Verificar que la normalización de fechas a 00:00 UTC está garantizada en alguna capa del sistema
- AC-3: Verificar coherencia entre `status` enum y `ReservationStatus`
- AC-4: Verificar que los índices existentes cubren los patrones de consulta principales (por fecha, por usuario, por mesa)
- AC-5: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-115
- Sin modificaciones al código fuente

---

## Execution Result

- **Fecha**: 2026-04-07
- **Rama**: develop
- **Commit**: cc05e13
- **AI-assisted**: sí (Claude Sonnet 4.6)

### Estado de criterios de aceptación

| AC | Estado | Notas |
|----|--------|-------|
| AC-1 | PASS | Ambos índices únicos parciales (`{ tableId, date }` y `{ userId, date }`) con `partialFilterExpression: { status: "confirmed" }` están correctamente definidos y cubren las dos reglas de negocio. Las reservas canceladas no bloquean nuevas reservas. MongoDB garantiza atomicidad ante inserciones simultáneas. |
| AC-2 | PASS con hallazgo | `normalizeDate()` existe en `src/lib/dates.ts` y se aplica consistentemente en servicio y repositorio. Sin embargo, el schema no tiene `set: normalizeDate` como última barrera de defensa. Si el repositorio se llama directamente con fecha no normalizada, los índices podrían fallar. Registrado como H-113-1 (Mejora). |
| AC-3 | PASS | `ReservationStatus = "confirmed" \| "cancelled"` coincide exactamente con `enum: ["confirmed", "cancelled"]` del schema. |
| AC-4 | PASS con hallazgos | Índice en `{ date: 1 }` para queries por fecha. Sin índice simple en `{ userId: 1 }` ni `{ tableId: 1 }` para historial completo. Registrados como H-113-2 y H-113-3 (Observaciones). |
| AC-5 | PASS | 4 hallazgos documentados con severidad en `.ai/reports/OP-110-findings.md`. |

### Hallazgos registrados

| ID | Severidad | Descripción |
|----|-----------|-------------|
| H-113-1 | Mejora | Sin `set: normalizeDate` en el campo `date` del schema — normalización depende de capas superiores |
| H-113-2 | Observación | Sin índice simple en `{ userId: 1 }` para historial de reservas de un usuario |
| H-113-3 | Observación | Sin índice simple en `{ tableId: 1 }` para historial de reservas de una mesa |
| H-113-4 | Observación | `status` sin `required: true` — inconsistencia de estilo con otros campos con default |

### Ficheros revisados
- `src/lib/models/reservation.model.ts` (solo lectura)
- `src/domain/types/reservation.ts` (solo lectura)
- `src/lib/dates.ts` (solo lectura)
- `src/services/reservation.service.ts` (solo lectura)
- `src/lib/db/reservation.repository.ts` (solo lectura)
- `README.md §8` (referencia funcional)

### Verify
- lint: FAIL preexistente (`.obsidian/` no ignorado, no relacionado con OP-113)
- test:unit: PASS (69 tests)
- test:integration: PASS (80 tests)
- test:api: PASS (73 tests)
- Sin modificaciones al código fuente
