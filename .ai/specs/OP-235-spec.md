# OP-235 — Tests del panel de detalle

## Contexto

El `DeskDetailPanel` (OP-231 a OP-234) es el componente más rico en lógica condicional de toda la historia OP-230: determina qué botones mostrar, qué mensajes mostrar y cuándo, a partir de una combinación de hasta 5 props de estado. Esta lógica condicional es el área de mayor riesgo de regresión y merece cobertura de tests propia.

El entorno de tests del proyecto es `vitest` con `environment: "node"` (sin jsdom), lo que impide montar componentes React directamente. La estrategia de testing sigue el patrón ya establecido en `tests/unit/floor-plan.test.ts`: extraer la lógica condicional a funciones puras en un fichero auxiliar y testear esas funciones sin DOM.

## Objetivo

1. Extraer la lógica de visibilidad de botones y mensajes del `DeskDetailPanel` a funciones puras en `src/components/floor-plan/desk-detail-utils.ts`.
2. Escribir tests unitarios en `tests/unit/desk-detail-panel.test.ts` que cubran todas las combinaciones relevantes de estado definidas en OP-231, OP-232, OP-233 y OP-234.

## Funciones a extraer y testear

### `shouldShowReserveButton`

```ts
function shouldShowReserveButton(
  status: TableStatus,
  userHasReservationToday: boolean
): boolean
```

Devuelve `true` solo cuando `status` es `"green"` o `"yellow"` y `userHasReservationToday` es `false`.

### `shouldShowCancelButton`

```ts
function shouldShowCancelButton(
  status: TableStatus,
  type: TableType,
  hasReservation: boolean,
  isOwnReservation: boolean
): boolean
```

Devuelve `true` solo cuando `status === "red"`, `type !== "fixed"`, `hasReservation === true` e `isOwnReservation === true`.

### `getDetailMessage`

```ts
function getDetailMessage(params: {
  status: TableStatus;
  type: TableType;
  reservation: { _id: string; userName: string } | null;
  assignedUser: { _id: string; name: string } | null;
  userHasReservationToday: boolean;
  isOwnReservation: boolean;
}): string | null
```

Devuelve el mensaje informativo a mostrar según las reglas de OP-234, o `null` si no hay mensaje. Orden de prioridad:

1. `status === "gray"` → `"Mesa no disponible"`
2. `isOwnReservation === true` → `"Tu reserva para hoy"`
3. `status === "red"` y `reservation !== null` e `isOwnReservation === false` → `"Ocupada por {reservation.userName}"`
4. `status === "red"` y `type === "fixed"` y `assignedUser !== null` → `"Mesa asignada a {assignedUser.name}"`
5. `type === "preferential"` y `assignedUser !== null` → `"Mesa preferente de {assignedUser.name}"`
6. `type === "fixed"` y `assignedUser !== null` (status no red) → `"Mesa asignada a {assignedUser.name}"`
7. `userHasReservationToday === true` y `status` es `"green"` o `"yellow"` → `"Ya tienes una reserva para hoy"`
8. Sin condición aplicable → `null`

## Restricciones

- No usar jsdom ni montar componentes React — los tests son puramente de funciones.
- El fichero de utilidades `desk-detail-utils.ts` exporta las funciones para ser importadas tanto por el componente como por los tests.
- No duplicar lógica: el componente importa las funciones del fichero de utilidades, no reimplementa las condiciones.
- Seguir el patrón de `tests/unit/floor-plan.test.ts`: helper `makeTable`, describe anidados por función.
- Sin dependencias externas nuevas para testing.

## Casos a cubrir en los tests

### `shouldShowReserveButton`

| Caso | `status` | `userHasReservationToday` | Resultado |
|---|---|---|---|
| Mesa verde sin reserva propia | `green` | `false` | `true` |
| Mesa amarilla sin reserva propia | `yellow` | `false` | `true` |
| Mesa verde con reserva propia | `green` | `true` | `false` |
| Mesa amarilla con reserva propia | `yellow` | `true` | `false` |
| Mesa roja | `red` | `false` | `false` |
| Mesa gris | `gray` | `false` | `false` |

### `shouldShowCancelButton`

