# OP-221 — Componente FloorPlan (contenedor)

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
hará `DeskItem` (OP-222).

### Disposición real de la oficina

El usuario aporta el plano de referencia en `mapa_oficina.png` (a mover desde `public/`
a `.ai/assets/` o `docs/assets/` por no ser un asset servido al cliente). Resumen:

- 7 mesas: MESA 1..7 (etiquetas literales)
- MESA 1, MESA 2: `blocked` (negro)
- MESA 3, MESA 4, MESA 6: `preferential` (naranja, `assignedTo: null` por ahora)
- MESA 5, MESA 7: `flexible` (verde)
- MESA 4 y MESA 6 son **mesas esquinadas** (forma de L): tienen un saliente además
  del rectángulo principal — ver "Soporte de mesas esquinadas" abajo.
- Elementos no-mesa visibles en el plano (ventanal, paredes, entrada/pasillo) se
  representarán como decoración estática del contenedor en este ticket.

### Soporte de mesas esquinadas

`TablePosition` actualmente solo describe un rectángulo simple. Para representar
fielmente las mesas en L (MESA 4 y MESA 6) sin contaminar el modelo con polígonos
genéricos, se añade un campo **opcional** `cornerExtension` que describe un segundo
rectángulo solidario al principal. Este ticket es el primero que lo introduce porque
el seed de la BD se genera aquí.

Cambios necesarios en el modelo (parte de los AC):

- `src/domain/types/table.ts` — añadir `cornerExtension?: TablePosition | null` a
  `TablePosition`-conteniendo interfaces (`ITable`, `TablePublic`, `TableAvailability`).
  Reutilizar la misma forma `{ x, y, width, height, rotation }` para no duplicar tipos.
- `src/lib/models/table.model.ts` — añadir el subschema opcional `cornerExtension`
  (no requerido, default `null`).

El render de la extensión es responsabilidad de `DeskItem` (OP-222). En este ticket
solo se introduce el campo y se utiliza en el seed.

## Objetivo

1. Extender el modelo de dominio (`TablePosition`-related types y schema Mongoose)
   con el campo opcional `cornerExtension`.
2. Crear el seed con la disposición real de la oficina (7 mesas, ver arriba) en
   `scripts/seed-tables.ts` (o similar), idempotente — al re-ejecutar no duplica.
3. Crear el componente `FloorPlan` en `src/components/floor-plan/FloorPlan.tsx` que:
   - Renderice un contenedor con dimensiones y escala configurables.
   - Acepte como prop un array de `TableAvailability` y las renderice como `children`
     posicionados absolutamente dentro del contenedor.
   - Consuma `useDateSelection()` para tener la fecha activa accesible en el árbol,
     aunque el fetching de datos ocurrirá en el nivel superior (página o un wrapper).
   - Establezca las bases para el posicionamiento relativo de las mesas.
4. Mover `mapa_oficina.png` desde `public/` a `.ai/assets/` (o `docs/assets/`).

## Restricciones

- Usar CSS positioning (`position: relative` en contenedor, `position: absolute` en
  mesas) con Tailwind. No usar librerías de diagramación (D3, Konva, etc.).
- El componente debe ser `"use client"` ya que consume context.
- Las dimensiones del plano deben ser configurables via props (`width`, `height`) con
  valores por defecto razonables. Las unidades internas del modelo (`TablePosition`)
  se mapearán a píxeles o porcentajes en `DeskItem` (OP-222), no aquí.
- No hardcodear datos de mesas en el componente. `FloorPlan` recibe
  `tables: TableAvailability[]`. El seed sí contiene los datos reales — es su rol.
- No introducir lógica de fetching dentro del componente — eso corresponde a la
  página o a un wrapper de datos (Server Component o `useEffect`).
