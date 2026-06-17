# OP-233 — Botón de cancelar reserva propia

## Contexto

El `DeskDetailPanel` (OP-231) muestra información de la mesa seleccionada y, tras OP-232, ya incluye el botón "Reservar". Esta subtarea añade la acción simétrica: un botón "Cancelar reserva" que aparece cuando la mesa está ocupada por el propio usuario. El endpoint `DELETE /api/reservations/:id` ya existe y cancela la reserva (marca como `cancelled`, no la elimina).

La información necesaria para determinar si la reserva es del usuario actual está en `TableAvailability.reservation._id` y `TableAvailability.reservation.userName`. Sin embargo, el panel no tiene acceso directo al ID del usuario en sesión — el padre debe pasar `currentUserId` como prop para que el panel pueda comparar.

## Objetivo

Añadir al `DeskDetailPanel` un botón "Cancelar reserva" que:

1. Solo se muestra cuando `table.status === "red"` y la reserva activa pertenece al usuario actual (`table.reservation` no es `null` y el nombre coincide, o mejor aún, el padre pasa `currentUserId` para comparar contra `table.reservation`).
2. Al pulsarlo, llama a `onCancelReservation(reservationId)`.
3. Muestra estado de carga mientras la petición está en curso (botón deshabilitado + texto "Cancelando…").
4. En caso de éxito, notifica al padre para que refresque los datos y cierre el panel.
5. En caso de error, muestra un mensaje de error inline dentro del panel.

## Restricciones

- La lógica de la llamada a `DELETE /api/reservations/:id` vive en el padre, no en el componente — el panel solo recibe el callback `onCancelReservation`.
- La visibilidad del botón se determina exclusivamente por props, nunca por lógica interna del componente.
- No mostrar el botón para mesas fijas (`type === "fixed"`) aunque estén rojas — las mesas fijas no tienen reserva cancelable, son asignaciones permanentes.
- El botón debe estar deshabilitado durante la petición para evitar doble envío.
- No comparar por nombre de usuario para determinar la propiedad — usar `currentUserId` comparando contra el `userId` de la reserva. El panel necesita que el padre pase este dato.

## Condición de visibilidad del botón

El botón "Cancelar reserva" se muestra **únicamente** cuando se cumplen todas las condiciones:

| Condición | Criterio |
|---|---|
| Mesa ocupada con reserva | `table.status === "red"` y `table.reservation !== null` |
| Tipo de mesa reservable | `table.type !== "fixed"` |
| La reserva es del usuario actual | `table.reservation._id` está disponible y el padre confirma la propiedad vía `isOwnReservation` |

Para simplificar la lógica en el componente, el padre calcula y pasa `isOwnReservation: boolean` directamente.

## Props nuevas en `DeskDetailPanel`

Acumulando las de OP-231 y OP-232:

```ts
interface DeskDetailPanelProps {
  table: TableAvailability | null;
  onClose: () => void;
  // OP-232:
  selectedDate: string;
  userHasReservationToday: boolean;
  onReserve: (tableId: string, date: string) => Promise<void>;
  // Nuevas en OP-233:
  isOwnReservation: boolean; // true si table.reservation pertenece al usuario actual
  onCancelReservation: (reservationId: string) => Promise<void>;
}
```

El padre calcula `isOwnReservation` comparando `session.user.id` con el userId de la reserva activa en la mesa seleccionada (información disponible en el array `TableAvailability[]` o en la sesión).

## Flujo de interacción

1. Usuario pulsa el botón "Cancelar reserva".
2. El botón pasa a estado cargando (deshabilitado, texto "Cancelando…").
3. Se llama a `onCancelReservation(table.reservation._id)`.
4. El padre ejecuta `DELETE /api/reservations/:id`.
5a. Éxito (200): el padre refresca los datos del plano y cierra el panel.
5b. Error (4xx/5xx): el panel muestra el mensaje de error inline; el botón vuelve a estar activo.

## Casos límite

