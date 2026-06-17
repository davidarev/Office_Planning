# OP-260 — Polling periódico y actualización

## Contexto

La integración con la API (OP-240) conectó el plano de mesas a `GET /api/availability` mediante
`useAvailability` (hook diario) y `useWeekAvailability` (hook semanal). El flujo de reserva y
cancelación (OP-250) añadió actualización optimista y rollback a través de `FloorPlanSection`.

El estado actual es: el plano sólo se refresca cuando el usuario cambia de día o tras una acción
propia (reserva/cancelación llama a `refetch()` en el hook). Los cambios de otros usuarios no
se reflejan hasta que el usuario recarga la página manualmente.

`FloorPlanSection` ya expone un punto de extensión natural: el `refetch` de `useAvailability`.
El polling se implementa como una capa de temporización encima de ese mecanismo existente, sin
rediseñar la arquitectura de hooks ni el flujo optimista.

El enfoque es **polling basado en `setInterval`** con pausa por Page Visibility API. No se
introduce ninguna otra estrategia de sincronización en tiempo real (prohibido por README.md §10).

---

## Objetivo

Crear un hook `usePolling` que dispare `refetch` periódicamente, y conectarlo a `FloorPlanSection`
de modo que el plano se refresque automáticamente cada 30 segundos sin perder los overrides
optimistas pendientes.

---

## Arquitectura de la solución

### Hook `usePolling`

Nuevo fichero: `src/hooks/use-polling.ts`

```ts
usePolling(callback: () => void, intervalMs: number, enabled?: boolean): void
```

Responsabilidades:
- Ejecuta `callback` cada `intervalMs` milisegundos mientras el tab sea visible.
- Pausa el intervalo cuando `document.visibilityState === "hidden"`.
- Al volver al tab (visibilitychange → visible), ejecuta `callback` inmediatamente y
  reinicia el intervalo.
- Si `enabled` es `false`, no ejecuta nada (útil para deshabilitar el polling durante
  operaciones en curso).
- Cancela el intervalo al desmontar el componente.
- No lanza nunca fetch propio: es agnóstico a la fuente de datos.

### Integración en `FloorPlanSection`

`FloorPlanSection` ya tiene `refetch` de `useAvailability`. Añadir:

```ts
const isOperationInProgress = isReserving || isCancelling;
usePolling(refetch, POLLING_INTERVAL_MS, !isOperationInProgress);
```

Constante: `POLLING_INTERVAL_MS = 30_000` (exportada para tests).

La reconciliación con overrides optimistas ya está resuelta por el diseño de OP-250:
- `applyOverrides` se aplica sobre los datos frescos del servidor en cada render.
- Los overrides sólo se limpian cuando `overrideDay !== selectedDay.dateString`.
- Un refetch del servidor no elimina el override mientras la operación no haya terminado.
- Durante `isReserving || isCancelling` el polling se desactiva (`enabled = false`) para
  evitar que un refetch en plena operación introduzca una race condition visual.

---

## Restricciones

- Sin WebSockets — solo polling periódico (README.md §10).
- Intervalo por defecto: 30 segundos. Configurable vía parámetro en `usePolling`.
- No mutar el estado optimista desde el polling; sólo llamar a `refetch`.
- No introducir ninguna librería externa para el scheduling.
- No perder overrides pendientes: el polling sólo actualiza datos del servidor; la capa
  `applyOverrides` ya maneja la reconciliación.
- `usePolling` no debe saber nada de disponibilidad, mesas ni reservas.
- El polling debe pausarse si hay una operación en curso (`isReserving || isCancelling`).

---

## Casos límite

| Caso | Comportamiento esperado |
|------|------------------------|
| Tab en background varios minutos | Al volver a foreground: ejecutar `refetch` inmediatamente, reiniciar intervalo |
| Tab vuelve mientras `isCancelling` | No lanzar refetch todavía; esperar a que `enabled` vuelva a `true` |
| `refetch` falla (error de red) | `useAvailability` ya maneja el error; el plano muestra `ErrorMessage`; el polling sigue intentando en el siguiente tick |
| Cambio de día durante polling | `useAvailability` cancela la petición anterior (AbortController); el polling sigue activo pero los datos se sirven para el nuevo día |
| `intervalMs` cambiado en runtime | El intervalo se reinicia con el nuevo valor (el `useEffect` de `usePolling` tiene `intervalMs` en sus deps) |
| Componente desmontado | `clearInterval` en el cleanup del `useEffect`; no hay fugas de memoria |
| Dos refetch casi simultáneos (polling + acción del usuario) | El segundo `fetch` lanzado por `useAvailability` aborta el primero gracias al `AbortController` existente |

