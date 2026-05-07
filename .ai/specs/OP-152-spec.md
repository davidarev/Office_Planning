# OP-152 — Revisar tests de integración

## Contexto
El proyecto cuenta con cinco ficheros de tests de integración en `tests/integration/`, todos en verde con Vitest + mongodb-memory-server:

- `reservation-repository.test.ts` — 22 casos: CRUD del repositorio, índices únicos parciales, filtros por fecha
- `table-user-repository.test.ts` — 13 casos: repositorios de mesas y usuarios
- `reservation-service.test.ts` — 20 casos: lógica de negocio de `createReservation` y `cancelReservation`, incluyendo E11000
- `availability-service.test.ts` — 9 casos: pipeline completo de disponibilidad para fecha y rango
- `concurrency.test.ts` — 6 casos: carreras simultáneas a nivel de repositorio y servicio

El setup global (`tests/setup.ts`) arranca una instancia MongoMemoryServer antes de todos los tests y limpia todas las colecciones en `afterEach`. Los contadores internos de las factories (`userCounter`, `tableCounter` en `factories.ts`) no se resetean entre tests.

Esta subtarea forma parte de la auditoría OP-150 y no implica cambios en el código.

## Objetivo
Revisar la calidad, exhaustividad y robustez de los tests de integración. Identificar gaps en la cobertura de reglas de negocio, problemas en el setup/teardown, fragilidades en las assertions y escenarios críticos no cubiertos, con especial atención a la concurrencia y a los índices únicos parciales.

## Restricciones
- Solo auditar — no modificar código ni tests
- Los hallazgos se documentan para ser aplicados en OP-155 (corrección) y OP-160 (aplicación)
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Setup y teardown global

- `afterEach` limpia colecciones pero los contadores `userCounter` y `tableCounter` de `factories.ts` **no se resetean** entre tests — los labels generados (`Mesa 5`, `Mesa 6`…) crecen entre casos, lo que puede dificultar el diagnóstico de fallos pero no afecta a la corrección siempre que los tests no dependan de labels específicos.
- ¿`resetCounters()` existe pero no se llama en ningún hook? Verificar si hay algún `beforeEach` que lo invoque o si es un helper muerto.
- ¿El `afterEach` de `setup.ts` corre también para tests unitarios que no necesitan BD? Puede generar overhead innecesario si Mongoose no está conectado (aunque el guard `readyState === 1` lo mitiga).
- ¿Existe un `beforeEach` que garantice que Mongoose está conectado antes de cada test? El `connectDB()` se llama dentro de cada factory — verificar si una factory que falla antes del `await connectDB()` puede dejar la BD en estado inconsistente.

### reservation-repository.test.ts

#### insertReservation
- ¿Se verifica que el campo `date` almacenado es UTC midnight y no depende del timezone del servidor?
- ¿Se cubre el caso de `userId` o `tableId` con formato inválido (no ObjectId válido)?
- ¿Se cubre el comportamiento cuando Mongoose recibe un string no ObjectId como `userId` — lanza, devuelve null, o castea silenciosamente?

#### partial unique index
- Los tests verifican que un índice parcial permite nuevas reservas tras cancelar, tanto para `{tableId, date}` como para `{userId, date}`. ¿Se verifica que los índices están definidos correctamente en el schema? Si el índice no existe en `mongodb-memory-server`, el test pasaría en tests pero fallaría en producción.
- ¿Se cubre el caso de cancelar y re-reservar el mismo día con el **mismo** usuario (no distinto), para verificar el índice `{userId, date}`?

#### getReservationsByDateRange
- ¿Se verifica que la query es inclusiva en ambos extremos (boundary dates)?
- ¿Se cubre el caso de rango invertido (`start > end`)? ¿Devuelve array vacío o lanza?
- ¿Se verifica el orden de los resultados cuando hay múltiples reservas el mismo día?

#### getUserReservationByDate / getTableReservationByDate
- ¿Se cubre el caso de `userId` o `tableId` con formato inválido?
- ¿Se verifica que estas funciones devuelven `null` y no lanzan cuando el usuario/mesa no existe?

### table-user-repository.test.ts