- Mesa `red` de tipo `fixed` — no mostrar el botón (no es una reserva, es una asignación permanente).
- Mesa `red` con `reservation !== null` pero `isOwnReservation === false` — no mostrar el botón (ocupada por otro usuario).
- Mesa `red` con `reservation === null` — situación de mesa fija sin reserva; no mostrar el botón.
- Usuario pulsa "Cancelar" dos veces seguidas — la segunda pulsación no dispara otra llamada (botón deshabilitado durante la petición).
- Error 403 de la API (no es el propietario) — mostrar mensaje de error inline; no debería ocurrir si la lógica de `isOwnReservation` es correcta, pero hay que manejarlo.
- Error de red — mostrar mensaje genérico; el botón vuelve a estar activo.

## Criterios de aceptación

- AC-1: El botón "Cancelar reserva" aparece en el `DeskDetailPanel` cuando `table.status === "red"`, `table.type !== "fixed"`, `table.reservation !== null` e `isOwnReservation === true`.
- AC-2: El botón no aparece (no está en el DOM) en ningún otro caso: mesa verde, amarilla, gris, fija, ocupada por otro usuario, o sin reserva.
- AC-3: Al pulsar el botón, se llama a `onCancelReservation(table.reservation._id)` exactamente una vez.
- AC-4: Durante la llamada, el botón está deshabilitado y muestra "Cancelando…" o similar.
- AC-5: Si `onCancelReservation` resuelve con éxito, el padre cierra el panel y refresca los datos (responsabilidad del padre).
- AC-6: Si `onCancelReservation` lanza un error, el panel muestra el mensaje de error inline y el botón vuelve a estar activo.
- AC-7: Las props `isOwnReservation` y `onCancelReservation` están tipadas correctamente en la interfaz de `DeskDetailPanel`.
- AC-8: No coexisten los botones "Reservar" y "Cancelar reserva" en el mismo estado del panel — son mutuamente excluyentes por definición de las condiciones de visibilidad.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- **Fecha**: 2026-06-17
- **Rama**: feature/OP-230-detalle-mesa-accion-reserva
- **Commit**: d6ad0ac

### Estado de AC

| AC | Estado | Notas |
|---|---|---|
| AC-1 | PASS | `canCancel` calculado con `status === "red"`, `type !== "fixed"`, `reservation !== null` e `isOwnReservation === true` |
| AC-2 | PASS | Botón ausente del DOM en todos los demás estados gracias a renderizado condicional |
| AC-3 | PASS | `handleCancel` llama a `onCancelReservation(table.reservation._id)` una sola vez; botón deshabilitado durante la petición |
| AC-4 | PASS | Estado `isCancelling` deshabilita el botón y muestra "Cancelando…" |
| AC-5 | PASS | El padre (`FloorPlanClient`) cierra el panel y llama a `onReservationCreated` tras cancelación exitosa |
| AC-6 | PASS | Error capturado en `handleCancel`, mostrado inline en `cancelError`; botón vuelve a estar activo en `finally` |
| AC-7 | PASS | Props tipadas en `DeskDetailPanelProps`: `isOwnReservation: boolean` y `onCancelReservation: (reservationId: string) => Promise<void>` |
| AC-8 | PASS | `canReserve` requiere `status === "green"/"yellow"`; `canCancel` requiere `status === "red"` — condiciones mutuamente excluyentes |

### Ficheros modificados

- `src/domain/types/table.ts` — añadido `userId: string` a `TableAvailability.reservation`
- `src/services/availability.service.ts` — añadido `userId` en ambos mapeos (por día y por rango)
- `src/components/floor-plan/DeskDetailPanel.tsx` — nuevas props, estado `isCancelling`/`cancelError`, handler `handleCancel`, condición `canCancel`, botón y mensaje de error inline
- `src/components/floor-plan/use-cancel-reservation.ts` — nuevo hook `useCancelReservation` (DELETE /api/reservations/:id)
- `src/components/floor-plan/FloorPlanClient.tsx` — nueva prop `currentUserId`, cálculo de `isOwnReservation`, handler `handleCancelReservation` vía `useCancelReservation`
- `src/app/(main)/page.tsx` — prop `currentUserId={session.user.id}` pasada a `FloorPlanClient`

### Verify

| Check | Estado |
|---|---|
| Lint | PASS (0 errores) |
| Tests unitarios | PASS (122/122) |
| Build | PASS |

### AI-assisted

Sí — implementación completa asistida por Claude Code.
