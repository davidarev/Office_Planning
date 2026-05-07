# OP-213 — Componente DaySelector

> Historia padre: OP-210 | Depende de: OP-211

## Contexto

Tras OP-211, existe `src/lib/week-selector.ts` con los tipos `WorkDay` y `WorkWeek`. Cada `WorkDay` ya tiene `date`, `dateString`, `label` (e.g., "Lun") y `dayNumber`.

OP-212 implementa `WeekSelector` para navegar entre semanas. `DaySelector` es el componente complementario: dado el array de días de la semana seleccionada, permite elegir un día concreto.

Al igual que `WeekSelector`, es un componente **controlado** — el estado del día seleccionado vive en el padre (OP-214).

## Objetivo

Crear `src/components/booking/DaySelector.tsx`: componente React cliente que muestra los 5 días laborables de la semana activa y permite seleccionar uno, con el día activo destacado visualmente.

## Restricciones

- Componente cliente (`"use client"`)
- Sin librerías externas — solo Tailwind CSS v4
- Consumir `WorkDay` de `src/lib/week-selector.ts`, sin reimplementar lógica de fechas
- Componente controlado: no gestiona estado del día seleccionado internamente
- No hacer fetch ni llamadas a API

## Props esperadas

```typescript
interface DaySelectorProps {
  days: WorkDay[];                        // Los 5 días L–V de la semana activa
  selectedDateString: string;             // "YYYY-MM-DD" del día activo
  onDayChange: (day: WorkDay) => void;
}
```

## Comportamiento visual

- 5 botones en fila, uno por día laborable
- Cada botón muestra:
  - `label` del día abreviado (e.g., "Lun")
  - `dayNumber` (e.g., "5")
- El botón correspondiente a `selectedDateString` está visualmente activo (fondo sólido, texto oscuro)
- Los botones inactivos son más discretos (fondo neutro, texto gris)
- Al pulsar un botón inactivo se llama `onDayChange` con el `WorkDay` correspondiente
- Al pulsar el botón ya activo no se llama `onDayChange`
- Diseño visual consistente con `WeekSelector` (misma familia de estilos Tailwind)

## Casos límite

- `selectedDateString` no coincide con ningún día del array `days` (e.g., al cambiar de semana antes de que el padre actualice el día) — ningún botón aparece activo, sin error
- Array `days` vacío — renderiza sin error (sin botones)
- Días con `dayNumber` de uno o dos dígitos — alineación visual consistente
- Usable con teclado (foco visible, Enter/Space para seleccionar)

## Criterios de aceptación

- AC-1: El componente renderiza exactamente los días recibidos en `days`, mostrando `label` y `dayNumber` de cada uno
- AC-2: El botón cuyo `dateString` coincide con `selectedDateString` está visualmente activo
- AC-3: Al pulsar un botón inactivo se invoca `onDayChange` con el `WorkDay` correcto
- AC-4: Al pulsar el botón ya activo no se invoca `onDayChange`
- AC-5: Si `selectedDateString` no coincide con ningún día, ningún botón aparece activo y no hay error
- AC-6: El componente es navegable por teclado con foco visible
- AC-7: El componente no gestiona estado interno de día seleccionado — es controlado por props

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 21:04 (CET)
- Rama: feature/OP-210-selector-semana-dia
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — renderiza exactamente los días recibidos en `days`, mostrando `label` y `dayNumber`
  - AC-2: PASS — `isActive = day.dateString === selectedDateString`; activo recibe `bg-gray-900 text-white`
  - AC-3: PASS — `onClick` invoca `onDayChange(day)` solo si `!isActive`
  - AC-4: PASS — guard `if (!isActive)` impide llamar al callback en el día ya activo
  - AC-5: PASS — si `selectedDateString` no coincide con ningún día, ningún botón es activo y no hay error
  - AC-6: PASS — foco nativo de `<button>` con `aria-pressed`; navegable por teclado
  - AC-7: PASS — sin `useState`; únicamente props y callback
- Ficheros creados o modificados:
  - `src/components/booking/DaySelector.tsx`
- verify:
  - Comando ejecutado: `npm run lint && npm run test:unit`
  - Resultado: PASS — 0 errores lint, 95 tests unitarios en verde
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa del componente
- Decisiones técnicas:
  - `aria-pressed` en lugar de `role="tab"` porque los días son botones de selección independientes, no pestañas de un panel
  - Layout vertical (label arriba, número abajo) para que ambos datos sean legibles en pantallas pequeñas
  - `min-w-[3rem]` para garantizar tamaño mínimo uniforme entre días de 1 y 2 dígitos
