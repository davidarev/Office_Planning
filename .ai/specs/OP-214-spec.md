# OP-214 — Estado y contexto de fecha seleccionada

> Historia padre: OP-210 | Depende de: OP-212, OP-213

## Contexto

Tras OP-211, OP-212 y OP-213 existen:
- `src/lib/week-selector.ts` — lógica de semanas (`WorkWeek`, `WorkDay`, `getWorkWeeks`, `getDefaultWorkDay`)
- `src/components/booking/WeekSelector.tsx` — componente controlado por props
- `src/components/booking/DaySelector.tsx` — componente controlado por props

Ambos componentes son controlados: no gestionan estado. Necesitan un ancestro común que:
1. Mantenga qué semana y qué día están seleccionados
2. Exponga ese estado a los componentes consumidores (y en el futuro a OP-230, OP-240, etc.)

La página principal `src/app/(main)/page.tsx` es un Server Component. El estado de selección debe vivir en un Client Component que envuelva la sección de reservas.

No existe ningún patrón de contexto React en el proyecto — este es el primero.

## Objetivo

Crear dos artefactos:

1. **`src/components/booking/DateSelectionProvider.tsx`** — Client Component que mantiene el estado (`selectedWeekOffset`, `selectedDay`) e inicializa con `getDefaultWorkDay()`. Renderiza `WeekSelector` y `DaySelector` coordinados, y expone el día seleccionado via contexto React.

2. **`src/context/date-selection.context.ts`** — definición del contexto (`createContext`) con su hook `useDateSelection()` para que componentes descendientes (plano de mesas, panel de reserva) puedan leer la fecha seleccionada sin prop drilling.

## Restricciones

- `DateSelectionProvider` debe ser `"use client"`
- El contexto solo expone lo que los consumidores necesitan leer: `selectedDay: WorkDay`
- No exponer los setters del estado directamente en el contexto — los cambios ocurren dentro del provider a través de `WeekSelector` y `DaySelector`
- No hacer fetch ni llamadas a API en este componente
- `useDateSelection()` debe lanzar error descriptivo si se usa fuera del provider

## API pública esperada

```typescript
// src/context/date-selection.context.ts
export interface DateSelectionContextValue {
  selectedDay: WorkDay;
}

export const DateSelectionContext: React.Context<DateSelectionContextValue | null>

export function useDateSelection(): DateSelectionContextValue
// lanza Error si se usa fuera de DateSelectionProvider
```

```typescript
// src/components/booking/DateSelectionProvider.tsx
export function DateSelectionProvider(): JSX.Element
// Renderiza WeekSelector + DaySelector coordinados
// Expone selectedDay via DateSelectionContext
```

## Comportamiento

- Al montar, inicializa `selectedDay` con `getDefaultWorkDay()` y `selectedWeekOffset` con el offset de la semana que contiene ese día (0 si es semana actual, 1 si es fin de semana y cae en semana siguiente)
- Al cambiar de semana (`WeekSelector` → `onWeekChange`): actualiza `selectedWeekOffset` y resetea `selectedDay` al primer día de la nueva semana
- Al cambiar de día (`DaySelector` → `onDayChange`): actualiza `selectedDay`
- `weeks` se calcula una sola vez al montar (no cambia durante la sesión — el polling de OP-260 no afecta al selector de fechas)

## Casos límite

- Si el día por defecto cae en fin de semana (sábado/domingo), `getDefaultWorkDay()` devuelve el lunes siguiente → `selectedWeekOffset` debe ser 1 si ese lunes está en la semana siguiente, 0 si está en la semana actual
- Al cambiar de semana, el día reseteado debe ser siempre el primer día (`days[0]`) de la nueva semana, no intentar mantener el mismo día de la semana anterior
- `useDateSelection()` fuera del provider lanza un error claro: `"useDateSelection must be used within DateSelectionProvider"`

## Criterios de aceptación

- AC-1: `DateSelectionProvider` inicializa con el día laborable por defecto calculado por `getDefaultWorkDay()`
- AC-2: Al cambiar de semana en `WeekSelector`, `DaySelector` muestra los días de la nueva semana y el día activo se resetea al primero
- AC-3: Al seleccionar un día en `DaySelector`, `selectedDay` en el contexto se actualiza
- AC-4: `useDateSelection()` expone el `selectedDay` actualizado a componentes descendientes
- AC-5: `useDateSelection()` lanzado fuera del provider produce un error descriptivo
- AC-6: `DateSelectionProvider` no expone setters de estado en el contexto — los cambios solo ocurren internamente vía callbacks de los selectores

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 21:11 (CET)
- Rama: feature/OP-210-selector-semana-dia
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — `useState(defaultDay)` inicializado con `getDefaultWorkDay()`; `initialOffset` derivado de qué semana contiene ese día
  - AC-2: PASS — `handleWeekChange` actualiza `selectedWeekOffset` y resetea `selectedDay` a `weeks[offset].days[0]`
  - AC-3: PASS — `handleDayChange` actualiza `selectedDay` en el estado local
  - AC-4: PASS — `DateSelectionContext.Provider value={{ selectedDay }}` expone el día actualizado a descendientes via `useDateSelection()`
  - AC-5: PASS — `useDateSelection()` lanza `"useDateSelection must be used within DateSelectionProvider"` si el contexto es null
  - AC-6: PASS — el contexto solo expone `{ selectedDay: WorkDay }`; los setters son internos al provider
- Ficheros creados o modificados:
  - `src/context/date-selection.context.ts`
  - `src/components/booking/DateSelectionProvider.tsx`
- verify:
  - Comando ejecutado: `npm run lint && npm run test:unit`
  - Resultado: PASS — 0 errores lint, 95 tests unitarios en verde
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa de ambos artefactos
- Decisiones técnicas:
  - `weeks` y `defaultDay` calculados con `useMemo([], [])` — se computan una vez al montar, sin recalcular en cada render
  - `initialOffset` derivado comparando `defaultDay.dateString` contra los días de la semana actual, cubriendo el caso de fin de semana donde el lunes cae en semana siguiente
  - `children` en `DateSelectionProvider` permite que componentes descendientes (plano de mesas, OP-230+) sean consumidores del contexto sin prop drilling
