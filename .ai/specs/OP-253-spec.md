# OP-253 — Actualización optimista al cancelar

## Contexto

Con el mecanismo de overrides optimistas implementado en OP-252, aplicar el mismo patrón a la cancelación es directo. Actualmente, al cancelar una reserva el usuario espera la respuesta de la API antes de ver el cambio visual.

Esta subtarea extiende `FloorPlanSection` para que, al pulsar "Cancelar reserva", la mesa vuelva a verde (`"green"`) o amarillo (`"yellow"`) inmediatamente en el estado local, antes de que el servidor confirme.

## Objetivo

Modificar el flujo de cancelación en `FloorPlanSection` y `FloorPlanClient` para que:

1. Al pulsar "Cancelar reserva", el estado de la mesa cambie inmediatamente a su estado sin reserva (`"green"` o `"yellow"` según el tipo) en el estado local.
2. La llamada `DELETE /api/reservations/:id` se ejecute en segundo plano.
3. Si la API confirma: mantener el override hasta el refetch.
4. Si la API rechaza: revertir el override (OP-254).

## Restricciones

- El cambio visual debe ser **inmediato** al confirmar la cancelación.
- El estado al que vuelve la mesa depende del tipo:
  - `"flexible"` → `"green"`
  - `"preferential"` → `"yellow"`
  - Otros (`"fixed"`, `"blocked"`) — no deberían cancelarse desde la UI, pero si ocurre, usar `"green"` como fallback seguro.
- No duplicar lógica de cálculo de status del servidor.
- Usar el mecanismo de overrides introducido en OP-252.
- El campo `reservation` del override debe ser `null` (la mesa ya no tiene reserva).

## Override que se aplica al cancelar

```ts
const statusAfterCancel: TableStatus =
  table.type === "preferential" ? "yellow" : "green";

overrides.set(tableId, {
  status: statusAfterCancel,
  reservation: null,
});
```

Además, `userHasReservationToday` se recalcula desde `applyOverrides(data, overrides)`, por lo que al limpiar la reserva propia, `userHasReservationToday` pasa a `false` inmediatamente, permitiendo al usuario reservar otra mesa ese día si lo desea.

## Casos límite

- El usuario cancela y la API confirma: el override permanece hasta el refetch.
- El usuario cancela y la API rechaza: revertir el override (OP-254).
- El usuario cancela, la mesa vuelve a verde, y antes del refetch otro usuario la reserva: el polling o el siguiente refetch actualizará el estado real (OP-260).
- La mesa es `"preferential"` sin `assignedUser`: vuelve a `"yellow"` de todas formas (el panel ya muestra el estado correcto basado en datos del servidor tras el refetch).

## Criterios de aceptación

- AC-1: Al pulsar "Cancelar reserva" en `DeskDetailPanel`, la mesa cambia visualmente a `"green"` o `"yellow"` antes de que la API responda.
- AC-2: El override incluye `reservation: null`, por lo que `userHasReservationToday` pasa a `false` inmediatamente.
- AC-3: El estado al que vuelve la mesa es `"yellow"` si el tipo es `"preferential"`, `"green"` en cualquier otro caso.
- AC-4: Al cambiar de día (`selectedDay` cambia), los overrides optimistas se limpian.
- AC-5: Si la API confirma la cancelación, se ejecuta `refetch` para actualizar con datos reales del servidor.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-06-17 18:50 (CET)
- Rama: feature/OP-250-flujo-reserva-cancelacion-ui
- Herramienta IA: Claude Code claude-opus-4-8
- Estado de AC:
  - AC-1: PASS – `handleCancel` en `FloorPlanSection` aplica el override (green/yellow) antes del `await cancelReservation`, la mesa cambia visualmente al instante.
  - AC-2: PASS – el override usa `reservation: null`, por lo que `userHasReservationToday` (calculado desde `applyOverrides`) pasa a `false` de inmediato.
  - AC-3: PASS – `statusAfterCancel(type)` devuelve `"yellow"` si `preferential`, `"green"` en cualquier otro caso (fallback seguro).
  - AC-4: PASS – `activeOverrides` devuelve un mapa vacío cuando `overrideDay !== selectedDay.dateString`, sin efectos (mismo patrón que OP-252).
  - AC-5: PASS – si `cancelReservation` devuelve `null`, se llama a `refetch()`.
- Ficheros creados o modificados:
  - `src/components/floor-plan/optimistic-overrides.ts` (nuevo — `applyOverrides`, `applyRollback`, tipos extraídos de `FloorPlanSection`)
  - `src/components/floor-plan/FloorPlanSection.tsx` (cancelación optimista vía `handleCancel`, usa el nuevo módulo)
  - `src/components/floor-plan/FloorPlanClient.tsx` (recibe `onCancel`, elimina `useCancelReservation`)
  - `src/components/floor-plan/index.ts` (exporta el módulo `optimistic-overrides`)
  - `src/components/floor-plan/use-cancel-reservation.ts` (eliminado — migrado a `useReservation`)
  - `src/components/floor-plan/use-reserve.ts` (eliminado — huérfano tras OP-252)
- verify:
  - Comando ejecutado: `npm run test` + `npm run lint` + `npm run build`
  - Resultado: PASS – 413/413 tests, 0 errores de lint, build OK
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: extracción del módulo `optimistic-overrides`, migración de la cancelación al flujo optimista, limpieza de hooks huérfanos.
- Decisiones técnicas:
  - `applyOverrides` se extrajo de `FloorPlanSection` a su propio módulo (`optimistic-overrides.ts`) para ser importable de forma pura por los tests de OP-255 y compartir `applyRollback` con OP-254.
  - La cancelación se unificó bajo `useReservation` (OP-251), eliminando `use-cancel-reservation.ts` y el ya huérfano `use-reserve.ts`. Las suites verify históricas OP-232/OP-233 se actualizaron para apuntar al hook unificado.