- No acoplar a la API directamente. `FloorPlan` es un componente de presentación pura.
- `cornerExtension` no es un polígono genérico: es exactamente un segundo rectángulo
  con la misma forma que `TablePosition`. Si en el futuro hace falta más complejidad,
  se reevalúa entonces (CLAUDE.md §15).
- El seed debe ser idempotente: usar `updateOne` con `upsert` por `label`, no
  `insertMany` ciego. No borrar reservas existentes al re-seedear.

## Casos límite

- `tables` array vacío: renderizar el contenedor vacío con un mensaje de estado
  ("No hay mesas configuradas") en lugar de un espacio en blanco sin contexto.
- Props `width` o `height` con valor 0 o negativo: usar los valores por defecto.
- El contenedor debe ser scrollable si el plano supera el viewport en pantallas pequeñas.

## Criterios de aceptación

- AC-1: `src/domain/types/table.ts` añade el campo opcional `cornerExtension: TablePosition | null`
  a `ITable`, `TablePublic` y `TableAvailability`. La forma del subobjeto reutiliza
  `TablePosition` para no duplicar tipos.
- AC-2: `src/lib/models/table.model.ts` añade el subschema opcional `cornerExtension`
  (default `null`) reusando la misma definición que `PositionSchema`.
- AC-3: Existe un script de seed idempotente (p. ej. `scripts/seed-tables.ts`) que
  inserta o actualiza las 7 mesas reales de la oficina con sus posiciones, tipos y
  `cornerExtension` para MESA 4 y MESA 6. Se documenta cómo ejecutarlo
  (`npm run seed:tables` o equivalente en `package.json`).
- AC-4: El componente `FloorPlan` existe en `src/components/floor-plan/FloorPlan.tsx`
  y se exporta también desde `src/components/floor-plan/index.ts`.
- AC-5: Acepta props `tables: TableAvailability[]`, `width?: number` y `height?: number`.
  Los valores por defecto de `width` y `height` están documentados en el componente.
- AC-6: Renderiza un contenedor con `position: relative` que actúa como lienzo de
  posicionamiento para las mesas hijas.
- AC-7: Itera sobre `tables` y renderiza un placeholder (`<div>`) por cada mesa,
  posicionado absolutamente según `table.position.x` e `table.position.y` en píxeles.
  (El componente real `DeskItem` y el render de `cornerExtension` se integran en OP-222.)
- AC-8: Cuando `tables` está vacío, muestra un mensaje de estado vacío en lugar de
  un contenedor en blanco.
- AC-9: El componente integra `useDateSelection()` internamente — la fecha seleccionada
  está disponible en el árbol para uso futuro (aunque no se use aún en este ticket).
- AC-10: La página principal (`src/app/(main)/page.tsx`) integra `FloorPlan` dentro de
  `DateSelectionProvider`, sustituyendo el mensaje placeholder actual.
- AC-11: `mapa_oficina.png` se mueve fuera de `public/` (a `.ai/assets/` o `docs/assets/`)
  para evitar exposición pública de información de layout interno.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-05-08 21:55 (CET)
