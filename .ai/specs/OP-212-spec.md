# OP-212 — Componente WeekSelector

> Historia padre: OP-210 | Depende de: OP-211

## Contexto

Tras OP-211, existe `src/lib/week-selector.ts` con los tipos `WorkWeek` y `WorkDay`, y las funciones `getWorkWeeks()` y `getDefaultWorkDay()`. Toda la lógica de fechas ya está resuelta ahí.

No existe ningún componente de UI para seleccionar semana. El único componente de layout existente es `src/components/layout/Header.tsx`, que sirve de referencia de estilo (Tailwind CSS v4, sin librerías de UI externas).

## Objetivo

Crear `src/components/booking/WeekSelector.tsx`: un componente React cliente que permita al usuario navegar entre semana actual y semana siguiente, mostrando el rango de fechas de cada una de forma clara.

El componente **recibe** la semana actualmente seleccionada y un callback `onWeekChange` — no gestiona estado propio. El estado vive en el padre (OP-214).

## Restricciones

- Componente cliente (`"use client"`)
- Sin librerías externas de calendario ni de UI — solo Tailwind CSS v4
- No duplicar lógica de fechas: consumir `WorkWeek` de `src/lib/week-selector.ts`
- No gestionar estado de semana seleccionada internamente — props + callback
- No hacer fetch ni llamadas a API — es puramente presentacional

## Props esperadas

```typescript
interface WeekSelectorProps {
  weeks: [WorkWeek, WorkWeek];      // [semanaActual, semanaSiguiente]
  selectedWeekOffset: number;        // 0 | 1
  onWeekChange: (offset: number) => void;
}
```

## Comportamiento visual

- Dos pestañas (o botones tipo tab) lado a lado: una por semana
- Cada tab muestra el `label` de la semana (e.g., "5 – 9 may")
- La pestaña activa está visualmente destacada (fondo sólido, texto oscuro)
- La pestaña inactiva es más discreta (fondo neutro, texto gris)
- Al pulsar una pestaña inactiva, se llama `onWeekChange` con el offset correspondiente
- Sin animaciones complejas — transición de color es suficiente

## Casos límite

- `selectedWeekOffset` fuera de `[0, 1]` — el componente debe renderizar sin error (ninguna pestaña activa)
- Labels largos por cruce de mes/año (e.g., "30 dic – 3 ene") deben caber sin truncar en pantallas normales
- El componente debe ser usable con teclado (foco y Enter/Space sobre los tabs)

## Criterios de aceptación

- AC-1: El componente renderiza dos pestañas con los `label` de cada `WorkWeek`
- AC-2: La pestaña correspondiente a `selectedWeekOffset` está visualmente activa
- AC-3: Al pulsar la pestaña inactiva se invoca `onWeekChange` con el offset correcto
- AC-4: Al pulsar la pestaña ya activa no se invoca `onWeekChange`
- AC-5: El componente es navegable por teclado (role="tab" o botón estándar con foco visible)
- AC-6: El componente no gestiona estado interno de semana — es controlado por props

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 21:01 (CET)
- Rama: feature/OP-210-selector-semana-dia
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — renderiza dos botones con el `label` de cada `WorkWeek`
  - AC-2: PASS — `isActive = week.weekOffset === selectedWeekOffset`; activo recibe clases `bg-white text-gray-900 shadow-sm`
  - AC-3: PASS — `onClick` invoca `onWeekChange(week.weekOffset)` solo si `!isActive`
  - AC-4: PASS — guard `if (!isActive)` impide llamar al callback en la pestaña ya activa
  - AC-5: PASS — `role="tablist"` en el wrapper, `role="tab"` y `aria-selected` en cada botón; foco nativo de `<button>`
  - AC-6: PASS — sin `useState`; únicamente props y callback
- Ficheros creados o modificados:
  - `src/components/booking/WeekSelector.tsx`
- verify:
  - Comando ejecutado: `npm run lint && npm run test:unit`
  - Resultado: PASS — 0 errores lint, 95 tests unitarios en verde
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa del componente
- Decisiones técnicas:
  - `role="tablist"` / `role="tab"` / `aria-selected` para accesibilidad semántica correcta sin dependencias externas
  - Guard `if (!isActive)` en el onClick en lugar de `disabled` para mantener el foco y la navegación por teclado en todos los botones
