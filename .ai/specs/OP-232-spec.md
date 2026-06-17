# OP-232 — Botón de reservar

## Contexto

El `DeskDetailPanel` (OP-231) muestra información de la mesa seleccionada. Esta subtarea añade la acción de reserva: un botón "Reservar" que aparece en el panel cuando la mesa está disponible y el usuario no tiene ya una reserva para ese día. El endpoint `POST /api/reservations` ya existe y recibe `{ tableId, date }`.

La disponibilidad del día activo (fecha seleccionada en el `DateSelector`) ya está en el array `TableAvailability[]` que se pasa al plano. El `DeskDetailPanel` recibe la mesa seleccionada como `TableAvailability`, que incluye `status`, `reservation` y `assignedUser`. Para saber si el usuario actual ya tiene reserva ese día, el padre debe pasar esa información como prop adicional.

## Objetivo

Añadir al `DeskDetailPanel` un botón "Reservar" que:

1. Solo se muestra cuando la mesa está disponible para reservar (`status === "green"` o `status === "yellow"`) y el usuario no tiene ninguna reserva confirmada ese día.
2. Al pulsarlo, llama a `POST /api/reservations` con `tableId` y `date`.
3. Muestra estado de carga mientras la petición está en curso (botón deshabilitado + indicador visual).
4. En caso de éxito, notifica al padre para que refresque los datos y cierre el panel (o actualice el estado de la mesa).
5. En caso de error, muestra un mensaje de error inline dentro del panel.

## Restricciones

- La lógica de la llamada a la API vive fuera del componente, en un hook o función auxiliar — el componente solo recibe callbacks y props.
- El componente no gestiona el estado global de reservas: el padre es responsable de refrescar los datos tras una reserva exitosa.
- No introducir librerías de formularios ni de estado global (no Redux, no Zustand, no React Query por ahora).
- La visibilidad del botón se determina exclusivamente por props, nunca por lógica interna del componente.
- El botón debe estar deshabilitado durante la petición para evitar doble envío.
- No mostrar el botón si `status === "red"` o `status === "gray"`, independientemente de cualquier otro factor.

## Condición de visibilidad del botón

El botón "Reservar" se muestra **únicamente** cuando se cumplen las dos condiciones a la vez:

| Condición | Criterio |
|---|---|
| Mesa reservable | `table.status === "green"` o `table.status === "yellow"` |
| Usuario sin reserva ese día | `userHasReservationToday === false` |

Si alguna condición falla, el botón no se muestra (no se deshabilita, directamente no existe en el DOM). Los mensajes informativos para estos casos son responsabilidad de OP-234.

## Props nuevas en `DeskDetailPanel`

```ts
interface DeskDetailPanelProps {
  table: TableAvailability | null;
  onClose: () => void;
  // Nuevas en OP-232:
  selectedDate: string;           // YYYY-MM-DD — fecha activa del DateSelector
  userHasReservationToday: boolean; // true si el usuario ya tiene reserva ese día
  onReserve: (tableId: string, date: string) => Promise<void>; // callback de reserva
}
```

## Flujo de interacción

1. Usuario pulsa el botón "Reservar".
2. El botón pasa a estado cargando (deshabilitado, spinner o texto "Reservando…").
3. Se llama a `onReserve(table.tableId, selectedDate)`.
4. El padre ejecuta `POST /api/reservations` con `{ tableId, date }`.
5a. Éxito (201): el padre refresca los datos del plano y cierra el panel.
5b. Error (4xx/5xx): el panel muestra el mensaje de error devuelto por la API; el botón vuelve a estar activo.

## Casos límite

- Usuario pulsa "Reservar" dos veces seguidas antes de recibir respuesta — la segunda pulsación no dispara otra llamada (botón deshabilitado durante la petición).
- La API devuelve 409 (conflicto) porque otro usuario reservó mientras — mostrar mensaje "Esta mesa ya está reservada para este día" sin cerrar el panel.
- La API devuelve 409 porque el usuario ya tiene reserva — mostrar mensaje "Ya tienes una reserva para este día" sin cerrar el panel.
- Error de red (fetch falla) — mostrar mensaje genérico de error; el botón vuelve a estar activo.
- Mesa `yellow` (preferente de otro usuario) — el botón aparece igualmente si el usuario no tiene reserva ese día (la mesa es reservable).

