# OP-126 — Verificar documentación JSDoc de servicios y repositorios

## Contexto
AGENTS.md y CLAUDE.md exigen documentación JSDoc para todas las funciones públicas, servicios y utilidades críticas. El formato requerido incluye: qué hace la función, qué parámetros recibe, qué devuelve, y qué errores o casos especiales contempla. Esta subtarea verifica el cumplimiento en los 5 ficheros auditados en OP-121 a OP-125. Forma parte de la auditoría OP-120 y no implica cambios en el código.

## Objetivo
Comprobar que todas las funciones públicas de repositorios y servicios tienen JSDoc completo y correcto. Identificar funciones sin documentar, con documentación incompleta o con JSDoc que no refleja el comportamiento real del código.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-127 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Ficheros a revisar
- `src/lib/db/reservation.repository.ts`
- `src/lib/db/table.repository.ts`
- `src/lib/db/user.repository.ts`
- `src/services/reservation.service.ts`
- `src/services/availability.service.ts`
- `src/services/table.service.ts`

## Puntos de revisión

### Por cada función pública, verificar que JSDoc incluye
- `@param` para cada parámetro con tipo y descripción
- `@returns` describiendo qué devuelve y cuándo puede ser null
- `@throws` si la función puede lanzar excepciones (especialmente E11000 en `insertReservation`)
- Descripción general clara de qué hace la función

### Funciones privadas / helpers
- Los helpers privados (como `toPublic`, `computeStatus`, `isDuplicateKeyError`, `buildUserNameMap`) también deben tener JSDoc si su comportamiento no es obvio
- Verificar que los helpers más complejos están suficientemente documentados

### Módulos (JSDoc de fichero)
- Verificar que cada fichero tiene bloque `@module` o similar explicando su responsabilidad
- Verificar coherencia entre el JSDoc del módulo y su contenido real

### Calidad del JSDoc existente
- `@param` con nombre y descripción (no solo tipo)
- `@returns` que explica no solo el tipo sino el significado del resultado
- Casos especiales mencionados: cuándo devuelve null, cuándo lanza, cuándo devuelve array vacío

## Checklist por fichero

### reservation.repository.ts
- [ ] `getReservationsByDate` — param `date`, returns, filtro confirmed documentado
- [ ] `getReservationsByDateRange` — params `start/end`, returns, sort documentado
- [ ] `getUserReservationByDate` — params, returns null cuando no hay reserva
- [ ] `getTableReservationByDate` — params, returns
- [ ] `getReservationById` — any status (no solo confirmed) — ¿documentado?
- [ ] `insertReservation` — params, returns, `@throws` E11000 documentado
- [ ] `markReservationCancelled` — param acepta `string | Types.ObjectId`, returns null si no encontrado

### table.repository.ts
- [ ] `listActiveTables` — returns, filtro isActive documentado
- [ ] `getTableById` — devuelve también inactivas — ¿documentado?

### user.repository.ts
- [ ] `getUserByEmail` — case-insensitive documentado
- [ ] `getUserById` — returns null, sin filtro isActive
- [ ] `listActiveUsers` — filtro isActive, ordenación documentados

### reservation.service.ts
- [ ] `getReservationsForDay` — params, returns
- [ ] `getReservationsForRange` — params, returns
- [ ] `createReservation` — orden de validaciones documentado, E11000 como respaldo documentado
- [ ] `cancelReservation` — reglas de autorización documentadas
- [ ] `toPublic` (privado) — documentado
- [ ] `isDuplicateKeyError` (privado) — documentado
- [ ] `getDuplicateKeyMessage` (privado) — lógica de detección documentada

### availability.service.ts
- [ ] `getTableAvailabilityForDate` — params, returns, nota sobre tablas inactivas
- [ ] `getTableAvailabilityForRange` — params, returns (estructura del Record)
- [ ] `computeStatus` (privado) — reglas de prioridad documentadas
- [ ] `buildUserNameMap` (privado) — propósito anti-N+1 documentado
- [ ] `resolveUserName` (privado) — fallback documentado

### table.service.ts
- [ ] `TablePublic` (interfaz) — documentada con propósito
- [ ] `getTablesWithBasicInfo` — returns, nota sobre ausencia de status
- [ ] `toPublic` (privado) — documentado

## Casos límite
- JSDoc que describe comportamiento incorrecto o desactualizado respecto al código
- `@throws` ausente en funciones que sí pueden lanzar (ej. `insertReservation`)
- Descripción de `@returns` que no menciona el caso `null`

## Criterios de aceptación
- AC-1: Todas las funciones públicas de los 6 ficheros tienen JSDoc con `@param`, `@returns` y descripción
- AC-2: Funciones que pueden lanzar tienen `@throws` documentado
- AC-3: Funciones que devuelven null lo indican explícitamente en `@returns`
- AC-4: Los módulos tienen bloque de documentación general coherente con su contenido
- AC-5: El JSDoc existente es correcto (no describe comportamiento erróneo)
- AC-6: Documentar gaps y hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-127
- Sin modificaciones al código fuente
