# OP-410 — Estados de carga, error y vacíos

## Contexto

Las fases 2 y 3 han construido el plano interactivo, flujo de reservas y panel admin. Cada vista necesita estados de carga (skeleton/spinner), error (mensaje amigable + reintento) y vacío (sin datos). Actualmente estas vistas pueden mostrar pantallas en blanco o errores genéricos. Depende de OP-200 y OP-300 completadas.

## Objetivo

Implementar componentes reutilizables de skeleton, error y estado vacío, e integrarlos en todas las vistas principales (plano de mesas, selectores, panel admin).

## Restricciones

- Componentes reutilizables — no repetir lógica de loading/error en cada vista
- Mensajes de error amigables, sin exponer detalles técnicos
- Skeletons que reflejen la estructura real del contenido que cargan
- Depende de OP-200 y OP-300

## Casos límite

- Error de red intermitente — opción de reintentar sin recargar página
- Carga muy rápida — el skeleton no debe producir flash visual
- Múltiples errores simultáneos — no saturar la UI con mensajes

## Criterios de aceptación

- AC-1: Componente Skeleton para plano de mesas creado — placeholder visual mientras cargan los datos
- AC-2: Componente Skeleton para tablas admin creado — placeholder para listados del panel admin
- AC-3: Componente de error reutilizable creado — mensaje amigable + botón de reintentar
- AC-4: Componentes de estados vacíos creados — "No hay mesas configuradas", "No hay reservas para este día", "No hay usuarios"
- AC-5: Estados integrados en todas las vistas — plano, selectores y panel admin usan los componentes creados

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas

| ID | Título |
|----|--------|
| OP-411 | Componente Skeleton para plano de mesas |
| OP-412 | Componente Skeleton para tablas admin |
| OP-413 | Componente de error global |
| OP-414 | Estados vacíos |
| OP-415 | Integrar estados en todas las vistas |
