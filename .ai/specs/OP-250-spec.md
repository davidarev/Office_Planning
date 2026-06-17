# OP-250 — Flujo de reserva y cancelación en UI

## Contexto
El detalle de mesa (OP-230) tiene botones de reservar y cancelar, y la integración con API (OP-240) carga datos de disponibilidad. Falta conectar las acciones del usuario con los endpoints de reserva (POST /api/reservations y DELETE /api/reservations/[id]) y actualizar la UI de forma optimista. Depende de OP-230 y OP-240.

## Objetivo
Implementar el flujo completo de reserva y cancelación desde la UI: el usuario confirma, se actualiza la UI inmediatamente (optimista), se llama al API, y si falla se revierte el cambio mostrando error.

## Restricciones
- Actualización optimista obligatoria — el cambio visual debe ser inmediato
- Rollback si el backend rechaza — la UI debe volver al estado anterior
- No duplicar lógica de validación del backend en el frontend
- Depende de OP-230 y OP-240

## Casos límite
- Dos usuarios reservan la misma mesa casi simultáneamente — uno recibirá error del backend, debe hacer rollback
- Usuario pierde conexión durante la reserva — rollback + mensaje de error
- Usuario cancela y re-reserva rápidamente — manejar estados intermedios
- Backend rechaza por "ya tienes reserva hoy" — rollback + mensaje explicativo

## Criterios de aceptación
- AC-1: Hook useReservation creado — llama a POST /api/reservations (reservar) y DELETE /api/reservations/[id] (cancelar)
- AC-2: Actualización optimista al reservar — mesa pasa a rojo inmediatamente antes de respuesta del servidor
- AC-3: Actualización optimista al cancelar — mesa vuelve a verde/amarillo inmediatamente antes de respuesta
- AC-4: Rollback en caso de error — si el backend rechaza, se revierte el cambio optimista y se muestra mensaje de error al usuario
- AC-5: Tests del flujo implementados — verifican actualización inmediata, rollback en error, y coherencia de estado

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-251 | Hook useReservation |
| OP-252 | Actualización optimista al reservar |
| OP-253 | Actualización optimista al cancelar |
| OP-254 | Rollback en caso de error |
| OP-255 | Tests del flujo de reserva/cancelación |

## Execution Result

- Fecha de implementación: 2026-06-17 19:00 (CET)
- Rama: feature/OP-250-flujo-reserva-cancelacion-ui
- Commits: 05c5523 (OP-253) · a8a78e5 (OP-254) · 89ada90 (OP-255) · 8f8ec3e (canvas)
- Herramienta IA: Claude Code claude-opus-4-8 / claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – `src/hooks/use-reservation.ts` creado (OP-251). Expone `reserve` (POST /api/reservations) y `cancelReservation` (DELETE /api/reservations/:id) con flags `isReserving`/`isCancelling` y soporte para `onOptimisticUpdate`/`onRollback`.
  - AC-2: PASS – Al pulsar "Reservar", `FloorPlanSection.handleReserve` aplica el override `{ status: "red", reservation: { isOwner: true } }` antes del `await reserve(...)`. La mesa cambia a rojo sin esperar respuesta del servidor (OP-252).
  - AC-3: PASS – Al pulsar "Cancelar reserva", `FloorPlanSection.handleCancel` aplica el override `{ status: "green"|"yellow", reservation: null }` antes del `await cancelReservation(...)`. Mesa vuelve a verde/amarillo de inmediato (OP-253).
  - AC-4: PASS – Si el backend rechaza, `onRollback` ejecuta `applyRollback()` que elimina el override del mapa; la mesa vuelve a su estado real del servidor. El error se propaga al panel con `role="alert"`. Los botones se deshabilitan (`isBusy`) mientras hay cualquier operación en curso (OP-254).
  - AC-5: PASS – 28 tests nuevos en verde: `apply-overrides.test.ts` (funciones puras), `use-reservation.test.ts` (hook con fetch mocked, jsdom), `optimistic-flow.test.ts` (flujo completo con rollback) (OP-255).
- Ficheros principales creados o modificados:
  - `src/hooks/use-reservation.ts` (nuevo — hook unificado)
  - `src/components/floor-plan/optimistic-overrides.ts` (nuevo — `applyOverrides`, `applyRollback`, tipos)
  - `src/components/floor-plan/FloorPlanSection.tsx` (gestión del estado optimista para reserva y cancelación)
  - `src/components/floor-plan/FloorPlanClient.tsx` (delega `onReserve`/`onCancel` al padre, propaga flags)
  - `src/components/floor-plan/DeskDetailPanel.tsx` (muestra errores, `isBusy` deshabilita botones)
  - `src/components/floor-plan/index.ts` (exporta el módulo `optimistic-overrides`)
  - `src/components/floor-plan/use-cancel-reservation.ts` (eliminado — migrado)
  - `src/components/floor-plan/use-reserve.ts` (eliminado — huérfano)
  - `tests/unit/apply-overrides.test.ts` (nuevo)
  - `tests/unit/use-reservation.test.ts` (nuevo)
  - `tests/unit/optimistic-flow.test.ts` (nuevo)
  - `.ai/verify/config.yaml` (suites OP-253/254/255 + fix OP-232/233)
- verify:
  - Comando ejecutado: `npm run test` + `npm run lint` + `npm run build`
  - Resultado: PASS — 413/413 tests, 0 errores lint (5 warnings preexistentes), build OK
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa de las subtareas OP-251 a OP-255
- Decisiones técnicas:
  - El estado optimista vive en `FloorPlanSection` como un `Map<tableId, OptimisticOverride>` sin gestión de estado global (sin Redux/Zustand/Context dedicado).
  - Los overrides se "limpian" al cambiar de día comparando `overrideDay !== selectedDay.dateString` en render, evitando `useEffect` con `setState` (prohibido por `react-hooks/exhaustive-deps`).
  - `applyRollback` es una función pura que devuelve un nuevo `Map` sin mutar el original, alineada con el patrón inmutable de React.
