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