---

## Criterios de aceptación

- **AC-1**: `usePolling` creado en `src/hooks/use-polling.ts`. Acepta `(callback, intervalMs, enabled?)`. Cuando `enabled` es `true` (o no se pasa), ejecuta `callback` cada `intervalMs` ms mientras el tab sea visible. No lanza peticiones por sí mismo.

- **AC-2**: Pausa por visibilidad implementada. Cuando `document.visibilityState` cambia a `"hidden"`, el intervalo se detiene. Cuando vuelve a `"visible"`, se ejecuta `callback` de inmediato y se reinicia el intervalo.

- **AC-3**: `usePolling` conectado en `FloorPlanSection`. `POLLING_INTERVAL_MS = 30_000` como constante. El polling se desactiva mientras `isReserving || isCancelling` (`enabled = false`).

- **AC-4**: Reconciliación garantizada. Los overrides optimistas no se pierden durante un ciclo de polling. Verificable revisando que `applyOverrides` se aplica sobre los datos del servidor en cada render tras un refetch del polling.

- **AC-5**: Tests del hook `usePolling`. Deben cubrir:
  - Intervalo: `callback` llamado tras `intervalMs` ms (fake timers).
  - Pausa: `callback` no llamado cuando tab en background.
  - Reanudación: `callback` llamado inmediatamente al volver a foreground.
  - `enabled = false`: `callback` no llamado.
  - Cleanup: sin fugas de intervalo al desmontar.

- **AC-6**: Tests de integración de `FloorPlanSection` con polling. Deben cubrir:
  - `refetch` llamado tras `POLLING_INTERVAL_MS` ms.
  - `refetch` no llamado mientras `isReserving` o `isCancelling`.
  - Los overrides optimistas presentes antes del polling siguen presentes después.

---

## Criterio de done

- Todos los AC en PASS.
- `npm run test` en verde (sin regresiones en los 413 tests existentes).
- `npm run lint` en verde.
- `npm run build` en verde.
- Spec actualizada con `## Execution Result`.

---

## Ficheros a crear o modificar

| Acción | Fichero |
|--------|---------|
| Crear | `src/hooks/use-polling.ts` |
| Modificar | `src/components/floor-plan/FloorPlanSection.tsx` |
| Crear | `tests/unit/use-polling.test.ts` |
| Crear / modificar | `tests/unit/floor-plan-section-polling.test.ts` |
| Modificar | `.ai/verify/config.yaml` (añadir suite OP-260) |

---

## Guía de implementación

### 1. `src/hooks/use-polling.ts`

```ts
"use client";

import { useEffect, useRef } from "react";

export const POLLING_INTERVAL_MS = 30_000;

/**
 * Ejecuta `callback` periódicamente cada `intervalMs` ms mientras el tab sea
 * visible. Pausa cuando `document.visibilityState === "hidden"` y reanuda
 * (ejecutando inmediatamente) al volver a foreground.
 * No ejecuta nada si `enabled` es false.
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true,
): void {
  const callbackRef = useRef(callback);

  // Mantener la ref actualizada sin reiniciar el intervalo.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timerId: ReturnType<typeof setInterval> | null = null;

    function start() {
      timerId = setInterval(() => callbackRef.current(), intervalMs);
    }

    function stop() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        callbackRef.current(); // refresco inmediato al volver
        start();
      }
    }

    // Iniciar sólo si el tab ya es visible.
    if (document.visibilityState === "visible") {
      start();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
```

### 2. Cambio en `FloorPlanSection`

Añadir al bloque de imports:
```ts
import { usePolling, POLLING_INTERVAL_MS } from "@/hooks/use-polling";
```

Añadir tras la desestructuración de `useReservation`:
```ts
const isOperationInProgress = isReserving || isCancelling;
usePolling(refetch, POLLING_INTERVAL_MS, !isOperationInProgress);
```

Sin más cambios. La reconciliación ya la gestiona `applyOverrides`.

### 3. Tests `use-polling.test.ts`

Usar `vi.useFakeTimers()` y simular `document.visibilityState` + disparar
`visibilitychange` manualmente. Verificar con `vi.advanceTimersByTime`.

