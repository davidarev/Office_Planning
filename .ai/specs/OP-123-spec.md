# OP-123 — Revisar reservation.service

## Contexto
`src/services/reservation.service.ts` implementa la lógica de negocio de reservas: creación, cancelación y consulta. Es el servicio más crítico del proyecto porque contiene las reglas de dominio que garantizan la integridad de las reservas. Fue creado en la rama `04-availability-booking-concurrency`. Esta subtarea forma parte de la auditoría OP-120 y no implica cambios en el código.

## Objetivo
Verificar que el servicio implementa correctamente todas las reglas de dominio definidas en `README.md`: 1 reserva por usuario por día, 1 reserva por mesa por día, mesa bloqueada no reservable, mesa fija no reservable, cancelación solo por owner o admin, y manejo robusto de concurrencia.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-127 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Funciones de lectura
- `getReservationsForDay(date)` — normalización, delegación al repositorio, mapeo `toPublic`
- `getReservationsForRange(start, end)` — ídem para rango
- Verificar que no exponen datos internos (IDs como ObjectId, fechas como Date)

### `createReservation(userId, tableId, date)`
- **Orden de validaciones**: fecha → mesa existe → mesa activa → tipo no bloqueado → tipo no fijo → usuario sin reserva ese día → mesa sin reserva ese día → insert
- Verificar que el orden es coherente (falla rápido en casos comunes)
- Verificar que `"preferential"` es reservable (solo `"blocked"` y `"fixed"` no lo son)
- Verificar que `normalizeDate` se llama antes de las consultas al repositorio
- Verificar que `isValidDateString` valida correctamente el formato YYYY-MM-DD
- **Concurrencia**: después de las pre-checks, el insert puede fallar con E11000 — verificar que `isDuplicateKeyError` detecta correctamente el código `11000`
- Verificar que `getDuplicateKeyMessage` distingue conflicto de usuario vs mesa usando el mensaje del error

### `cancelReservation(userId, userRole, reservationId)`
- Verificar que se comprueba existencia de la reserva antes de cualquier otra operación
- Verificar que ya cancelada devuelve error (no permite doble cancelación)
- Verificar lógica de autorización: `isOwner || isAdmin`
- Verificar que `reservation.userId.toString() === userId` es seguro (ambos strings)
- Verificar que usa `markReservationCancelled` en lugar de borrar el documento

### Helpers privados
- `toPublic(reservation)` — conversión correcta de ObjectIds a string, fecha a ISO YYYY-MM-DD
- `isDuplicateKeyError(err)` — type narrowing sobre `unknown`
- `getDuplicateKeyMessage(err)` — detección por substring `"userId"` / `"tableId"` en el mensaje del error

### Reglas de dominio a verificar explícitamente
- 1 reserva/usuario/día: validación explícita + índice único como respaldo
- 1 reserva/mesa/día: validación explícita + índice único como respaldo
- Mesa `blocked` → no reservable
- Mesa `fixed` → no reservable
- Mesa `preferential` → reservable (sin restricción especial)
- Mesa `flexible` → reservable
- Solo owner o admin puede cancelar
- Reserva ya cancelada → error antes de volver a cancelar

## Casos límite
- `date` recibida como string YYYY-MM-DD no normalizada — ¿`normalizeDate` la trata correctamente?
- Dos requests concurrentes para la misma mesa/día — E11000 garantiza solo una tiene éxito
- `getDuplicateKeyMessage` usa substring del mensaje — ¿es suficientemente robusto o puede fallar con mensajes de error diferentes en distintas versiones de MongoDB?
- `cancelReservation` recibe `userRole: UserRole` — ¿qué pasa si llega un role desconocido?
- `getReservationById` usado en cancelación recupera reservas de cualquier estado — correcto para verificar si ya está cancelada

## Criterios de aceptación
- AC-1: Verificar que `createReservation` valida las reglas de dominio en el orden correcto
- AC-2: Verificar que `createReservation` maneja la concurrencia mediante E11000 como última barrera
- AC-3: Verificar que `cancelReservation` comprueba existencia, estado previo y autorización en ese orden
- AC-4: Verificar que `toPublic` serializa correctamente los campos (string IDs, fecha ISO sin hora)
- AC-5: Verificar que `isDuplicateKeyError` y `getDuplicateKeyMessage` son suficientemente robustos
- AC-6: Verificar que el servicio no hace acceso directo a MongoDB (solo usa funciones del repositorio)
- AC-7: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-127
- Sin modificaciones al código fuente

---

## Execution Result

- **Fecha**: 2026-04-07
- **Rama**: develop
- **Commit**: 543d2b4
- **AI-assisted**: sí (Claude Sonnet 4.6)

### Estado de criterios de aceptación

| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | Orden de validaciones correcto: fecha → mesa existe → isActive → tipo blocked → tipo fixed → usuario sin reserva → mesa sin reserva → insert. |
| AC-2 | PASS | E11000 capturado con `isDuplicateKeyError`. `getDuplicateKeyMessage` distingue conflicto usuario vs mesa. Dependencia del formato del mensaje de MongoDB documentada como H-123-2. |
| AC-3 | PASS | `cancelReservation` verifica existencia → estado previo → autorización en ese orden. |
| AC-4 | PASS | `toPublic` serializa correctamente: IDs como strings, fecha como YYYY-MM-DD via `toISOString().split("T")[0]`. |
| AC-5 | PASS con observación | `isDuplicateKeyError` robusto (type narrowing sobre `unknown`). `getDuplicateKeyMessage` funcional con dependencia implícita del formato de mensaje (H-123-2). |
| AC-6 | PASS | Sin acceso directo a MongoDB. Toda interacción a través de funciones de `@/lib/db`. |
| AC-7 | PASS | 5 hallazgos documentados en `.ai/reports/OP-120-findings.md` con severidad Observación. |

### Ficheros auditados
- `src/services/reservation.service.ts` — auditado, sin modificaciones
- `src/lib/dates.ts` — revisado para validar `normalizeDate` e `isValidDateString`
- `src/domain/types/reservation.ts`, `user.ts`, `table.ts`, `service.ts` — revisados para validar tipado

### Verify
- lint: sin errores en `src/` (errores en `.obsidian/` y `canvas-tool.py` son preexistentes y fuera de scope)
- tests: 222 passed (13 test files)
- build: fallo preexistente en `tests/helpers/factories.ts` (fuera del scope de esta tarea de auditoría)

### Hallazgos registrados
- H-123-1: Observación — sin validación de ObjectId para `userId`/`tableId` en `createReservation`
- H-123-2: Observación — `getDuplicateKeyMessage` depende del formato de mensaje de MongoDB
- H-123-3: Observación — rol desconocido en `cancelReservation` tratado silenciosamente como no-admin
- H-123-4: Observación — `userId` expuesto en `ReservationPublic` puede ser innecesario
- H-123-5: Observación — funciones de lectura del servicio confían implícitamente en filtrado del repositorio