- Rama: feature/OP-220-componente-plano-mesas
- Commit base: 370acb66 (commit de implementación se añadirá tras `git commit`)
- Herramienta IA: Claude Code claude-opus-4-7
- Estado de AC:
  - AC-1: PASS – `cornerExtension?: TableRect | null` añadido a `TablePosition` (heredado por `ITable`, `TablePublic`, `TableAvailability`). Se introduce el alias `TableRect` (misma forma `{x,y,width,height,rotation}`) para evitar recursividad sin duplicar la noción de rectángulo.
  - AC-2: PASS – `RectSchema` compartido y `cornerExtension` opcional con default `null` añadido a `PositionSchema` en `table.model.ts`.
  - AC-3: PASS – `scripts/seed-tables.ts` idempotente (upsert por `label`, no toca reservas) con las 7 mesas reales y `cornerExtension` para MESA 4 y MESA 6. Script `npm run seed:tables` añadido a `package.json` (carga `.env.local` vía `tsx --env-file`).
  - AC-4: PASS – `src/components/floor-plan/FloorPlan.tsx` y `src/components/floor-plan/index.ts` creados.
  - AC-5: PASS – Props `tables`, `width?`, `height?` con defaults `DEFAULT_FLOOR_PLAN_WIDTH = 900` y `DEFAULT_FLOOR_PLAN_HEIGHT = 600` exportados desde el módulo.
  - AC-6: PASS – Contenedor con `position: relative` (clase Tailwind `relative`) actuando como lienzo de posicionamiento.
  - AC-7: PASS – Itera sobre `tables` y renderiza un `<div>` placeholder por mesa con `position: absolute` (clase `absolute`) usando `position.x` / `position.y` en píxeles. El render real con `cornerExtension` se delega a `DeskItem` (OP-222).
  - AC-8: PASS – Cuando `tables` está vacío, muestra un mensaje "No hay mesas configuradas" con `role="status"`.
  - AC-9: PASS – `useDateSelection()` se invoca dentro del componente para forzar suscripción al contexto.
  - AC-10: PASS – `src/app/(main)/page.tsx` envuelve `FloorPlan` en `DateSelectionProvider`. El placeholder original ha sido sustituido.
  - AC-11: PASS – `mapa_oficina.png` movido de `public/` a `.ai/assets/`. La entrada genérica del `.gitignore` (`mapa_oficina.png`) sigue cubriendo la nueva ubicación.
- Ficheros creados o modificados:
  - `src/domain/types/table.ts` (añade `cornerExtension` y `TableRect`)
  - `src/domain/types/index.ts` (re-exporta `TableRect`)
  - `src/lib/models/table.model.ts` (añade `RectSchema` y `cornerExtension` opcional)
  - `src/components/floor-plan/FloorPlan.tsx` (nuevo)
  - `src/components/floor-plan/index.ts` (nuevo)
  - `src/app/(main)/page.tsx` (integra `FloorPlan` dentro de `DateSelectionProvider`)
  - `scripts/seed-tables.ts` (nuevo, seed idempotente)
  - `package.json` (script `seed:tables`, dep `tsx`)
  - `package-lock.json` (instalación de `tsx`)
  - `.ai/assets/mapa_oficina.png` (movido desde `public/`)
  - `.ai/verify/config.yaml` (nueva suite `OP-221_componente_floor_plan`)
- verify:
  - Comando ejecutado: `npm run lint`, `npm run test`, `npm run build`
  - Resultado: PASS – Lint 0 errores (solo warnings preexistentes ajenos al ticket); 282/282 tests; build de Next.js correcto.
- AI-assisted:
  - Herramienta(s): Claude Code (claude-opus-4-7)
  - Alcance: extensión de tipos y schema, componente `FloorPlan`, script de seed, integración en `page.tsx`, suite de verify.
- Decisiones técnicas:
  - `cornerExtension` se modela con un nuevo tipo plano `TableRect` (mismos campos que `TablePosition` salvo el propio `cornerExtension`) para evitar recursividad innecesaria. La spec pedía "reutilizar la forma `{x,y,width,height,rotation}` para no duplicar tipos": se reutiliza la forma vía `TableRect`, sin duplicar literales en cada interfaz que contiene posición.
  - El componente `FloorPlan` no realiza fetching: la página le pasa `tables=[]` por ahora y el estado vacío sirve como placeholder funcional hasta OP-222/OP-230, donde se cableará el endpoint de disponibilidad.
  - Para ejecutar el seed se añade `tsx` como devDependency. Se usa la flag nativa `--env-file=.env.local` (Node ≥20.6) para no introducir `dotenv` solo para el seed.
  - Coordenadas del seed son aproximadas a un lienzo lógico de 900×600 px; se ajustarán visualmente al integrar `DeskItem`.