Estructura de tests:
```
describe("usePolling")
  it("llama al callback tras intervalMs")
  it("no llama al callback si enabled = false")
  it("pausa cuando el tab pasa a hidden")
  it("llama inmediatamente y reanuda al volver a visible")
  it("limpia el intervalo al desmontar")
  it("reinicia el intervalo si intervalMs cambia")
```

### 4. Tests `floor-plan-section-polling.test.ts`

Mock de `usePolling` para verificar que:
- Se llama con `refetch`, `POLLING_INTERVAL_MS` y `!isOperationInProgress`.
- Los overrides optimistas no se borran tras un ciclo de refetch simulado.

---

## Subtareas

| ID | Título |
|----|--------|
| OP-261 | Hook `usePolling` con intervalo configurable |
| OP-262 | Pausa por Page Visibility API |
| OP-263 | Integración en `FloorPlanSection` y reconciliación |
| OP-264 | Tests del hook y de la integración |

---

## Execution Result

- Fecha de implementación: 2026-06-17 22:15 (CET)
- Rama: feature/OP-260-polling-periodico
- Commit: 07a07eb
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – `src/hooks/use-polling.ts` creado. Exporta `usePolling(callback, intervalMs, enabled?)` y `POLLING_INTERVAL_MS = 30_000`. Ejecuta `callback` cada `intervalMs` ms mediante `setInterval`. La `callbackRef` desacopla la referencia del intervalo para que el timer no se reinicie en cada render.
  - AC-2: PASS – `handleVisibilityChange` escucha `document.visibilitychange`: llama a `stop()` al pasar a `hidden` y llama a `callback()` inmediatamente + `start()` al volver a `visible`. El intervalo no arranca si el tab ya está oculto en el montaje.
  - AC-3: PASS – `FloorPlanSection` añade `const isOperationInProgress = isReserving || isCancelling` y pasa `!isOperationInProgress` como `enabled` a `usePolling`. Durante mutaciones el polling queda suspendido.
  - AC-4: PASS – No requirió código adicional. `applyOverrides` ya aplica los overrides sobre los datos frescos del servidor en cada render; un refetch de polling no elimina los overrides (viven en el `useState` de `FloorPlanSection` ligado al día).
  - AC-5: PASS – `tests/unit/use-polling.test.ts`: 15 tests con `vi.useFakeTimers()` y `visibilityState` controlado manualmente. Cubren intervalo, `enabled = false`, pausa en `hidden`, reanudación inmediata en `visible`, cleanup al desmontar y reinicio al cambiar `intervalMs`.
  - AC-6: PASS – `tests/unit/floor-plan-section-polling.test.ts`: 7 tests con mocks de módulo de `usePolling`, `useAvailability`, `useReservation` y el contexto. Verifican que `FloorPlanSection` pasa `refetch`, `POLLING_INTERVAL_MS` y el `enabled` correcto según el estado de la operación.
- Ficheros creados o modificados:
  - `src/hooks/use-polling.ts` (nuevo — hook de polling)
  - `src/components/floor-plan/FloorPlanSection.tsx` (añadido import y llamada a `usePolling`)
  - `tests/unit/use-polling.test.ts` (nuevo — 15 tests unitarios del hook)
  - `tests/unit/floor-plan-section-polling.test.ts` (nuevo — 7 tests de integración)
  - `.ai/verify/config.yaml` (suite `OP-260_polling_periodico` añadida)
- verify:
  - Comando ejecutado: `npm run test` + `npm run lint` + `npm run build`
  - Resultado: PASS — 435/435 tests, 0 errores lint (5 warnings preexistentes), build OK
- AI-assisted:
  - Herramienta(s): Claude Code claude-sonnet-4-6
  - Alcance: implementación completa de OP-261 a OP-264 (hook, integración y tests)
- Decisiones técnicas:
  - `callbackRef` para almacenar la referencia del callback sin incluirlo en las deps del `useEffect` del timer — evita reiniciar el intervalo en cada render cuando el padre pasa una función inline.
  - El polling se desactiva con `enabled = false` durante mutaciones en lugar de limpiar overrides: más simple y coherente con el diseño de OP-250 donde los overrides ya conviven con refetches.
  - Los tests de integración usan mocks de módulo (`vi.mock`) en lugar de montar el árbol completo de providers, siguiendo el mismo patrón que `floor-plan-loading-error.test.ts`.
