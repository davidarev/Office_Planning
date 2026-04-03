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
| ID | Título |
|----|--------|
| OP-211 | Lógica de cálculo de semanas |
| OP-212 | Componente WeekSelector |
| OP-213 | Componente DaySelector |
| OP-214 | Estado y contexto de fecha seleccionada |
| OP-215 | Tests del selector de semana y día |
