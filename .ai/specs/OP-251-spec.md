# OP-251 — Hook useReservation

## Contexto

El código actual tiene dos hooks separados en `src/components/floor-plan/`:
- `use-reserve.ts` — encapsula `POST /api/reservations`
- `use-cancel-reservation.ts` — encapsula `DELETE /api/reservations/[id]`

Ambos tienen la misma estructura básica (isLoading + función async → `string | null`), pero viven dentro de la carpeta de componentes en lugar de `src/hooks/`, no están coordinados entre sí, y no implementan actualización optimista ni rollback. Eso pertenece a subtareas posteriores (OP-252–OP-254), pero el hook unificado es el punto de entrada que las otras subtareas extenderán.

## Objetivo

Crear `src/hooks/use-reservation.ts` como hook unificado que exponga `reserve` y `cancelReservation` bajo una interfaz coherente, preparada para recibir la lógica optimista en OP-252–OP-254.

El hook no implementa actualización optimista en esta subtarea — eso es OP-252 y OP-253. Sí debe exponer la interfaz que esas subtareas usarán.

## Restricciones

- Ubicar el fichero en `src/hooks/use-reservation.ts`, no en `src/components/`.
- Usar únicamente hooks nativos de React y `fetch` nativo — sin librerías de data fetching.
- Sin lógica de negocio en el hook: solo llamadas HTTP, estado de carga y error.
- El hook recibe un callback `onOptimisticUpdate` opcional para que el componente padre aplique cambios de estado local antes de la respuesta — la implementación real de ese callback va en OP-252/OP-253.
- Tipar estrictamente sin `any`.
- Los hooks anteriores (`use-reserve.ts`, `use-cancel-reservation.ts`) deben seguir funcionando durante esta subtarea — no eliminarlos todavía (eso va en OP-252 cuando `FloorPlanClient` se migre).

## Interfaz del hook

```ts
interface ReserveOptions {
  /** Invocado antes de la llamada HTTP para aplicar el cambio optimista. */
  onOptimisticUpdate?: () => void;
  /** Invocado si el backend rechaza, para revertir el cambio optimista. */
  onRollback?: () => void;
}

interface UseReservationResult {
  isReserving: boolean;
  isCancelling: boolean;
  /**
   * Llama a POST /api/reservations.
   * Devuelve null en éxito o el mensaje de error en fallo.
   */
  reserve: (tableId: string, date: string, options?: ReserveOptions) => Promise<string | null>;
  /**
   * Llama a DELETE /api/reservations/:id.
   * Devuelve null en éxito o el mensaje de error en fallo.
   */
  cancelReservation: (reservationId: string, options?: ReserveOptions) => Promise<string | null>;
}

function useReservation(): UseReservationResult
```

## Comportamiento esperado

| Situación | `isReserving` | `isCancelling` | retorno |
|---|---|---|---|
| reserve en curso | `true` | `false` | — |
| reserve exitoso | `false` | `false` | `null` |
| reserve fallido | `false` | `false` | mensaje de error |
| cancelReservation en curso | `false` | `true` | — |
| cancelReservation exitoso | `false` | `false` | `null` |
| cancelReservation fallido | `false` | `false` | mensaje de error |

## Casos límite

- Error de red (fetch lanza excepción) — devolver mensaje genérico de conexión.
- El servidor devuelve error sin campo `error` en el body — devolver mensaje genérico.
- `response.json()` lanza excepción — manejar con `.catch(() => ({}))` y usar mensaje genérico.
- El componente se desmonta mientras la petición está en vuelo — no actualizar estado (usar ref de mounted o AbortController).

## Criterios de aceptación

- AC-1: El fichero `src/hooks/use-reservation.ts` existe y exporta `useReservation`.
- AC-2: `reserve(tableId, date)` llama a `POST /api/reservations` con body `{ tableId, date }` y devuelve `null` en éxito.
- AC-3: `cancelReservation(reservationId)` llama a `DELETE /api/reservations/:id` y devuelve `null` en éxito.
- AC-4: En caso de error HTTP, devuelve el campo `error` del JSON de respuesta, o mensaje genérico si no existe.
- AC-5: En caso de error de red, devuelve mensaje de conexión genérico.
- AC-6: `isReserving` es `true` solo durante la llamada a `reserve`; `isCancelling` es `true` solo durante `cancelReservation`.
- AC-7: Las funciones aceptan `options.onOptimisticUpdate` y `options.onRollback` sin errores de tipo (aunque la lógica de invocación se implementa en OP-252/OP-253).

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

**Fecha**: 2026-06-17
**Estado**: DONE

### Archivo creado
`src/hooks/use-reservation.ts` — hook unificado que reemplaza la lógica dispersa en `use-reserve.ts` y `use-cancel-reservation.ts` (ambos se mantienen en su ubicación original hasta OP-252).

### AC verificados
| AC | Estado | Notas |
|---|---|---|
| AC-1 | PASS | `src/hooks/use-reservation.ts` existe y exporta `useReservation` |
| AC-2 | PASS | `reserve(tableId, date)` llama a `POST /api/reservations` con body `{ tableId, date }`, devuelve `null` en éxito |
| AC-3 | PASS | `cancelReservation(reservationId)` llama a `DELETE /api/reservations/:id`, devuelve `null` en éxito |
| AC-4 | PASS | En error HTTP extrae `error` del JSON de respuesta, o usa mensaje genérico si no existe |
| AC-5 | PASS | En catch de red devuelve `"Error de conexión. Inténtalo de nuevo."` |
| AC-6 | PASS | `isReserving` solo true durante `reserve`; `isCancelling` solo true durante `cancelReservation` |
| AC-7 | PASS | `options.onOptimisticUpdate` y `options.onRollback` tipados en `ReserveOptions`, sin errores de tipo |

### Verificaciones
| Check | Estado |
|---|---|
| Lint | PASS (0 errores, 5 warnings preexistentes) |
| Tests unitarios | PASS (194/194) |
| Tests integración | PASS (102/102) |
| Tests API | PASS (89/89) |
| Build | PASS |

### Notas de implementación
- Se usa `useRef` con `useEffect` para evitar actualizaciones de estado tras desmontaje del componente.
- Los callbacks `onOptimisticUpdate` y `onRollback` están tipados pero la invocación real va en OP-252/OP-253. En esta subtarea solo `onRollback` se invoca en caso de error (comportamiento correcto: si hay error HTTP/red, se revierte el optimismo que eventualmente aplicará OP-252).
- Los hooks anteriores `use-reserve.ts` y `use-cancel-reservation.ts` siguen intactos.
