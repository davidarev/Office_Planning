# OP-255 — Tests del flujo de reserva/cancelación

## Contexto

Las subtareas OP-251–OP-254 implementan el hook `useReservation`, la actualización optimista al reservar y cancelar, y el rollback en caso de error. Antes de esta subtarea existen tests parciales en `tests/unit/desk-detail-panel-reserve.test.ts` que cubren la lógica de visibilidad de botones y el comportamiento básico de fetch, pero no cubren el flujo optimista ni el rollback.

Esta subtarea cierra los gaps de cobertura añadiendo tests que verifican:
1. La función pura `applyOverrides` (unitaria)
2. El hook `useReservation` (unitaria, fetch mocked)
3. El flujo optimista completo: actualización inmediata + rollback en error (integración del hook con el componente o con callbacks)

## Objetivo

Añadir una suite de tests que cubra los criterios de aceptación de OP-251 a OP-254, garantizando que:
- `applyOverrides` mezcla correctamente los overrides.
- `useReservation` llama a los endpoints correctos y devuelve los valores esperados.
- El flujo optimista aplica el override antes de la respuesta HTTP.
- El rollback elimina el override cuando el backend rechaza.
- El error se expone correctamente para que el componente lo muestre.

## Estructura de tests

### 1. `tests/unit/apply-overrides.test.ts`

Tests unitarios puros de la función `applyOverrides` (importable desde el módulo donde se defina, sin React):

- Mesa sin override → datos originales inalterados.
- Mesa con override de status → status reemplazado, resto de campos intactos.
- Mesa con override de reservation: null → reservation es null.
- Override de una mesa no existente en el array → array sin cambios.
- Múltiples overrides aplicados a la vez.

### 2. `tests/unit/use-reservation.test.ts`

Tests unitarios del hook `useReservation` con fetch mocked (entorno `jsdom`):

**reserve:**
- Llama a `POST /api/reservations` con body `{ tableId, date }`.
- Devuelve `null` en respuesta 201.
- Devuelve mensaje de error del JSON en respuesta 409.
- Devuelve mensaje genérico cuando el JSON no tiene campo `error`.
- Devuelve mensaje de conexión cuando fetch lanza excepción.
- `isReserving` es `true` durante la llamada y `false` al terminar.
- Llama a `options.onOptimisticUpdate` antes de ejecutar fetch.
- Llama a `options.onRollback` cuando el backend rechaza.
- NO llama a `options.onRollback` cuando la operación es exitosa.

**cancelReservation:**
- Llama a `DELETE /api/reservations/:id`.
- Devuelve `null` en respuesta 200.
- Devuelve mensaje de error del JSON en respuesta 4xx.
- `isCancelling` es `true` durante la llamada y `false` al terminar.
- Llama a `options.onOptimisticUpdate` antes de ejecutar fetch.
- Llama a `options.onRollback` cuando el backend rechaza.
- NO llama a `options.onRollback` en éxito.

### 3. `tests/unit/optimistic-flow.test.ts`

Tests del flujo optimista completo usando callbacks (sin montar componentes React):

**Flujo reserva exitosa:**
- `onOptimisticUpdate` se llama con el override correcto (status=red, isOwner=true) antes de la respuesta.
- Tras éxito, el override persiste (no se llama onRollback).
- `onReservationCreated` / `refetch` se invoca tras éxito.

**Flujo reserva fallida (rollback):**
- `onOptimisticUpdate` se llama inicialmente.
- Cuando el backend devuelve error, `onRollback` se llama para revertir.
- El mensaje de error devuelto es el correcto.

**Flujo cancelación exitosa:**
- `onOptimisticUpdate` se llama con override correcto (status=green o yellow, reservation=null).
- Tras éxito, override persiste.
- Refetch se invoca.

**Flujo cancelación fallida (rollback):**
- `onOptimisticUpdate` se llama inicialmente.
- Cuando el backend devuelve error, `onRollback` se llama.
- El mensaje de error es correcto.

## Restricciones

- Usar Vitest como framework.
- Tests que involucren hooks React: entorno `jsdom` con `@testing-library/react`.
- Tests de funciones puras (`applyOverrides`): entorno `node`.
- Sin tests E2E ni renderizado de componentes completos (eso es OP-450).
- Los tests deben ser independientes entre sí (no compartir estado).
- Los mocks de fetch deben resetearse entre tests (`beforeEach(() => { vi.resetAllMocks(); })`).

## Criterios de aceptación

- AC-1: `tests/unit/apply-overrides.test.ts` existe y todos sus tests pasan.
- AC-2: `tests/unit/use-reservation.test.ts` existe y todos sus tests pasan — cubre reserve y cancelReservation.
- AC-3: Los tests verifican que `onOptimisticUpdate` se llama antes de la respuesta HTTP.
- AC-4: Los tests verifican que `onRollback` se llama cuando el backend rechaza.
- AC-5: Los tests verifican que `onRollback` NO se llama en caso de éxito.
- AC-6: `npm run test` (suite completa) pasa en verde sin regresiones.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-06-17 18:50 (CET)
- Rama: feature/OP-250-flujo-reserva-cancelacion-ui
- Herramienta IA: Claude Code claude-opus-4-8
- Estado de AC:
  - AC-1: PASS – `tests/unit/apply-overrides.test.ts` (11 tests: status, reservation null, mesa inexistente, múltiples overrides, no-mutación + `applyRollback`).
  - AC-2: PASS – `tests/unit/use-reservation.test.ts` cubre `reserve` y `cancelReservation` (endpoints, retornos, flags `isReserving`/`isCancelling`, callbacks).
  - AC-3: PASS – `optimistic-flow.test.ts` verifica que `optimistic` precede a la llamada HTTP en reserva y cancelación.
  - AC-4: PASS – tests de `onRollback` en fallo (4xx) tanto en hook como en flujo.
  - AC-5: PASS – tests de `onRollback` NO llamado en éxito (201/200).
  - AC-6: PASS – `npm run test` completo en verde (413/413), sin regresiones.
- Ficheros creados o modificados:
  - `tests/unit/apply-overrides.test.ts` (nuevo, env node)
  - `tests/unit/use-reservation.test.ts` (nuevo, env jsdom + `@testing-library/react`)
  - `tests/unit/optimistic-flow.test.ts` (nuevo, env jsdom)
  - `.ai/verify/config.yaml` (suites OP-253/254/255 + actualización de OP-232/233)
- verify:
  - Comando ejecutado: `npm run test`
  - Resultado: PASS – 413/413 tests (28 nuevos), 24 ficheros de test
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: diseño y escritura de las tres suites de test.
- Decisiones técnicas:
  - Los tests de hook usan el docblock `// @vitest-environment jsdom` (mismo patrón que `use-availability.test.ts`) porque el config global de vitest usa `environment: "node"`.
  - `optimistic-flow.test.ts` no monta componentes: reproduce el orden de efectos de `FloorPlanSection.handleReserve/handleCancel` con callbacks y el `applyRollback` real, cumpliendo la restricción "sin renderizado de componentes completos".
  - El test del flag `isReserving` usa una promesa de fetch controlada manualmente para observar el estado intermedio `true`.
