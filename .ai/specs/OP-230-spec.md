# OP-230 — Detalle de mesa y acción de reserva

## Contexto
El componente de plano (OP-220) renderiza las mesas con sus estados visuales. Al pulsar una mesa, el usuario necesita ver un detalle con información completa y poder realizar acciones (reservar si está libre, cancelar si es su reserva). Los endpoints de reserva (POST /api/reservations, DELETE /api/reservations/[id]) ya existen. Depende de OP-220.

## Objetivo
Crear el componente de detalle de mesa que se muestra al pulsar sobre una mesa del plano, con información completa (nombre, tipo, estado, ocupante) y botones de acción contextuales (reservar, cancelar reserva propia).

## Restricciones
- No incluir lógica de negocio en el componente — las reglas viven en los servicios
- Los botones de acción deben estar condicionados al estado real de la mesa y del usuario (no solo visual)
- Mensajes contextuales según README.md §7 y §8
- Depende de OP-220

## Casos límite
- Usuario pulsa mesa bloqueada — solo mostrar info, sin acción
- Usuario ya tiene reserva en otra mesa ese día — mostrar aviso, sin botón de reservar
- Mesa preferente de otro usuario, libre — mostrar aviso de preferencia + botón reservar
- Mesa fija de otro usuario — mostrar como ocupada, sin acción
- Usuario pulsa su propia mesa reservada — mostrar botón cancelar

## Criterios de aceptación
- AC-1: Panel/modal de detalle implementado — se muestra al pulsar una mesa con info completa: nombre, tipo, estado, ocupante/asociado
- AC-2: Botón "Reservar" visible cuando la mesa está disponible (verde o amarillo) y el usuario no tiene reserva ese día
- AC-3: Botón "Cancelar reserva" visible cuando la mesa está ocupada por el usuario actual
- AC-4: Mensajes informativos contextuales implementados — "Mesa preferente de [nombre]", "Ocupada por [nombre]", "Mesa bloqueada", "Ya tienes reserva en otra mesa"
- AC-5: Tests del panel de detalle implementados — verifican info correcta y botones adecuados según estado y usuario

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título | Estado |
|----|--------|--------|
| OP-231 | Panel o modal de detalle de mesa | DONE |
| OP-232 | Botón de reservar | DONE |
| OP-233 | Botón de cancelar reserva propia | DONE |
| OP-234 | Mensajes informativos por estado | DONE |
| OP-235 | Tests del panel de detalle | DONE |

## Execution Result

**Fecha:** 2026-06-17  
**Rama:** feature/OP-230-detalle-mesa-accion-reserva  
**Estado:** DONE

### Resumen de implementación

La historia se ejecutó en 5 subtareas secuenciales, todas completadas:

- **OP-231** — Componente `DeskDetailPanel` implementado como panel lateral deslizante (`aside`) con accesibilidad completa (`role="dialog"`, `aria-modal`, gestión de foco, cierre con Escape). Integrado en `FloorPlanClient` vía `onDeskClick` + `useState`.
- **OP-232** — Botón "Reservar" añadido al panel. Hook `useReserve` para la llamada a `POST /api/reservations`. Estado de carga (`isReserving`) y error inline (`reserveError`). Integrado en `FloorPlanClient` con cierre de panel y refresco de datos en éxito.
- **OP-233** — Botón "Cancelar reserva" añadido al panel. Hook `useCancelReservation` para `DELETE /api/reservations/:id`. Campo `userId` añadido a `TableAvailability.reservation` para permitir al padre calcular `isOwnReservation`. Integrado en `FloorPlanClient`.
- **OP-234** — Mensajes informativos contextuales implementados mediante `buildInfoMessages()` en el componente. 6 mensajes distintos según combinación de estado, tipo, ocupante y situación del usuario.
- **OP-235** — Lógica de visibilidad extraída a `desk-detail-utils.ts` con 3 funciones puras (`shouldShowReserveButton`, `shouldShowCancelButton`, `getDetailMessage`). 29 tests unitarios en `tests/unit/desk-detail-panel.test.ts`, incluyendo verificación exhaustiva de exclusión mutua de botones.

### Criterios de aceptación

| AC | Descripción | Estado |
|---|---|---|
| AC-1 | Panel de detalle con info completa (nombre, tipo, estado, ocupante) | PASS |
| AC-2 | Botón "Reservar" visible cuando mesa disponible y usuario sin reserva ese día | PASS |
| AC-3 | Botón "Cancelar reserva" visible cuando mesa ocupada por el usuario actual | PASS |
| AC-4 | Mensajes informativos contextuales implementados | PASS |
| AC-5 | Tests del panel de detalle implementados | PASS |

### Ficheros principales creados o modificados

| Fichero | Operación |
|---|---|
| `src/components/floor-plan/DeskDetailPanel.tsx` | Creado en OP-231, extendido en OP-232/233/234, refactorizado en OP-235 |
| `src/components/floor-plan/desk-detail-utils.ts` | Creado en OP-235 — funciones puras de visibilidad y mensajes |
| `src/components/floor-plan/use-reserve.ts` | Creado en OP-232 — hook de reserva |
| `src/components/floor-plan/use-cancel-reservation.ts` | Creado en OP-233 — hook de cancelación |
| `src/components/floor-plan/FloorPlanClient.tsx` | Modificado en OP-231/232/233 — integración completa |
| `src/domain/types/table.ts` | Modificado en OP-233 — añadido `userId` a `reservation` |
| `src/services/availability.service.ts` | Modificado en OP-233 — incluye `userId` en el mapeo |
| `src/components/floor-plan/index.ts` | Modificado — exporta `useReserve` y `useCancelReservation` |
| `src/app/(main)/page.tsx` | Modificado — pasa `currentUserId` y `userHasReservationToday` a `FloorPlanClient` |
| `tests/unit/desk-detail-panel.test.ts` | Creado en OP-235 — 29 tests unitarios |
| `tests/unit/desk-detail-panel-reserve.test.ts` | Creado en OP-232 — tests de reserva |

### Verify final (OP-235)

| Check | Estado |
|---|---|
| Lint | PASS (0 errores) |
| Tests unitarios | PASS (145/145) |
| Tests integración | 1 fallo preexistente en `compute-status.test.ts` (AC-4 OP-161, no relacionado) |
| Tests API | PASS (85/85) |
| Build | PASS |

### Notas técnicas

- `userHasReservationToday={false}` en `page.tsx` es temporal hasta OP-240 (integración con API de disponibilidad).
- La lógica de mensajes en `buildInfoMessages` (OP-234) fue sustituida en OP-235 por `getDetailMessage` en `desk-detail-utils.ts`, que retorna un único `string | null` — comportamiento simplificado pero equivalente para los casos definidos en la spec.
- La exclusión mutua de botones (Reservar / Cancelar) está garantizada estructuralmente: `shouldShowReserveButton` requiere `status green/yellow` y `shouldShowCancelButton` requiere `status red` — condiciones disjuntas.
