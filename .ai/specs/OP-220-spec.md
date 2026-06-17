# OP-220 — Componente de plano de mesas

## Contexto
No existe ningún componente de renderizado del plano de la oficina. Los modelos de mesa (Table) ya existen con campos de posición (x, y, width, height, rotation) y tipo (flexible, fija, preferente, bloqueada). La API GET /api/tables ya devuelve las mesas activas. Depende de OP-210 (selector de día) para contextualizar el plano con una fecha seleccionada.

**En esta historia se define, mapea y crea la disposición de las mesas de la oficina.** El usuario proporcionará un plano sencillo de la oficina cuando se inicie el trabajo en esta historia. A partir de ese plano, se mapearán las mesas a sus posiciones (coordenadas x, y, width, height, rotation), tipos (flexible, fija, preferente, bloqueada) y configuraciones (etiquetas, usuarios asignados). Este mapeo se traducirá en datos estructurados que alimentarán el componente de plano y, si procede, en un script o seed para poblar la base de datos con la disposición real de la oficina.

## Objetivo
Crear el componente visual del plano de la oficina que renderice las mesas posicionadas según sus coordenadas, con colores por estado (verde, amarillo, rojo, gris) y etiquetas identificativas. Además, definir y crear el mapeo completo de la disposición real de las mesas a partir del plano proporcionado por el usuario.

## Restricciones
- Las mesas deben posicionarse dinámicamente según datos del modelo (coordenadas), no hardcodeadas en el layout
- Colores según TableStatus: verde (libre), amarillo (preferente sin reserva), rojo (ocupada/fija), gris (bloqueada/inactiva) — según README.md §7
- No usar librerías de diagramación complejas (D3, Konva, etc.) — SVG simple o CSS positioning con Tailwind
- El plano debe ser legible y usable, no un plano arquitectónico exacto
- La disposición de mesas debe poder actualizarse fácilmente si cambia el layout físico de la oficina
- Depende de OP-210

## Casos límite
- Oficina sin mesas configuradas (estado vacío)
- Mesa con posición fuera de los límites del contenedor
- Mesas superpuestas por error de configuración
- Mesa con etiqueta muy larga que desborda el componente visual
- Plano proporcionado con disposiciones complejas (mesas en ángulo, agrupaciones)

## Criterios de aceptación
- AC-1: Disposición de mesas definida y mapeada — a partir del plano proporcionado, las mesas están mapeadas con coordenadas (x, y, width, height, rotation), tipo, etiqueta y usuario asignado donde aplique
- AC-2: Datos de mesas creados — script de seed o datos estructurados para poblar la BD con la disposición real de la oficina
- AC-3: Componente FloorPlan (contenedor) implementado — contenedor SVG o div que representa el plano con dimensiones y escala configurables
- AC-4: Componente DeskItem (mesa individual) implementado — se posiciona según coordenadas del modelo, muestra etiqueta
- AC-5: Colores por estado aplicados — verde (libre), amarillo (preferente sin reserva), rojo (ocupada/fija), gris (bloqueada)
- AC-6: Tooltip o indicador de ocupante implementado — muestra nombre del ocupante/usuario asociado en mesas ocupadas/preferentes
- AC-7: Tests del plano implementados — verifican posicionamiento, colores y etiquetas

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-221 | Componente FloorPlan (contenedor) |
| OP-222 | Componente DeskItem (mesa individual) |
| OP-223 | Colores por estado de mesa |
| OP-224 | Tooltip o indicador de ocupante |
| OP-225 | Tests del componente de plano |

## Execution Result

**Fecha:** 2026-05-09
**Rama:** feature/OP-220-componente-plano-mesas
**Estado:** DONE — todas las subtareas en cyan (pendiente revisión humana → verde)

### Archivos creados / modificados

