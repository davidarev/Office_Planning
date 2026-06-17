# OP-241 — Hook useAvailability

## Contexto

El plano de mesas (`FloorPlanClient`) ya está implementado y recibe `tables: TableAvailability[]` como prop. Actualmente la página principal (`src/app/(main)/page.tsx`) pasa un array vacío con el comentario `/* tables se integrarán con la API en OP-240 */`. El endpoint `GET /api/availability?date=YYYY-MM-DD` ya existe y devuelve `TableAvailability[]`. El selector de día ya expone `selectedDay.dateString` via `useDateSelection()`.

Esta subtarea crea el hook `useAvailability` que encapsula la llamada al endpoint de disponibilidad diaria. Proporciona los datos, el estado de carga y el error al componente que lo consuma.

## Objetivo

Crear el hook `useAvailability` en `src/hooks/use-availability.ts` que:

1. Recibe una fecha en formato `YYYY-MM-DD`.
2. Llama a `GET /api/availability?date=<fecha>` con `fetch` nativo.
3. Devuelve `{ data, loading, error, refetch }`.
4. Gestiona correctamente el ciclo de vida: carga inicial, recarga al cambiar fecha y limpieza de peticiones obsoletas (AbortController).

## Restricciones

- Usar únicamente hooks nativos de React (`useState`, `useEffect`, `useCallback`) y `fetch` nativo — sin SWR, React Query ni Axios.
- Sin lógica de negocio en el hook: solo fetching, estado y error.
- No gestionar caché de semana completa en este hook — eso es OP-243.
- El hook debe ser un módulo independiente en `src/hooks/`, no acoplado a ningún componente concreto.
- Abortar peticiones en vuelo cuando cambia la fecha o el componente se desmonta (AbortController).
- Tipar estrictamente: sin `any`.

## Interfaz del hook

```ts
interface UseAvailabilityResult {
  data: TableAvailability[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAvailability(date: string): UseAvailabilityResult
```

- `data`: array de disponibilidad cuando la petición termina con éxito; `null` mientras carga o si hay error.
- `loading`: `true` mientras hay una petición activa.
- `error`: mensaje de error legible si la petición falla; `null` si todo fue bien.
- `refetch`: función que vuelve a lanzar la petición con la misma fecha, sin necesidad de cambiar la fecha.

## Comportamiento esperado

| Situación | `loading` | `data` | `error` |
|---|---|---|---|
| Petición en curso | `true` | anterior o `null` | anterior o `null` |
| Petición exitosa | `false` | `TableAvailability[]` | `null` |
| Error de red o timeout | `false` | `null` | mensaje de error |
| Error HTTP (4xx/5xx) | `false` | `null` | mensaje del servidor o genérico |
| Fecha cambia antes de respuesta | `true` | `null` | `null` |

## Casos límite

- La fecha cambia mientras hay una petición en vuelo — abortar la anterior y lanzar nueva.
- El componente se desmonta antes de que la petición termine — abortar petición, no actualizar estado.
- El servidor devuelve un error 400/401/500 — extraer el campo `error` del JSON de respuesta si existe, o usar mensaje genérico.
- El servidor devuelve un array vacío (`[]`) — `data = []`, no es un error.
- `date` recibida es string vacío — no lanzar petición, devolver `loading: false, data: null, error: null`.

## Criterios de aceptación

- AC-1: El fichero `src/hooks/use-availability.ts` existe y exporta `useAvailability`.
- AC-2: El hook llama a `GET /api/availability?date=<fecha>` al montarse y cada vez que `date` cambia.
- AC-3: `loading` es `true` mientras la petición está en curso y `false` cuando termina.
- AC-4: `data` contiene el array de `TableAvailability` cuando la petición es exitosa.
- AC-5: `error` contiene un mensaje legible cuando la petición falla; `null` cuando tiene éxito.
- AC-6: Las peticiones en vuelo se abortan al cambiar `date` o al desmontar el componente (sin memory leaks).
- AC-7: `refetch` vuelve a lanzar la misma petición.
- AC-8: Si `date` es string vacío, el hook no lanza ninguna petición.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-06-17 17:41 (CET)
- Rama: feature/OP-240-integracion-api-disponibilidad
- Commit: 59b78890316940a8a51eb0cd20295e3600b96bbf
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — `src/hooks/use-availability.ts` existe y exporta `useAvailability`
  - AC-2: PASS — el hook llama a `/api/availability?date=<date>` al montar y al cambiar `date`
  - AC-3: PASS — `loading: true` mientras fetch activo, `false` cuando termina
  - AC-4: PASS — `data` contiene el array de `TableAvailability[]` en éxito
  - AC-5: PASS — `error` contiene mensaje legible en fallo (JSON body o genérico); `null` en éxito
  - AC-6: PASS — AbortController aborta peticiones al cambiar fecha y al desmontar
  - AC-7: PASS — `refetch` incrementa `fetchCounter` en estado, lo que fuerza re-ejecución del efecto
  - AC-8: PASS — `date` vacío sale temprano del efecto sin llamar a `fetch`
- Ficheros creados o modificados:
  - `src/hooks/use-availability.ts`
  - `tests/unit/use-availability.test.ts`
  - `package.json` (devDependencies: @testing-library/react, @testing-library/dom, jsdom)
  - `package-lock.json`
- verify:
  - Comando ejecutado: `npm run test:unit`
  - Resultado: PASS — 157 tests pasados (6 ficheros)
  - Fallos pre-existentes en test:integration (compute-status, concurrency) no introducidos por esta tarea
- AI-assisted:
  - Herramienta(s): Claude Code (claude-sonnet-4-6)
  - Alcance: implementación completa del hook y suite de tests unitarios
- Decisiones técnicas:
  - `refetch` usa `useState<number>` (fetchCounter) como dep del efecto en lugar de `useRef` para garantizar re-render y re-ejecución real del efecto
  - Se instaló `@testing-library/react` + `jsdom` como devDependencies porque los hooks de React requieren entorno DOM; el vitest environment se configura por-fichero con `// @vitest-environment jsdom`
  - El bloque `finally` comprueba `signal.aborted` para evitar `setLoading(false)` tras un abort