#### listActiveTables
- ¿Se verifica el orden cuando hay mesas con el mismo label?
- ¿Se cubre el campo `assignedTo` — listActiveTables devuelve mesas con `assignedTo` poblado o como ObjectId crudo?
- ¿Se cubre el campo `rotation` en `position` como opcional (puede ser `undefined`)?

#### getUserByEmail
- El test "es case-insensitive" crea un usuario con `Test@Company.com` y busca con `test@company.com`. ¿Se verifica que la insensibilidad viene del índice de MongoDB y no de la lógica de la función? Si la función normaliza el email antes de buscar, el test debe reflejarlo.
- ¿Se cubre el caso de email con espacios o caracteres especiales?

#### listActiveUsers
- ¿Se cubre el caso de usuarios inactivos que tienen reservas confirmadas — `listActiveUsers` no los devuelve?

### reservation-service.test.ts

#### createReservation
- ¿Se cubre el caso de `userId` con formato no ObjectId válido? El servicio recibe strings — ¿valida el formato antes de llegar al repositorio?
- ¿Se cubre reserva en mesa `preferential` que ya tiene reserva de otro usuario (debe fallar por conflicto de mesa)?
- ¿Se verifica el mensaje de error exacto para `code: "not_found"` cuando la mesa no existe, o solo el código?
- El test "fails when table is inactive" espera `code: "validation"` — ¿es coherente con el código que devuelve el servicio para este caso específico? Podría ser `not_found` si el repositorio no distingue inactiva de inexistente.

#### cancelReservation
- ¿Se cubre el caso de un admin que intenta cancelar una reserva ya cancelada?
- ¿Se cubre el caso de `reservationId` con formato no ObjectId válido?
- El test "non-owner non-admin cannot cancel" verifica `result.code === "forbidden"` — ¿se verifica también que la reserva no fue modificada en BD (estado sigue siendo `confirmed`)?

#### getReservationsForDay / getReservationsForRange
- Solo hay un test por función, sin variaciones. ¿Se cubren reservas canceladas (deben excluirse de la vista pública)?
- ¿Se verifica el tipo exacto de los campos devueltos (`_id`, `userId`, `tableId` como strings, `date` como string YYYY-MM-DD)?

### availability-service.test.ts

#### getTableAvailabilityForDate
- ¿Se cubre el caso de mesa `fixed` con reserva confirmada — el resultado debería ser `red` por reserva (no por tipo)?
- ¿Se cubre el caso de mesa `preferential` reservada por un usuario distinto al `assignedTo`?
- ¿Se verifica que `reservation` es `null` y no `undefined` para mesas sin reserva?
- ¿Se cubre el comportamiento cuando `getTableAvailabilityForDate` recibe una fecha con hora (no solo `YYYY-MM-DD`)?

#### getTableAvailabilityForRange
- ¿Se cubre un rango que incluye weekends — el sistema los incluye o los filtra?
- ¿Se verifica el comportamiento con rango invertido (`start > end`)?
- ¿Se cubre el caso de rango de 0 días (`start === end`)?

### concurrency.test.ts

#### Naturaleza de la concurrencia simulada
- Los tests usan `Promise.allSettled` con `insertReservation` directos — esto es concurrencia a nivel de Node.js event loop, no concurrencia real entre procesos o conexiones distintas. En `mongodb-memory-server` con una sola conexión, la concurrencia puede no ejercitar el índice de la misma forma que en producción con múltiples instancias.
- ¿Se documenta esta limitación en el test o en la spec?

#### Assertions del ganador
- Los tests de servicio verifican que "un ganador" y "un perdedor" existen, pero no verifican **cuál** ganó (podría ser cualquiera). ¿Es suficiente para garantizar el comportamiento correcto, o se debería verificar que el ganador tiene una reserva confirmada en BD?
- El test "three-way race: only one wins" verifica `successes.length === 1` pero no verifica que `failures.length === 2`.

#### Timeout y flakiness
- Los tests de concurrencia con `Promise.allSettled` pueden ser no deterministas en entornos con alta carga. ¿Hay configuración de timeout explícita en Vitest para estos casos?