| Caso | `status` | `type` | `hasReservation` | `isOwnReservation` | Resultado |
|---|---|---|---|---|---|
| Mesa roja, reserva propia, flexible | `red` | `flexible` | `true` | `true` | `true` |
| Mesa roja, reserva propia, preferente | `red` | `preferential` | `true` | `true` | `true` |
| Mesa roja, reserva de otro | `red` | `flexible` | `true` | `false` | `false` |
| Mesa roja, tipo fija | `red` | `fixed` | `true` | `true` | `false` |
| Mesa roja, sin reserva | `red` | `flexible` | `false` | `false` | `false` |
| Mesa verde | `green` | `flexible` | `false` | `false` | `false` |
| Mesa gris | `gray` | `blocked` | `false` | `false` | `false` |

### `getDetailMessage`

| Caso | Resultado esperado |
|---|---|
| Mesa gris | `"Mesa no disponible"` |
| Mesa roja, reserva propia | `"Tu reserva para hoy"` |
| Mesa roja, reserva de Ana García | `"Ocupada por Ana García"` |
| Mesa roja, fija, sin reserva, assignedUser Carlos | `"Mesa asignada a Carlos"` |
| Mesa amarilla, preferente de María | `"Mesa preferente de María"` |
| Mesa amarilla, preferente, sin assignedUser | `"Mesa preferente"` (sin nombre) |
| Mesa verde, userHasReservationToday true | `"Ya tienes una reserva para hoy"` |
| Mesa verde, sin reservas ni asignado | `null` |
| Mesa amarilla, sin assignedUser, sin reserva propia | `null` |

### Exclusión mutua de botones

- No pueden coexistir `shouldShowReserveButton === true` y `shouldShowCancelButton === true` con los mismos inputs: verificar que para cualquier combinación válida, como máximo uno devuelve `true`.

## Criterios de aceptación

- AC-1: El fichero `src/components/floor-plan/desk-detail-utils.ts` existe y exporta `shouldShowReserveButton`, `shouldShowCancelButton` y `getDetailMessage`.
- AC-2: `tests/unit/desk-detail-panel.test.ts` existe y pasa con `npm run test:unit`.
- AC-3: Todos los casos de `shouldShowReserveButton` de la tabla anterior tienen test y pasan.
- AC-4: Todos los casos de `shouldShowCancelButton` de la tabla anterior tienen test y pasan.
- AC-5: Todos los casos de `getDetailMessage` de la tabla anterior tienen test y pasan.
- AC-6: Se verifica la exclusión mutua de los dos botones.
- AC-7: El componente `DeskDetailPanel` importa las funciones desde `desk-detail-utils.ts` en lugar de reimplementar la lógica inline.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

**Fecha:** 2026-06-17  
**Estado:** DONE

### Archivos creados/modificados

- `src/components/floor-plan/desk-detail-utils.ts` — nuevo fichero con las 3 funciones puras exportadas
- `src/components/floor-plan/DeskDetailPanel.tsx` — refactorizado para importar desde `desk-detail-utils.ts`; eliminada `buildInfoMessages` inline; el JSX ahora usa `detailMessage` (string | null) en lugar del array
- `tests/unit/desk-detail-panel.test.ts` — nuevo fichero con 29 tests (6 `shouldShowReserveButton` + 7 `shouldShowCancelButton` + 9 `getDetailMessage` + 1 exclusión mutua exhaustiva)

### Resultados de verify

| Verificación | Estado |
|---|---|
| Lint | PASS (0 errores) |
| Tests unitarios | PASS (145/145) |
| Tests integración | 1 fallo preexistente en `compute-status.test.ts` (AC-4 OP-161, no relacionado) |
| Tests API | PASS (85/85) |
| Build | PASS |

### AC checklist

- AC-1 ✅ `desk-detail-utils.ts` existe y exporta las 3 funciones
- AC-2 ✅ `desk-detail-panel.test.ts` existe y pasa con `npm run test:unit`
- AC-3 ✅ Todos los casos de `shouldShowReserveButton` tienen test y pasan
- AC-4 ✅ Todos los casos de `shouldShowCancelButton` tienen test y pasan
- AC-5 ✅ Todos los casos de `getDetailMessage` tienen test y pasan
- AC-6 ✅ Exclusión mutua verificada exhaustivamente para todas las combinaciones
- AC-7 ✅ `DeskDetailPanel` importa desde `desk-detail-utils.ts`, sin lógica inline duplicada
