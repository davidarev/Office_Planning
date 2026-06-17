# OP-252 — Actualización optimista al reservar

## Contexto

`useReservation` (OP-251) expone `reserve(tableId, date, options)` con soporte para `onOptimisticUpdate` y `onRollback`. Actualmente el flujo de reserva en `FloorPlanClient` llama a `useReserve`, espera la respuesta y luego llama a `onReservationCreated` (que lanza un refetch). El resultado: la mesa no cambia visualmente hasta que la API responde, lo que puede tardar varios cientos de ms.

Esta subtarea implementa la actualización optimista al reservar: la mesa pasa a estado rojo (`"red"`) en el estado local de `FloorPlanSection` **inmediatamente** al hacer clic en "Reservar", antes de que el servidor confirme.

`FloorPlanSection` actualmente recibe los datos de `useAvailability` y los pasa como prop `tables` a `FloorPlanClient`. El estado optimista se gestiona en `FloorPlanSection` como una capa de override sobre los datos del servidor.

## Objetivo

Modificar `FloorPlanSection` y `FloorPlanClient` para que:

1. Al pulsar "Reservar", el estado de la mesa seleccionada cambie a `"red"` inmediatamente en el estado local (antes de la respuesta del servidor).
2. La llamada a la API se ejecute en segundo plano.
3. Si la API confirma la reserva: mantener el estado optimista hasta el siguiente refetch (que actualizará con datos reales del servidor).
4. Si la API rechaza: revertir el cambio optimista (OP-254).

El override optimista es un mapa `tableId → Partial<TableAvailability>` que se mezcla sobre los datos del servidor en el render. Esto permite múltiples overrides simultáneos si fuera necesario.

## Restricciones

- El cambio visual debe ser **inmediato** al confirmar la acción — sin esperar respuesta del servidor.
- No duplicar la lógica de estados del servidor en el cliente — el override solo actualiza `status` y `reservation` para el renderizado.
- Usar el hook `useReservation` (OP-251) como punto de entrada para la llamada HTTP.
- No introducir gestión de estado global (Redux, Zustand, Context de reservas) — el estado optimista vive en `FloorPlanSection`.
- Tipar estrictamente sin `any`.

## Diseño del override optimista

```ts
type OptimisticOverride = {
  status: TableStatus;
  reservation: TableAvailability["reservation"] | null;
};

type OptimisticOverrides = Map<string, OptimisticOverride>; // clave: tableId
```

La función `applyOverrides(tables, overrides)` mezcla los overrides sobre el array antes de renderizar:

```ts
function applyOverrides(
  tables: TableAvailability[],
  overrides: OptimisticOverrides
): TableAvailability[] {
  return tables.map((t) => {
    const override = overrides.get(t.tableId);
    return override ? { ...t, ...override } : t;
  });
}
```

## Override que se aplica al reservar

Cuando el usuario reserva `tableId` con éxito de llamada (o antes incluso de la respuesta):

```ts
overrides.set(tableId, {
  status: "red",
  reservation: {
    _id: "optimistic",       // ID temporal, se reemplazará con el refetch
    userName: "Tú",          // nombre del usuario actual (se sustituye con refetch)
    isOwner: true,
  },
});
```

## Casos límite

- El usuario reserva y la API confirma: el override permanece hasta el refetch, que reemplaza los datos con los reales.
- El usuario reserva y la API rechaza: revertir el override (OP-254).
- El usuario cambia de día mientras hay un override pendiente: limpiar overrides al cambiar de día.
- La mesa ya estaba en rojo (race condition): el usuario verá un error del backend y hará rollback (OP-254).

## Criterios de aceptación

- AC-1: Al pulsar "Reservar" en `DeskDetailPanel`, la mesa cambia visualmente a estado rojo antes de que la API responda.
- AC-2: El override incluye `reservation.isOwner = true`, por lo que `userHasReservationToday` pasa a `true` inmediatamente (impidiendo reservar otra mesa ese día).
- AC-3: Al cambiar de día (`selectedDay` cambia), los overrides optimistas se limpian.
- AC-4: Si la API confirma la reserva, se ejecuta `refetch` para actualizar con datos reales del servidor.
- AC-5: La función `applyOverrides` es pura y testeable de forma independiente.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

**Fecha**: 2026-06-17
**Estado**: DONE

### Archivos modificados

- `src/components/floor-plan/FloorPlanSection.tsx` — gestiona el estado optimista (`optimisticOverrides` + `overrideDay`), define `applyOverrides`, implementa `handleReserve` con actualización inmediata y rollback, y pasa `onReserve` a `FloorPlanClient`.
- `src/components/floor-plan/FloorPlanClient.tsx` — recibe `onReserve` desde el padre (ya no gestiona la llamada HTTP de reserva internamente); mantiene `useCancelReservation` para cancelación hasta OP-253.

### Decisión de diseño: limpieza de overrides al cambiar de día

Se descartó el patrón `useEffect + setState` (prohibido por `react-hooks/set-state-in-effect`). En su lugar se almacena el día al que pertenecen los overrides (`overrideDay`). En el render, si `overrideDay !== selectedDay.dateString`, se pasa `new Map()` vacío a `applyOverrides` — sin efecto, sin renders en cascada (AC-3).

### AC verificados

| AC | Estado | Notas |
|---|---|---|
| AC-1 | PASS | Al pulsar "Reservar", `setOptimisticOverrides` se llama antes del await, la mesa cambia a rojo sin esperar respuesta del servidor |
| AC-2 | PASS | El override incluye `reservation.isOwner: true`, por lo que `userHasReservationToday` pasa a `true` inmediatamente |
| AC-3 | PASS | Al cambiar de día, `activeOverrides` devuelve `new Map()` vacío sin necesidad de efecto |
| AC-4 | PASS | Si `reserve()` devuelve `null`, se llama a `refetch()` para sustituir el estado optimista con datos reales |
| AC-5 | PASS | `applyOverrides` es una función pura exportable e independiente del estado de React |

### Verificaciones

| Check | Estado |
|---|---|
| Lint | PASS (0 errores, 5 warnings preexistentes) |
| Tests unitarios | PASS (194/194) |
| Tests integración | PASS (102/102) |
| Tests API | PASS (89/89) |
| Build | PASS |