## Casos límite
- Contador de factories no reseteado: los labels generados crecen sin límite entre tests — si algún test depende de un label específico generado por defecto (`Mesa 1`), fallará al no ser el primero
- Concurrencia simulada vs. real: `Promise.all` en el mismo event loop puede no ejercitar el índice único de MongoDB de la misma manera que dos requests HTTP simultáneos desde Vercel
- Índices únicos parciales en `mongodb-memory-server`: si el schema no aplica el índice correctamente, los tests pasarán pero el comportamiento en producción será distinto

## Criterios de aceptación
- AC-1: Verificar que el setup/teardown (setup.ts + factories) garantiza aislamiento real entre tests, e identificar si `resetCounters()` debería llamarse en `afterEach`
- AC-2: Verificar que los tests de repositorio cubren los índices únicos parciales de forma fiable y que los tests no dependen de que el índice exista en `mongodb-memory-server` sin verificarlo
- AC-3: Verificar que `reservation-service.test.ts` cubre todos los códigos de error del servicio (`validation`, `not_found`, `conflict`, `forbidden`) con assertions sobre código y mensaje
- AC-4: Verificar que `availability-service.test.ts` cubre los casos de enriquecimiento de datos (campos `reservation`, `assignedUser`) con assertions concretas sobre el contenido, no solo presencia
- AC-5: Verificar que `concurrency.test.ts` documenta explícitamente la limitación de concurrencia simulada vs. real y que las assertions verifican el estado final en BD, no solo el retorno del servicio
- AC-6: Documentar gaps de cobertura, assertions débiles y tests frágiles encontrados, con severidad, para consolidar en OP-154 y OP-155

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en `.ai/reports/OP-150-findings.md`
- Sin modificaciones al código fuente ni a los tests
- Spec actualizada con ## Execution Result

## Execution Result

**Estado: DONE — 2026-05-07**

### AC-1 — PASS (con observaciones)
El `setup.ts` global tiene `afterEach` que limpia todas las colecciones — aislamiento real garantizado. `resetCounters()` existe pero nunca se llama desde ningún hook (I-001, LOW). El guard `readyState === 1` mitiga el overhead en tests unitarios (I-002, LOW). Sin impacto en corrección.

### AC-2 — PASS parcial
Los tests de índice único parcial cubren cancelar+re-reservar con usuarios/mesas distintos, pero falta el caso simétrico de cancelar y re-reservar la misma mesa con el mismo usuario el mismo día (I-006, MEDIUM). Tampoco hay verificación directa de que el índice exista en `mongodb-memory-server` (I-007, MEDIUM).

### AC-3 — PASS parcial
`reservation-service.test.ts` cubre los cuatro códigos de error principales (`validation`, `not_found`, `conflict`, `forbidden`). Gaps: no se cubre cancelación por admin de reserva ya cancelada (I-021, MEDIUM), cancelación con `reservationId` inválido (I-022, MEDIUM), ni `getReservationsForDay/Range` sin reservas canceladas excluidas (I-023, I-024, MEDIUM).

### AC-4 — PASS parcial
`availability-service.test.ts` verifica campos `reservation` y `assignedUser` con assertions sobre contenido concreto (nombre, _id). Gaps: no se cubre `fixed` con reserva propia (I-025), `preferential` reservada por otro (I-026), rango con weekends (I-029), ni rango invertido (I-030). Todos MEDIUM.

### AC-5 — FAIL
`concurrency.test.ts` **no documenta** la limitación de concurrencia simulada vs. real. Las assertions verifican el retorno del servicio pero no el estado final en BD (I-033, MEDIUM). El test "three-way race" no verifica `failures.length === 2` (I-032, MEDIUM). El hallazgo más crítico de OP-152: I-031 (HIGH) — la concurrencia simulada en el mismo event loop no ejercita los índices de la misma forma que en producción con múltiples instancias.

### AC-6 — PASS
28 hallazgos documentados en `.ai/reports/OP-150-findings.md` con severidad: 1 HIGH, 16 MEDIUM, 11 LOW, 2 INFO.

**Hallazgo HIGH:**
- I-031: concurrencia simulada (`Promise.allSettled` en mismo event loop) no equivale a concurrencia real entre procesos — limitación no documentada en los tests.

**Sin modificaciones al código fuente ni a los tests.**
