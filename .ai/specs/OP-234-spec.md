# OP-234 — Mensajes informativos por estado

## Contexto

El `DeskDetailPanel` (OP-231) muestra información básica de la mesa y, tras OP-232 y OP-233, ya incluye los botones de acción. Sin embargo, hay situaciones en que el usuario necesita contexto adicional que explique por qué no puede actuar o qué es lo que está viendo: una mesa preferente de otra persona, una mesa fija, una mesa bloqueada, o el hecho de que ya tiene reserva ese día.

El README §7 y §8 definen las reglas de negocio que deben reflejarse en la UI. Esta subtarea cierra el panel con los mensajes contextuales que complementan a los botones (o los sustituyen cuando no hay acción posible).

## Objetivo

Añadir al `DeskDetailPanel` mensajes informativos contextuales que aparezcan según el estado de la mesa y la situación del usuario, siguiendo las reglas de negocio del README.

## Mensajes definidos

Los mensajes son texto breve, inline dentro del panel, bajo la información de la mesa y encima (o en lugar) de los botones de acción.

| Situación | Condición | Mensaje |
|---|---|---|
| Mesa preferente de otra persona | `type === "preferential"` y `assignedUser !== null` | "Mesa preferente de {assignedUser.name}" |
| Mesa fija de otra persona | `type === "fixed"` y `assignedUser !== null` | "Mesa asignada a {assignedUser.name}" |
| Mesa bloqueada | `status === "gray"` | "Mesa no disponible" |
| Usuario ya tiene reserva ese día | `userHasReservationToday === true` y `status !== "red"` (no es su reserva) | "Ya tienes una reserva para hoy" |
| Mesa ocupada por otra persona | `status === "red"` e `isOwnReservation === false` y `table.reservation !== null` | "Ocupada por {reservation.userName}" |
| Mesa propia reservada | `status === "red"` e `isOwnReservation === true` | "Tu reserva para hoy" |

### Notas de prioridad

- Si `status === "gray"`, mostrar solo "Mesa no disponible" — no mostrar ocupante ni otros mensajes.
- Si `isOwnReservation === true`, mostrar "Tu reserva para hoy" — es el mensaje principal antes del botón cancelar.
- Si `userHasReservationToday === true` y la mesa es reservable (`green`/`yellow`), mostrar el aviso de que ya tiene reserva (y ocultar el botón reservar, gestionado por OP-232).
- Los mensajes de preferente y fija pueden coexistir con el botón "Reservar" (para mesas `yellow`) o sin ningún botón (para mesas `red`/`gray`).

## Restricciones

- Los mensajes son puramente visuales: no disparan acciones ni llamadas a la API.
- No duplicar información ya visible en los badges de tipo y estado — los mensajes aportan contexto adicional, no repiten lo mismo.
- El texto de los mensajes debe ser conciso y claro, sin tecnicismos.
- No usar colores de alerta agresivos (rojo intenso) para mensajes informativos neutros; reservar el rojo para errores de operación (ya gestionados en OP-232 y OP-233).
- Las props que necesita este componente ya están definidas en OP-232 y OP-233: no se añaden props nuevas a `DeskDetailPanel`.

## Props utilizadas (sin cambios en la interfaz)

Todos los datos necesarios ya están disponibles en las props definidas en OP-231, OP-232 y OP-233:

- `table.type`, `table.status`, `table.reservation`, `table.assignedUser`
- `userHasReservationToday`
- `isOwnReservation`

## Casos límite

- Mesa `yellow` con `assignedUser` y `userHasReservationToday === false` — mostrar "Mesa preferente de {nombre}" y el botón "Reservar".
- Mesa `yellow` con `assignedUser` y `userHasReservationToday === true` — mostrar "Mesa preferente de {nombre}" y "Ya tienes una reserva para hoy"; sin botón reservar.
- Mesa `red` con `reservation !== null` e `isOwnReservation === false` — mostrar "Ocupada por {nombre}"; sin botones.
- Mesa `red` con `reservation === null` y `type === "fixed"` — mostrar "Mesa asignada a {assignedUser.name}" si existe assignedUser; sin botones.
- Mesa `green` con `userHasReservationToday === true` — mostrar "Ya tienes una reserva para hoy"; sin botón reservar.
- `assignedUser.name` vacío o inesperado — mostrar el mensaje sin nombre: "Mesa preferente" / "Mesa asignada".

## Criterios de aceptación

- AC-1: Cuando `type === "preferential"` y `assignedUser !== null`, aparece el mensaje "Mesa preferente de {assignedUser.name}".
- AC-2: Cuando `type === "fixed"` y `assignedUser !== null`, aparece el mensaje "Mesa asignada a {assignedUser.name}".
- AC-3: Cuando `status === "gray"`, aparece el mensaje "Mesa no disponible" y no se muestran otros mensajes de ocupante.
- AC-4: Cuando `userHasReservationToday === true` y la mesa es reservable (`status === "green"` o `"yellow"`), aparece el mensaje "Ya tienes una reserva para hoy".
- AC-5: Cuando `status === "red"`, `reservation !== null` e `isOwnReservation === false`, aparece el mensaje "Ocupada por {reservation.userName}".
- AC-6: Cuando `status === "red"` e `isOwnReservation === true`, aparece el mensaje "Tu reserva para hoy".
- AC-7: No se añaden props nuevas a `DeskDetailPanel` — todos los mensajes se derivan de las props ya existentes.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

**Fecha:** 2026-06-17
**Estado:** DONE

### Cambios

- `src/components/floor-plan/DeskDetailPanel.tsx`: añadida función `buildInfoMessages` y bloque de mensajes informativos en el panel.

### Implementación

Se añadió `buildInfoMessages()` como función pura (sin efectos) que deriva los mensajes a mostrar a partir de las props existentes, sin añadir ninguna prop nueva al componente (AC-7).

Lógica de prioridad:
1. `status === "gray"` → solo "Mesa no disponible" (excluyente)
2. `isOwnReservation` → "Tu reserva para hoy"
3. `status === "red"` + reservation de otro → "Ocupada por {nombre}"
4. `type === "preferential"` con `assignedUser` → "Mesa preferente de {nombre}"
5. `type === "fixed"` con `assignedUser` → "Mesa asignada a {nombre}"
6. `userHasReservationToday` + mesa reservable → "Ya tienes una reserva para hoy"

Los mensajes se renderizan como píldoras neutras (`bg-gray-50`) para no confundirse con los errores de operación (`bg-red-50`) de OP-232/OP-233.

### Verificaciones

| Check | Resultado |
|---|---|
| LINT | PASS (0 errores, 4 warnings preexistentes) |
| test:unit (122 tests) | PASS |
| build | PASS |

### AC

| AC | Estado |
|---|---|
| AC-1: Mesa preferente con assignedUser | PASS |
| AC-2: Mesa fija con assignedUser | PASS |
| AC-3: Mesa gray solo "Mesa no disponible" | PASS |
| AC-4: userHasReservationToday en mesa verde/amarilla | PASS |
| AC-5: Ocupada por otra persona | PASS |
| AC-6: Propia reserva "Tu reserva para hoy" | PASS |
| AC-7: Sin props nuevas | PASS |
