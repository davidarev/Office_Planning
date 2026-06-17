# OP-242 — Carga de datos al cambiar día

## Contexto

El hook `useAvailability` (OP-241) ya existe y encapsula la llamada a `GET /api/availability?date=YYYY-MM-DD`. El selector de día ya está implementado (OP-210) y expone `selectedDay.dateString` via `useDateSelection()`. La página principal (`src/app/(main)/page.tsx`) actualmente pasa `tables={[]}` a `FloorPlanClient` de forma estática.

Esta subtarea conecta el selector de día con el hook para que el plano muestre datos reales de disponibilidad al seleccionar cualquier día. También gestiona la prop `userHasReservationToday` en función de los datos recibidos.

## Objetivo

1. Conectar `useAvailability` con la página principal para que `FloorPlanClient` reciba datos reales al cambiar de día.
2. Derivar `userHasReservationToday` a partir de los datos de disponibilidad recibidos.
3. Pasar un callback `onReservationCreated` que fuerce la recarga del estado al confirmar una reserva o cancelación.

La lógica de carga y error se muestra en la UI en OP-244 — esta subtarea solo conecta los datos al plano.

## Restricciones

- No duplicar lógica de fetching en la página: toda la lógica de llamada al API vive en `useAvailability`.
- No introducir estado global ni contexto nuevo: el estado de disponibilidad vive en el componente que usa el hook.
- La página `(main)/page.tsx` es un Server Component — la parte con hooks debe moverse o encapsularse en un Client Component.
- `userHasReservationToday` se calcula a partir de los datos: hay reserva del usuario actual si algún `TableAvailability` tiene `reservation.userId === currentUserId`.
- No implementar estados de carga ni error visibles en esta subtarea — eso es OP-244.

## Diseño de la integración

La página `(main)/page.tsx` obtiene la sesión y renderiza un Client Component `FloorPlanSection` (o similar) que:

1. Usa `useDateSelection()` para obtener `selectedDay.dateString`.
2. Usa `useAvailability(selectedDay.dateString)` para obtener `data`.
3. Deriva `userHasReservationToday = data?.some(t => t.reservation?.userId === currentUserId) ?? false`.
4. Pasa `tables={data ?? []}` y `userHasReservationToday` a `FloorPlanClient`.
5. Expone `refetch` como `onReservationCreated` para forzar recarga tras operaciones.

Este Client Component debe estar dentro de `DateSelectionProvider` para poder usar `useDateSelection()`.

## Casos límite

- `data` es `null` mientras carga — pasar `tables={[]}` para no romper el plano.
- El usuario no tiene reserva en ninguna mesa ese día — `userHasReservationToday = false`.
- `currentUserId` no coincide con ninguna reserva en los datos — sin cambios, comportamiento correcto.
- El día cambia y la petición anterior se aborta — el plano queda con los datos anteriores hasta que llega la nueva respuesta (gestión de `data` en el hook).

## Criterios de aceptación

- AC-1: Al seleccionar un día diferente en el selector, el plano se recarga con los datos de disponibilidad de ese día.
- AC-2: `tables` en `FloorPlanClient` refleja los datos reales del endpoint, no un array vacío.
- AC-3: `userHasReservationToday` es `true` si el usuario actual tiene reserva en alguna mesa del día seleccionado, `false` en caso contrario.
- AC-4: Después de una reserva o cancelación exitosa (`onReservationCreated`), los datos de disponibilidad se recargan automáticamente.
- AC-5: Mientras se carga la disponibilidad, `tables` es el array vacío o los datos anteriores (no hay crash).
- AC-6: El código compilado y el build pasan sin errores de TypeScript.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-06-17 17:48 (CET)
- Rama: feature/OP-240-integracion-api-disponibilidad
- Commit: 8e5ea1c3755b42ca96267a2f4f5644b61a3e50e4
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – al cambiar día en DateSelectionProvider, FloorPlanSection llama a useAvailability con el nuevo dateString
  - AC-2: PASS – `tables={data ?? []}` pasa datos reales del endpoint; `[]` solo mientras carga
  - AC-3: PASS – `userHasReservationToday` se deriva con `data?.some(t => t.reservation?.userId === currentUserId) ?? false`
  - AC-4: PASS – `onReservationCreated={refetch}` en FloorPlanClient; refetch incrementa fetchCounter en el hook
  - AC-5: PASS – `data ?? []` garantiza que tables es siempre un array válido; no hay crash con data=null
  - AC-6: PASS – build en verde sin errores TypeScript (Next.js 16 Turbopack)
- Ficheros creados o modificados:
  - `src/components/floor-plan/FloorPlanSection.tsx` (creado)
  - `src/components/floor-plan/index.ts` (exporta FloorPlanSection)
  - `src/app/(main)/page.tsx` (usa FloorPlanSection en lugar de FloorPlanClient directo)
- verify:
  - Comando ejecutado: `npm run build` + `npm run test`
  - Resultado: BUILD PASS — build sin errores TypeScript. TESTS: 343 PASS / 1 FAIL preexistente (compute-status.test.ts, deuda técnica anterior no relacionada con OP-242)
- AI-assisted:
  - Herramienta(s): Claude Code (claude-sonnet-4-6)
  - Alcance: diseño e implementación completa de FloorPlanSection, actualización de page.tsx e index.ts, Execution Result y suite de verify
- Decisiones técnicas:
  - Se optó por un componente `FloorPlanSection` dedicado en lugar de `FloorPlanConnected` u otros nombres para dejar claro que es la sección del plano a nivel de página, separando la responsabilidad de conexión API del propio `FloorPlanClient` (que gestiona selección y panel)
  - `data ?? []` en lugar de mantener datos anteriores al cambiar fecha: el hook ya retorna null durante la carga (setData(null) en useEffect), por lo que el plano queda vacío hasta recibir respuesta — comportamiento coherente con AC-5
