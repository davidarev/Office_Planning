# OP-223 — Colores por estado de mesa

## Contexto

`DeskItem` (OP-222) renderiza cada mesa con un color de fondo neutro. En este ticket
se sustituye ese color neutro por el color definitivo según `TableStatus`, alineado con
las reglas de negocio de README.md §7 y los tipos de dominio ya definidos en
`src/domain/types/table.ts`.

El tipo `TableStatus` ya existe:
```
"green"  → mesa libre (flexible sin reserva)
"yellow" → mesa preferente sin reserva confirmada ese día
"red"    → mesa ocupada (reserva confirmada o asignación fija)
"gray"   → mesa bloqueada o inactiva
```

Las reglas de derivación del estado (prioridad) están documentadas en `TableAvailability`:
1. `isActive = false` → `gray`
2. `type = "blocked"` → `gray`
3. reserva confirmada existe → `red`
4. `type = "fixed"` → `red`
5. `type = "preferential"` → `yellow`
6. resto → `green`

La lógica de derivación vive en el backend (`availability.service.ts`). `DeskItem`
recibe el `status` ya calculado en `TableAvailability` — no debe recalcularlo.

## Objetivo

Añadir a `DeskItem` la aplicación de color de fondo según `table.status`, de forma
que el plano refleje visualmente el estado real de cada mesa para el día seleccionado.

La implementación debe centralizarse en una función o mapa de utilidad
(`src/components/floor-plan/desk-status.ts` o similar) para que OP-224 y OP-225 puedan
reutilizarlo sin duplicar la lógica.

## Restricciones

- Los colores deben expresarse con clases Tailwind, no con `style` inline de color.
  Tailwind purga clases dinámicas si se construyen por concatenación de strings;
  usar un mapa estático `Record<TableStatus, string>` con las clases completas.
- No derivar el estado en el componente — usar siempre `table.status` recibido.
- El color debe aplicarse como clase de fondo (`bg-*`) sobre el elemento raíz de
  `DeskItem`, no sobre un hijo interior.
- No cambiar la firma de props de `DeskItem` — `table: TableAvailability` ya contiene
  `status`. No añadir un prop `status` separado.
- Los colores deben tener contraste suficiente con el texto de la etiqueta (blanco o
  negro según el fondo) para cumplir accesibilidad básica (WCAG AA).

## Casos límite

- `status` con valor inesperado (no contemplado en `TableStatus`): aplicar color
  neutro por defecto (gris) en lugar de romper el render.
- Mesa `gray`: el color gris debe comunicar claramente que no es interactuable,
  complementando la ausencia de `onClick` que ya garantiza OP-222.
- Mesa `yellow`: el amarillo debe distinguirse con claridad del verde y del gris
  en pantallas con brillo reducido.

## Criterios de aceptación

- AC-1: Existe una utilidad `statusColorMap` (o equivalente) en
  `src/components/floor-plan/desk-status.ts` que mapea cada `TableStatus` a su
  clase Tailwind de fondo y color de texto correspondiente.
- AC-2: `DeskItem` importa y aplica `statusColorMap[table.status]` como clases CSS
  sobre su elemento raíz.
- AC-3: El color verde (`green`) se aplica correctamente a mesas libres.
- AC-4: El color amarillo (`yellow`) se aplica correctamente a mesas preferentes sin
  reserva confirmada.
- AC-5: El color rojo (`red`) se aplica correctamente a mesas ocupadas o de asignación
  fija.
- AC-6: El color gris (`gray`) se aplica correctamente a mesas bloqueadas o inactivas.
- AC-7: `desk-status.ts` se exporta desde `src/components/floor-plan/index.ts` para
  que OP-224 y OP-225 puedan importarlo sin rutas relativas anidadas.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

**Fecha:** 2026-05-09
**Estado:** DONE

### Archivos creados / modificados

- `src/components/floor-plan/desk-status.ts` — nuevo archivo con `statusColorMap` y `getStatusColorClasses`
- `src/components/floor-plan/DeskItem.tsx` — importa y aplica `getStatusColorClasses(table.status)` sobre el elemento raíz
- `src/components/floor-plan/index.ts` — exporta `statusColorMap` y `getStatusColorClasses`

### Criterios de aceptación

- AC-1 ✅ `statusColorMap` en `src/components/floor-plan/desk-status.ts` mapea cada `TableStatus` a clases Tailwind completas
- AC-2 ✅ `DeskItem` importa y aplica `getStatusColorClasses(table.status)` como clases sobre el elemento raíz
- AC-3 ✅ `green` → `bg-green-500 text-white`
- AC-4 ✅ `yellow` → `bg-yellow-400 text-gray-900`
- AC-5 ✅ `red` → `bg-red-500 text-white`
- AC-6 ✅ `gray` → `bg-gray-400 text-gray-700`
- AC-7 ✅ `desk-status.ts` exportado desde `index.ts`

### Verificaciones

| Check | Resultado |
|---|---|
| Lint | PASS (0 errores, 4 warnings preexistentes) |
| Tests unitarios | PASS (95/95) |
| Tests integración | PASS (102/102) |
| Tests API | PASS (85/85) |
| Build | PASS |
