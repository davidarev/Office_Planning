# OP-222 — Componente DeskItem (mesa individual)

## Contexto

`FloorPlan` (OP-221) establece el contenedor relativo e itera sobre `TableAvailability[]`
renderizando un `<div>` placeholder por cada mesa. En este ticket ese placeholder se
sustituye por el componente real `DeskItem`, que representa visualmente una mesa
individual posicionada y dimensionada según su `TablePosition`.

Los tipos de dominio relevantes están en `src/domain/types/table.ts`:
- `TableAvailability` — datos completos de una mesa para un día concreto
- `TablePosition` — coordenadas `x`, `y`, `width`, `height`, `rotation`
- `TableStatus` — estado visual: `"green" | "yellow" | "red" | "gray"`
- `cornerExtension?: TablePosition | null` (introducido en OP-221) — segundo
  rectángulo solidario al principal, presente en mesas esquinadas (MESA 4, MESA 6)

El color por estado y el tooltip de ocupante se implementan en OP-223 y OP-224
respectivamente. `DeskItem` debe dejar los puntos de extensión claros (prop `status`,
acceso a `reservation` y `assignedUser`), pero el color concreto y el tooltip son
responsabilidad de los tickets siguientes.

### Mesas esquinadas

Cuando `table.cornerExtension` es no-null, `DeskItem` renderiza dos rectángulos
posicionados absolutamente que comparten el mismo evento de click y se comportan como
una unidad visual:

- Rectángulo principal: `table.position`
- Rectángulo secundario (saliente): `table.cornerExtension`

Ambos deben heredar el mismo color de fondo (asignado en OP-223) y el mismo cursor.
La etiqueta y el indicador de ocupante (OP-224) van solo en el rectángulo principal
para evitar duplicidad visual.

## Objetivo

Crear el componente `DeskItem` en `src/components/floor-plan/DeskItem.tsx` que:

1. Reciba una `TableAvailability` completa como prop.
2. Se posicione absolutamente dentro del contenedor `FloorPlan` usando `left`, `top`,
   `width` y `height` derivados de `table.position`, expresados en píxeles.
3. Aplique `rotate` CSS si `table.position.rotation !== 0`.
4. Cuando `table.cornerExtension` no sea null, renderice un segundo rectángulo
   solidario al principal con sus propias coordenadas, mismo color de fondo y mismo
   cursor. Los dos rectángulos se comportan como una unidad de click.
5. Muestre la etiqueta (`table.label`) centrada dentro del rectángulo principal.
6. Exponga un prop `onClick?: (table: TableAvailability) => void` que se dispara
   tanto desde el rectángulo principal como desde la extensión esquinada, para que
   el ticket de detalle/reserva (OP-230) pueda engancharse sin modificar `DeskItem`.

`FloorPlan` debe actualizarse para usar `DeskItem` en lugar del placeholder.

## Restricciones

- CSS positioning con Tailwind + `style` inline para los valores dinámicos
  (`left`, `top`, `width`, `height`, `transform: rotate`). No usar librerías externas.
- Las unidades de `TablePosition` se tratan directamente como píxeles — la escala
  la gestiona `FloorPlan` a nivel de contenedor, no `DeskItem`.
- El componente es `"use client"` únicamente si lo requiere (no consume context
  propio; puede ser un componente de servidor si no tiene interactividad). Si se añade
  `onClick`, debe ser `"use client"`.
- Sin lógica de negocio dentro del componente: no calcular disponibilidad, no llamar
  a la API, no gestionar estado global.
- El color de fondo en este ticket puede ser un valor neutro (gris claro o borde
  visible) — el color definitivo por estado se aplica en OP-223.

## Casos límite

- `rotation = 0`: no aplicar ningún `transform` (evitar `rotate(0deg)` innecesario).
- `label` muy larga: truncar con `overflow-hidden text-ellipsis` para que no desborde
  el elemento visual de la mesa.
- `width` o `height` con valor 0 en el modelo: renderizar con un mínimo visual
  (p. ej. `min-width: 40px`, `min-height: 40px`) para que la mesa no desaparezca.
- Mesa sin `onClick`: el elemento no debe tener cursor pointer ni comportamiento
  interactivo hasta que el prop esté presente.
- `cornerExtension` ausente o `null`: renderizar solo el rectángulo principal —
  no debe haber un segundo elemento DOM en este caso.
- `cornerExtension` con `rotation` propia: aplicar la rotación independientemente
  de la del rectángulo principal (cada rectángulo tiene su propia transformación).

## Criterios de aceptación

- AC-1: El componente `DeskItem` existe en `src/components/floor-plan/DeskItem.tsx`
  y se exporta desde `src/components/floor-plan/index.ts`.
- AC-2: Acepta la prop `table: TableAvailability` y, opcionalmente,
  `onClick?: (table: TableAvailability) => void`.
- AC-3: Se posiciona absolutamente con `left`, `top`, `width` y `height` derivados
  de `table.position` en píxeles mediante `style` inline.
- AC-4: Aplica `transform: rotate(Ndeg)` solo cuando `table.position.rotation !== 0`.
- AC-5: Muestra `table.label` centrado y truncado si supera el ancho disponible.
- AC-6: Cuando `onClick` está presente, el elemento es clicable y lo invoca con la
  `TableAvailability` completa. Cuando no está presente, no hay cursor pointer.
- AC-7: `FloorPlan` (OP-221) sustituye los placeholders por `<DeskItem>` y le pasa
  cada `TableAvailability` del array `tables`.
- AC-8: Cuando `table.cornerExtension` es no-null, `DeskItem` renderiza un segundo
  rectángulo posicionado según esas coordenadas. Comparte el mismo handler de click
  y, visualmente, ambos rectángulos forman una sola mesa esquinada.
- AC-9: Cuando `table.cornerExtension` es `null` o `undefined`, no se renderiza
  ningún elemento adicional — el DOM contiene un único nodo por mesa.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result
