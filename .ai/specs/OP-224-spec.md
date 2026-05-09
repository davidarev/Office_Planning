# OP-224 — Tooltip o indicador de ocupante

## Contexto

`DeskItem` (OP-222) renderiza cada mesa posicionada con su etiqueta. `desk-status.ts`
(OP-223) aporta el color por estado. En este ticket se añade la información del ocupante
o usuario asociado, visible en mesas `red` (con reserva o asignación fija) y `yellow`
(preferente con usuario asignado).

Los datos ya están disponibles en `TableAvailability`:
- `reservation: { _id: string; userName: string } | null` — ocupante con reserva confirmada
- `assignedUser: { _id: string; name: string } | null` — usuario habitualmente asociado

La lógica de qué nombre mostrar es:
1. Si `reservation` existe → mostrar `reservation.userName`
2. Si no hay reserva pero `assignedUser` existe → mostrar `assignedUser.name`
3. Si ninguno → no mostrar indicador

El tooltip no requiere librería externa. Dado el tamaño pequeño de las mesas en el
plano, el diseño más simple y legible es un **indicador de texto bajo la etiqueta**
visible de forma permanente (no solo en hover), complementado opcionalmente con un
atributo `title` nativo para el hover.

## Objetivo

Extender `DeskItem` para que muestre el nombre del ocupante o usuario asociado
directamente sobre el elemento de la mesa, de forma legible y sin interferir con la
etiqueta ya existente.

## Restricciones

- No usar librerías de tooltip (Radix, Floating UI, etc.). El indicador es texto
  inline dentro de `DeskItem`, con `title` nativo como complemento en hover.
- El nombre del ocupante no debe sustituir a la etiqueta (`label`) — ambos conviven:
  la etiqueta identifica la mesa, el nombre identifica al ocupante.
- Si el nombre es largo, truncar con `overflow-hidden text-ellipsis` igual que la
  etiqueta, para no desbordar el elemento visual.
- No mostrar indicador en mesas `green` (libres) ni `gray` (bloqueadas) — en esas
  no hay ocupante relevante que mostrar.
- No añadir props adicionales a `DeskItem`: toda la información necesaria ya viene
  en `table: TableAvailability`. No romper la firma establecida en OP-222.
- El indicador debe ser visualmente secundario respecto a la etiqueta: tamaño de
  fuente menor, opacidad reducida u otro recurso Tailwind que establezca jerarquía.

## Casos límite

- Mesa `red` por asignación fija (`type = "fixed"`) sin reserva activa ese día:
  `reservation` es `null` pero `assignedUser` tiene valor — mostrar `assignedUser.name`.
- Mesa `red` con reserva confirmada: mostrar `reservation.userName`, ignorar
  `assignedUser` aunque exista.
- Mesa `yellow` (preferente) sin reserva y sin `assignedUser`: no mostrar indicador
  aunque el estado sea `yellow`.
- Nombre vacío (`""`) en `userName` o `name`: tratar como ausente y no mostrar
  indicador.
- Mesas muy pequeñas en el plano donde el nombre apenas cabe: el truncado con
  ellipsis es suficiente, no ocultar el indicador entero.

## Criterios de aceptación

- AC-1: `DeskItem` muestra el nombre del ocupante debajo de la etiqueta cuando
  `reservation` tiene valor, usando `reservation.userName`.
- AC-2: `DeskItem` muestra `assignedUser.name` cuando no hay `reservation` pero sí
  `assignedUser`, y el estado es `red` o `yellow`.
- AC-3: No se muestra ningún indicador de ocupante en mesas con estado `green`
  o `gray`.
- AC-4: El nombre del ocupante está truncado con ellipsis si supera el ancho
  disponible del elemento.
- AC-5: El elemento raíz de `DeskItem` incluye el atributo `title` con el nombre
  completo del ocupante cuando aplica, para que sea accesible vía hover nativo.
- AC-6: El indicador es visualmente secundario respecto a `label` (fuente más pequeña
  o reducción de opacidad aplicada con clases Tailwind).
- AC-7: La firma de props de `DeskItem` no cambia respecto a OP-222 — sigue siendo
  `table: TableAvailability` y `onClick?`.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

**Fecha:** 2026-05-09
**Estado:** DONE

### Archivos modificados

- `src/components/floor-plan/DeskItem.tsx` — añadida función `getOccupantName`, indicador de ocupante bajo la etiqueta y atributo `title` nativo

### Criterios de aceptación

- AC-1 ✅ Muestra `reservation.userName` debajo de la etiqueta cuando hay reserva
- AC-2 ✅ Muestra `assignedUser.name` cuando no hay reserva pero sí `assignedUser` y estado `red`/`yellow`
- AC-3 ✅ No muestra indicador en mesas `green` ni `gray` (guard `showOccupant`)
- AC-4 ✅ Nombre truncado con `overflow-hidden text-ellipsis whitespace-nowrap`
- AC-5 ✅ Atributo `title` con nombre completo del ocupante en el elemento raíz
- AC-6 ✅ Indicador visualmente secundario: `text-[10px] opacity-75 leading-none`
- AC-7 ✅ Firma de props sin cambios: `table: TableAvailability` y `onClick?`

### Verificaciones

| Check | Resultado |
|---|---|
| Lint | PASS (0 errores, 4 warnings preexistentes) |
| Tests unitarios | PASS (95/95) |
| Tests integración | PASS (102/102) |
| Tests API | PASS (85/85) |
| Build | PASS |
