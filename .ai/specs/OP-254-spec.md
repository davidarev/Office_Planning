# OP-254 — Rollback en caso de error

## Contexto

Las subtareas OP-252 y OP-253 aplican overrides optimistas inmediatamente al reservar y cancelar. Si la API confirma la operación, el override se mantiene hasta el refetch. Pero si el backend rechaza (409 conflicto, 403 autorización, error de red, etc.), la UI quedaría en un estado incorrecto sin el rollback.

Esta subtarea implementa la lógica de rollback: si la llamada HTTP falla, el override optimista aplicado en OP-252 o OP-253 se elimina del mapa, devolviendo la mesa a su estado original, y se muestra un mensaje de error al usuario.

## Objetivo

Implementar en `FloorPlanSection` el rollback del override optimista cuando el backend rechaza una reserva o cancelación, y asegurar que el usuario recibe un mensaje de error claro.

## Restricciones

- El rollback debe ser completo: la mesa vuelve exactamente al estado que tenía antes del override.
- El mensaje de error debe mostrarse al usuario de forma visible y relacionada con la acción fallida.
- No exponer detalles internos de la API (stack traces, IDs internos).
- El rollback no debe lanzar un refetch innecesario — solo eliminar el override y mostrar el error.
- Un rollback fallido (error al hacer rollback) no debe romper la UI.

## Diseño del rollback

El mapa de overrides funciona como fuente de verdad del estado optimista. Para revertir:

```ts
function applyRollback(overrides: OptimisticOverrides, tableId: string): OptimisticOverrides {
  const next = new Map(overrides);
  next.delete(tableId);
  return next;
}
```

Esto devuelve un nuevo mapa sin el override del `tableId` afectado. El render siguiente usa los datos del servidor sin override, recuperando el estado original.

## Flujo completo de una operación con rollback

```
Usuario pulsa "Reservar"
  → onOptimisticUpdate() → override aplicado → mesa pasa a rojo
  → POST /api/reservations (en background)
    → éxito (201): override se mantiene → refetch programado
    → error (4xx/5xx): rollback → override eliminado → mesa vuelve al estado original
                                  → setReserveError("mensaje legible")
```

## Mensajes de error al usuario

Los mensajes de error deben ser legibles y accionables:

| Situación | Mensaje |
|---|---|
| 409 - mesa ya reservada | Mensaje del servidor (viene del campo `error` del JSON) |
| 409 - usuario ya tiene reserva | Mensaje del servidor |
| Error de red / timeout | "Error de conexión. Inténtalo de nuevo." |
| 401/403 | "No tienes permiso para realizar esta acción." |
| 500 u otro error sin `error` field | "Error al realizar la reserva." o "Error al cancelar la reserva." |

Los mensajes se muestran en `DeskDetailPanel` en el área de error ya implementada (`role="alert"`).

## Casos límite

- Dos usuarios reservan la misma mesa casi simultáneamente: uno recibe 409, hace rollback, ve el error, y la mesa vuelve a su estado original en su UI.
- El usuario pierde conexión durante la reserva: fetch lanza excepción, rollback inmediato, mensaje "Error de conexión".
- El usuario cancela rápidamente después de reservar (estados intermedios): si la reserva aún no ha confirmado, la cancelación no tiene `reservationId` real. El panel debe estar deshabilitado/spinner durante la operación en curso.
- El backend rechaza por sesión expirada (401): rollback + mensaje + idealmente redirigir a login (pero el manejo de 401 global está fuera del alcance de esta subtarea).

## Criterios de aceptación

- AC-1: Si `reserve` recibe un error del backend, el override optimista aplicado en OP-252 se elimina y la mesa vuelve a su estado original.
- AC-2: Si `cancelReservation` recibe un error del backend, el override optimista aplicado en OP-253 se elimina y la mesa vuelve a su estado original.
- AC-3: El mensaje de error se muestra en `DeskDetailPanel` con `role="alert"` de forma inmediata al rollback.
- AC-4: El mensaje de error usa el campo `error` del JSON de respuesta si existe; si no, usa un mensaje genérico según la operación (reserva o cancelación).
- AC-5: Durante el rollback no se lanza ningún refetch innecesario.
- AC-6: Los botones de acción están deshabilitados mientras hay una operación en curso (`isReserving` o `isCancelling`), evitando doble-click o acciones concurrentes desde el mismo cliente.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-06-17 18:50 (CET)
- Rama: feature/OP-250-flujo-reserva-cancelacion-ui
- Herramienta IA: Claude Code claude-opus-4-8
- Estado de AC:
  - AC-1: PASS – al fallar `reserve`, `onRollback` ejecuta `applyRollback(prev, tableId)`, eliminando el override; la mesa vuelve a su estado de servidor.
  - AC-2: PASS – idéntico para `cancelReservation`: `onRollback` aplica `applyRollback`.
  - AC-3: PASS – tras el rollback, `FloorPlanSection`/`FloorPlanClient` re-lanzan el error (`throw new Error(errorMsg)`), que `DeskDetailPanel` captura en `cancelError`/`reserveError` y muestra con `role="alert"`.
  - AC-4: PASS – el mensaje viene del campo `error` del JSON (lo extrae `useReservation`); si no existe, usa el genérico por operación ("Error al realizar la reserva" / "Error al cancelar la reserva"); error de red → "Error de conexión. Inténtalo de nuevo.".
  - AC-5: PASS – el rollback solo elimina el override y propaga el error; `refetch()` solo se invoca en la rama de éxito.
  - AC-6: PASS – `DeskDetailPanel` combina su estado local con `isReserving`/`isCancelling` del padre en `isBusy`; ambos botones se deshabilitan mientras hay cualquier operación en curso, evitando doble-click/acciones concurrentes.
- Ficheros creados o modificados:
  - `src/components/floor-plan/optimistic-overrides.ts` (`applyRollback`, función pura sin mutación)
  - `src/components/floor-plan/FloorPlanSection.tsx` (rollback vía `onRollback` + re-throw del error en reserve y cancel)
  - `src/components/floor-plan/FloorPlanClient.tsx` (propaga `isReserving`/`isCancelling` al panel)
  - `src/components/floor-plan/DeskDetailPanel.tsx` (props `isReserving`/`isCancelling`, `isBusy` deshabilita ambos botones)
- verify:
  - Comando ejecutado: `npm run test` + `npm run lint` + `npm run build`
  - Resultado: PASS – 413/413 tests, 0 errores de lint, build OK
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: lógica de rollback, propagación de mensajes de error al panel, deshabilitado de botones durante operaciones.
- Decisiones técnicas:
  - El rollback ya estaba parcialmente cubierto por el `onRollback` que invoca `useReservation` (OP-251); esta subtarea lo formaliza con `applyRollback` puro y garantiza la propagación del error al panel sin refetch.
  - Para AC-6 se distingue estado local del panel (`isReservingLocal`) del estado del padre (`isReservingExternal`); cualquiera de los dos activa `isBusy`, que deshabilita reserva y cancelación a la vez.