## Criterios de aceptación

- AC-1: El botón "Reservar" aparece en el `DeskDetailPanel` cuando `table.status` es `"green"` o `"yellow"` y `userHasReservationToday` es `false`.
- AC-2: El botón no aparece (no está en el DOM) cuando `table.status` es `"red"` o `"gray"`, o cuando `userHasReservationToday` es `true`.
- AC-3: Al pulsar el botón, se llama a `onReserve(table.tableId, selectedDate)` exactamente una vez.
- AC-4: Durante la llamada, el botón está deshabilitado y muestra un indicador de carga ("Reservando…" o similar).
- AC-5: Si `onReserve` resuelve con éxito, el padre cierra el panel y refresca los datos (responsabilidad del padre, no del panel).
- AC-6: Si `onReserve` lanza un error, el panel muestra el mensaje de error dentro del panel y el botón vuelve a estar activo.
- AC-7: Las props `selectedDate`, `userHasReservationToday` y `onReserve` están tipadas correctamente en la interfaz de `DeskDetailPanel`.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-06-17 17:00 (CET)
- Rama: feature/OP-230-detalle-mesa-accion-reserva
- Commit: 4fee550
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – botón visible cuando `status` es `green`/`yellow` y `userHasReservationToday=false`; cubierto por tests `canReserve`
  - AC-2: PASS – botón ausente del DOM cuando `status` es `red`/`gray` o `userHasReservationToday=true`; cubierto por tests `canReserve`
  - AC-3: PASS – un solo clic dispara exactamente una llamada a `POST /api/reservations`; cubierto por test de `callReserveApi`
  - AC-4: PASS – botón deshabilitado con texto "Reservando…" mientras `isLoading=true`; estado gestionado en `DeskDetailPanel` via `isReserving`
  - AC-5: PASS – en éxito el padre cierra el panel (`setSelectedTable(null)`) y llama a `onReservationCreated`; responsabilidad de `FloorPlanClient`
  - AC-6: PASS – `useReserve` devuelve el mensaje de error de la API; `handleReserve` lanza `Error(errorMsg)` que `DeskDetailPanel` captura y muestra con `role="alert"`; cubierto por tests de `callReserveApi`
  - AC-7: PASS – `selectedDate: string`, `userHasReservationToday: boolean`, `onReserve: (tableId, date) => Promise<void>` tipados en `DeskDetailPanelProps`; TypeScript strict sin errores
- Ficheros creados o modificados:
  - `src/components/floor-plan/use-reserve.ts` (nuevo)
  - `src/components/floor-plan/DeskDetailPanel.tsx` (modificado)
  - `src/components/floor-plan/FloorPlanClient.tsx` (modificado)
  - `src/components/floor-plan/index.ts` (modificado — exporta `useReserve`)
  - `src/app/(main)/page.tsx` (modificado — pasa `userHasReservationToday={false}` temporal)
  - `tests/unit/desk-detail-panel-reserve.test.ts` (nuevo)
- verify:
  - Comando ejecutado: `npm run lint && npm run test:unit && npm run test:integration && npm run test:api && npm run build`
  - Resultado: PASS — lint 0 errores, 122 tests unitarios, 102 integración, 85 API, build OK
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa — hook, componente, tests, integración en FloorPlanClient
- Decisiones técnicas:
  - `useReserve` devuelve `string | null` en lugar de `boolean + errorMessage` separado, para evitar el problema de timing de closures en `handleReserve`
  - `handleReserve` en `FloorPlanClient` lanza `Error(errorMsg)` para que `DeskDetailPanel` lo capture con su propio `try/catch`; esto mantiene el estado de error local al panel (como exige la spec)
  - El estado `isReserving` y `reserveError` viven en `DeskDetailPanel` (no en el hook) para que el componente controle su propio UI de carga/error, mientras el hook solo gestiona la petición HTTP
  - `userHasReservationToday={false}` en `page.tsx` es temporal hasta OP-240 (integración con API de disponibilidad)
