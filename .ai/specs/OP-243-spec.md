# OP-243 — Precarga de semana completa

## Contexto

El hook `useAvailability` (OP-241) llama a `GET /api/availability?date=YYYY-MM-DD` cada vez que cambia el día seleccionado. Esto genera una petición HTTP por cada cambio de día. El endpoint `GET /api/availability/week?start=YYYY-MM-DD&end=YYYY-MM-DD` ya existe y devuelve `Record<string, TableAvailability[]>` — los datos de toda la semana en una sola petición.

El selector de semana ya expone la semana activa y sus días via `useDateSelection()` (tras OP-210). La utilidad `src/lib/week-selector.ts` ya calcula `WeekData` con `startDate` y `endDate`.

Esta subtarea crea un hook `useWeekAvailability` que carga toda la semana de una vez y sirve los datos por día desde un caché local, evitando llamadas individuales al cambiar de día dentro de la misma semana.

## Objetivo

Crear el hook `useWeekAvailability` en `src/hooks/use-week-availability.ts` que:

1. Recibe `start` y `end` en formato `YYYY-MM-DD` (rango de la semana activa).
2. Llama a `GET /api/availability/week?start=<start>&end=<end>` una sola vez.
3. Devuelve un mapa `Record<string, TableAvailability[]>` con los datos de todos los días de la semana.
4. Expone un método `getDay(date: string)` para obtener los datos de un día concreto desde el mapa.

## Restricciones

- Fetch nativo — sin SWR, React Query ni Axios.
- Solo hooks nativos de React (`useState`, `useEffect`, `useCallback`).
- El hook recarga cuando cambia `start` o `end` (cambio de semana), no al cambiar el día seleccionado.
- Abortar peticiones en vuelo al cambiar la semana o al desmontar (AbortController).
- No gestionar lógica de negocio dentro del hook: solo fetching y estado.
- Sin `any`.

## Interfaz del hook

```ts
interface UseWeekAvailabilityResult {
  weekData: Record<string, TableAvailability[]> | null;
  loading: boolean;
  error: string | null;
  getDay: (date: string) => TableAvailability[] | null;
  refetch: () => void;
}

function useWeekAvailability(start: string, end: string): UseWeekAvailabilityResult
```

- `weekData`: mapa completo cuando la petición tiene éxito; `null` mientras carga o si falla.
- `loading`: `true` mientras la petición está en curso.
- `error`: mensaje legible si la petición falla; `null` si tuvo éxito.
- `getDay(date)`: devuelve `weekData[date] ?? null`. Conveniencia para no acceder directamente al mapa.
- `refetch`: fuerza una recarga de la semana actual.

## Comportamiento esperado

| Situación | `loading` | `weekData` | `error` |
|---|---|---|---|
| Petición en curso | `true` | anterior o `null` | anterior o `null` |
| Petición exitosa | `false` | `Record<string, TableAvailability[]>` | `null` |
| Error de red | `false` | `null` | mensaje de error |
| Error HTTP | `false` | `null` | mensaje del servidor o genérico |
| Semana cambia antes de respuesta | `true` | `null` | `null` |

## Integración esperada

En el Client Component que gestiona el plano, se usará `useWeekAvailability` en lugar de (o junto a) `useAvailability`:

```ts
const { getDay, loading, error, refetch } = useWeekAvailability(weekStart, weekEnd);
const tables = getDay(selectedDay.dateString) ?? [];
```

Cambiar de día dentro de la misma semana no provoca ninguna petición nueva — los datos ya están en el mapa.

## Casos límite

- `start` o `end` son string vacío — no lanzar petición; devolver `loading: false, weekData: null, error: null`.
- El servidor devuelve un mapa vacío `{}` — `weekData = {}`, no es error. `getDay` devuelve `null` para cualquier fecha.
- `getDay` llamado con una fecha fuera del rango de la semana — devuelve `null`.
- La semana cambia mientras hay una petición en vuelo — abortar la anterior, lanzar nueva.
- El componente se desmonta antes de que llegue la respuesta — abortar, no actualizar estado.

## Criterios de aceptación

- AC-1: El fichero `src/hooks/use-week-availability.ts` existe y exporta `useWeekAvailability`.
- AC-2: El hook llama a `GET /api/availability/week?start=<start>&end=<end>` una sola vez por semana activa.
- AC-3: `loading` es `true` mientras la petición está en curso y `false` cuando termina.
- AC-4: `weekData` contiene el mapa `Record<string, TableAvailability[]>` cuando la petición es exitosa.
- AC-5: `getDay(date)` devuelve el array correcto para fechas dentro del rango, `null` para fechas fuera.
- AC-6: Cambiar el día seleccionado dentro de la misma semana no lanza ninguna nueva petición HTTP.
- AC-7: Las peticiones en vuelo se abortan al cambiar la semana o al desmontar el componente.
- AC-8: `refetch` vuelve a lanzar la petición para la semana activa.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-06-17 17:51 (CET)
- Rama: feature/OP-240-integracion-api-disponibilidad
- Commit: 8eabc6b
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – `src/hooks/use-week-availability.ts` existe y exporta `useWeekAvailability`
  - AC-2: PASS – El hook llama a `GET /api/availability/week?start=<start>&end=<end>` una sola vez por semana activa
  - AC-3: PASS – `loading` es `true` mientras la petición está en curso y `false` cuando termina
  - AC-4: PASS – `weekData` contiene `Record<string, TableAvailability[]>` cuando la petición es exitosa
  - AC-5: PASS – `getDay(date)` devuelve el array correcto para fechas dentro del rango, `null` para fechas fuera
  - AC-6: PASS – Cambiar el día seleccionado sin cambiar `start`/`end` no lanza ninguna nueva petición HTTP
  - AC-7: PASS – Las peticiones en vuelo se abortan al cambiar la semana o al desmontar el componente
  - AC-8: PASS – `refetch` vuelve a lanzar la petición para la semana activa
- Ficheros creados o modificados:
  - `src/hooks/use-week-availability.ts`
  - `tests/unit/use-week-availability.test.ts`
  - `.ai/verify/config.yaml` (suite OP-243 añadida)
  - `.ai/specs/OP-243-spec.md` (este fichero)
- verify:
  - Comando ejecutado: `npm run test:unit`
  - Resultado: PASS — 177 tests en verde (32 nuevos de OP-243)
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa del hook y suite de tests unitarios
- Decisiones técnicas:
  - `getDay` implementado con `useCallback` dependiente de `weekData` para que la referencia sea estable entre renders y no cause re-renders innecesarios en consumidores
  - Patrón `fetchCounter` (idéntico a `useAvailability`) para que `refetch` sea una función estable sin necesidad de `useCallback` con dependencias complejas