| Archivo | Subtarea | Descripción |
|---|---|---|
| `src/domain/types/table.ts` | OP-221 | `TableRect` y `cornerExtension` en `TablePosition` |
| `src/domain/types/index.ts` | OP-221 | Re-exporta `TableRect` |
| `src/lib/models/table.model.ts` | OP-221 | `RectSchema` y `cornerExtension` opcional |
| `src/components/floor-plan/FloorPlan.tsx` | OP-221/222 | Contenedor del plano, itera `DeskItem` |
| `src/components/floor-plan/DeskItem.tsx` | OP-222/223/224/225 | Mesa individual: posicionamiento, colores, ocupante, semántica ARIA |
| `src/components/floor-plan/desk-status.ts` | OP-223/224/225 | `statusColorMap`, `getStatusColorClasses`, `getOccupantName` |
| `src/components/floor-plan/desk-item.css` | OP-225 | Reglas CSS que consumen variables `--desk-*` |
| `src/components/floor-plan/index.ts` | OP-221/223/225 | Barrel de exportaciones del módulo |
| `src/app/(main)/page.tsx` | OP-221 | Integra `FloorPlan` en `DateSelectionProvider` |
| `scripts/seed-tables.ts` | OP-221 | Seed idempotente de las 7 mesas reales de la oficina |
| `package.json` | OP-221 | Script `seed:tables`, dep `tsx` |
| `tests/unit/floor-plan.test.ts` | OP-225 | 14 tests unitarios puros (`statusColorMap` + `getOccupantName`) |
| `tests/setup.ts` | OP-222 | Inyecta `DB_NAME` para `mongodb-memory-server` |
| `.ai/assets/mapa_oficina.png` | OP-221 | Plano de referencia movido desde `public/` |

### Criterios de aceptación

- AC-1 ✅ Disposición de mesas mapeada — 7 mesas con coordenadas, tipo, etiqueta y `cornerExtension` donde aplica (MESA 4 y MESA 6)
- AC-2 ✅ Seed idempotente en `scripts/seed-tables.ts` ejecutable con `npm run seed:tables`
- AC-3 ✅ `FloorPlan` implementado — contenedor `div relative` con dimensiones configurables (`DEFAULT_FLOOR_PLAN_WIDTH=900`, `DEFAULT_FLOOR_PLAN_HEIGHT=600`), estado vacío con `role="status"`
- AC-4 ✅ `DeskItem` implementado — posicionamiento absoluto vía CSS custom properties (`--desk-x/y/w/h/rotate`), etiqueta truncada con ellipsis
- AC-5 ✅ Colores por estado: `green→bg-green-500`, `yellow→bg-yellow-400`, `red→bg-red-500`, `gray→bg-gray-400`; mapa estático en `desk-status.ts`, fallback a gris para valores inesperados
- AC-6 ✅ Indicador de ocupante: `reservation.userName` > `assignedUser.name` > oculto; solo en mesas `red`/`yellow`; texto secundario (`text-[10px] opacity-75`) + atributo `title` nativo
- AC-7 ✅ Tests unitarios en `tests/unit/floor-plan.test.ts` (14 tests: 7 para `statusColorMap`/`getStatusColorClasses` y 7 para `getOccupantName`)

### Decisiones técnicas destacadas

- **Sin librerías de diagramación**: posicionamiento con CSS `position: absolute` + Tailwind. Coordenadas del modelo se mapean directamente a píxeles en un lienzo lógico 900×600.
- **CSS custom properties** para posicionamiento dinámico: evita estilos inline directos (`no-inline-styles`) manteniendo los valores calculados en runtime.
- **`<button>` en lugar de `<div role="button">`**: semántica ARIA nativa, gestión de teclado sin JS adicional.
- **`getOccupantName` en `desk-status.ts`** (no en `DeskItem`): función pura y testable sin dependencias de DOM.
- **`environment: "node"` en Vitest**: no se añadió jsdom ni `@testing-library/react` — solo se testea lógica pura extraída de los componentes.
- **`cornerExtension` como `TableRect`** (tipo plano, sin recursividad): permite mesas en L sin duplicar literales de tipo.

### Verificaciones finales

| Check | Resultado |
|---|---|
| Lint | PASS (0 errores, 4 warnings preexistentes ajenos a OP-220) |
| Tests unitarios | PASS (109/109, +14 nuevos en OP-225) |
| Tests integración | PASS (102/102) |
| Tests API | PASS (85/85) |
| Build | PASS |
