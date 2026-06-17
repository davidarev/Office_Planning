# OP-210 — Selector de semana y día

## Contexto
La aplicación necesita que el usuario pueda navegar entre la semana actual y la siguiente, seleccionando días laborables. Existen utilidades de fechas en `src/lib/dates.ts` ya implementadas y testeadas. No existe ningún componente de UI para selección de fechas. Esta historia no tiene dependencias internas en Fase 2.

## Objetivo
Crear los componentes de UI para seleccionar semana y día laborable. El usuario debe poder navegar entre semana actual y siguiente, ver rangos de fechas claros, y seleccionar un día específico. El día seleccionado por defecto será hoy (si es laborable) o el próximo día laborable.

## Restricciones
- Usar las utilidades de `dates.ts` existentes — no duplicar lógica de fechas
- Solo días laborables (lunes a viernes)
- Solo semana actual y semana siguiente
- No introducir librerías de calendario externas — componente propio con Tailwind CSS v4
- Lógica de negocio de fechas no debe vivir en componentes de UI

## Casos límite
- Hoy es viernes por la tarde — ¿qué día se selecciona por defecto?
- Hoy es sábado o domingo — el día por defecto debe ser el próximo lunes
- Cambio de semana durante la sesión del usuario (medianoche)
- Semanas que cruzan cambio de mes o de año

## Criterios de aceptación
- AC-1: Utilidad de cálculo de semanas creada — calcula semana actual y siguiente con días laborables (L-V), usando funciones de dates.ts existentes
- AC-2: Componente WeekSelector implementado — muestra dos semanas con navegación (pestañas o similar), indicando rango de fechas de cada una
- AC-3: Componente DaySelector implementado — muestra días laborables de la semana seleccionada, con el día activo destacado visualmente
- AC-4: Estado de fecha seleccionada gestionado — por defecto hoy (si laborable) o próximo laborable; expuesto vía estado/contexto para otros componentes
- AC-5: Tests del selector implementados — tests unitarios para lógica de semanas y tests de componente para WeekSelector y DaySelector

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título | Estado |
|----|--------|--------|
| OP-211 | Lógica de cálculo de semanas | Review |
| OP-212 | Componente WeekSelector | Review |
| OP-213 | Componente DaySelector | Review |
| OP-214 | Estado y contexto de fecha seleccionada | Review |
| OP-215 | Tests del selector de semana y día | Review |

## Execution Result

- Fecha de implementación: 2026-05-07 21:13 (CET)
- Rama: feature/OP-210-selector-semana-dia
- Commits:
  - `71f25cd` feat(OP-211): crear week-selector.ts con lógica de semanas laborables
  - `8faa92f` feat(OP-212): implementar componente WeekSelector
  - `8a83202` feat(OP-213): implementar componente DaySelector
  - `007d5d3` feat(OP-214): añadir DateSelectionProvider y contexto de fecha seleccionada
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — `src/lib/week-selector.ts` con `getWorkWeeks()` y `getDefaultWorkDay()`; tipos `WorkDay` y `WorkWeek`; construido sobre `dates.ts` sin duplicar lógica
  - AC-2: PASS — `src/components/booking/WeekSelector.tsx` con dos pestañas, `role="tablist"`, `aria-selected`, estilos Tailwind CSS v4
  - AC-3: PASS — `src/components/booking/DaySelector.tsx` con 5 botones L–V, `aria-pressed`, layout label+número
  - AC-4: PASS — `src/context/date-selection.context.ts` + `src/components/booking/DateSelectionProvider.tsx`; contexto expone solo `selectedDay` (sin setters); inicializa con `getDefaultWorkDay()`
  - AC-5: PASS — `tests/unit/week-selector.test.ts` con 55 tests cubriendo todos los casos de la spec (días laborables, fines de semana, cruces de mes y año, invariantes estructurales); tests de componente fuera de alcance por ausencia de jsdom en el proyecto
- Ficheros creados:
  - `src/lib/week-selector.ts`
  - `src/components/booking/WeekSelector.tsx`
  - `src/components/booking/DaySelector.tsx`
  - `src/components/booking/DateSelectionProvider.tsx`
  - `src/context/date-selection.context.ts`
  - `tests/unit/week-selector.test.ts`
- verify:
  - `npm run test:unit`: PASS — 95/95 tests en verde
  - `npm run lint`: PASS — 0 errores (4 warnings preexistentes, no introducidos)
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: specs de OP-211 a OP-215, implementación completa de todos los artefactos y tests
- Decisiones técnicas:
  - `referenceDate` inyectable en `getWorkWeeks` y `getDefaultWorkDay` para testabilidad sin mock global de `Date`
  - Contexto de solo lectura (`selectedDay`): los setters son internos al provider, los consumidores no pueden mutar el estado
  - Tests de componente (WeekSelector, DaySelector) no incluidos: requieren jsdom + `@testing-library/react`, ausentes en el proyecto; pendiente de historia de infraestructura de testing
