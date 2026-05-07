# OP-461 — Componente FloorPlan (contenedor)

## Contexto

No existe ningún componente de renderizado del plano de la oficina. El directorio
`src/components/floor-plan/` existe pero está vacío. Los tipos de dominio relevantes
(`TableAvailability`, `TablePosition`, `TableStatus`) ya están definidos en
`src/domain/types/table.ts`.

La página principal (`src/app/(main)/page.tsx`) actualmente muestra solo un mensaje de
placeholder. El contexto de fecha seleccionada ya está disponible a través de
`DateSelectionContext` (implementado en OP-210).

Este componente es el contenedor raíz del plano: define el lienzo (canvas lógico) sobre
el que se posicionarán las mesas individuales. No renderiza mesas por sí solo — eso lo
hará `DeskItem` (OP-462).

## Objetivo

Crear el componente `FloorPlan` en `src/components/floor-plan/FloorPlan.tsx` que:

1. Renderice un contenedor con dimensiones y escala configurables.
2. Acepte como prop un array de `TableAvailability` y las renderice como `children`
   posicionados absolutamente dentro del contenedor.
3. Consuma `useDateSelection()` para tener la fecha activa accesible en el árbol,
   aunque el fetching de datos ocurrirá en el nivel superior (página o un wrapper).
4. Establezca las bases para el posicionamiento relativo de las mesas.

## Restricciones

- Usar CSS positioning (`position: relative` en contenedor, `position: absolute` en
  mesas) con Tailwind. No usar librerías de diagramación (D3, Konva, etc.).
- El componente debe ser `"use client"` ya que consume context.
- Las dimensiones del plano deben ser configurables via props (`width`, `height`) con
  valores por defecto razonables. Las unidades internas del modelo (`TablePosition`)
  se mapearán a píxeles o porcentajes en `DeskItem` (OP-462), no aquí.
- No hardcodear datos de mesas. El componente recibe `tables: TableAvailability[]`.
- No introducir lógica de fetching dentro del componente — eso corresponde a la
  página o a un wrapper de datos (Server Component o `useEffect`).
- No acoplar a la API directamente. `FloorPlan` es un componente de presentación pura.

## Casos límite

- `tables` array vacío: renderizar el contenedor vacío con un mensaje de estado
  ("No hay mesas configuradas") en lugar de un espacio en blanco sin contexto.
- Props `width` o `height` con valor 0 o negativo: usar los valores por defecto.
- El contenedor debe ser scrollable si el plano supera el viewport en pantallas pequeñas.

## Criterios de aceptación

- AC-1: El componente `FloorPlan` existe en `src/components/floor-plan/FloorPlan.tsx`
  y se exporta también desde `src/components/floor-plan/index.ts`.
- AC-2: Acepta props `tables: TableAvailability[]`, `width?: number` y `height?: number`.
  Los valores por defecto de `width` y `height` deben estar documentados en el componente.
- AC-3: Renderiza un contenedor con `position: relative` que actúa como lienzo de
  posicionamiento para las mesas hijas.
- AC-4: Itera sobre `tables` y renderiza un placeholder (`<div>`) por cada mesa,
  posicionado absolutamente según `table.position.x` e `table.position.y` en píxeles.
  (El componente real `DeskItem` se integrará en OP-462.)
- AC-5: Cuando `tables` está vacío, muestra un mensaje de estado vacío en lugar de
  un contenedor en blanco.
- AC-6: El componente integra `useDateSelection()` internamente — la fecha seleccionada
  está disponible en el árbol para uso futuro (aunque no se use aún en este ticket).
- AC-7: La página principal (`src/app/(main)/page.tsx`) integra `FloorPlan` dentro de
  `DateSelectionProvider`, sustituyendo el mensaje placeholder actual.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result
