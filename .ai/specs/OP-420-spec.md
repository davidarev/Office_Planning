# OP-420 — Responsive y adaptación móvil

## Contexto

La aplicación está diseñada para desktop pero README.md §12 requiere "comportamiento responsive razonable". El plano de mesas, selector de semana y panel admin necesitan adaptarse a pantallas pequeñas. Depende de OP-200 y OP-300 completadas.

## Objetivo

Asegurar que todas las vistas principales funcionan correctamente en pantallas pequeñas (móvil, tablet) con layouts adaptativos, sin perder funcionalidad.

## Restricciones

- Usar Tailwind CSS v4 responsive utilities — no media queries custom innecesarias
- El plano de mesas puede requerir scroll horizontal o zoom en móvil
- Las tablas admin deben ser legibles en pantallas pequeñas (card layout o scroll horizontal)
- Depende de OP-200 y OP-300

## Casos límite

- Plano con muchas mesas en pantalla pequeña — necesita zoom o scroll
- Formularios admin en móvil — campos deben ser accesibles sin scroll horizontal
- Selector de semana con nombres largos de días en pantalla estrecha
- Touch targets suficientemente grandes para interacción táctil

## Criterios de aceptación

- AC-1: Plano de mesas adaptado para móvil — zoom, scroll horizontal o vista simplificada funcional en pantallas pequeñas
- AC-2: Selector de semana/día adaptado — layout compacto para móvil que mantiene usabilidad
- AC-3: Panel admin adaptado — tablas de listado y formularios funcionales en pantallas móviles
- AC-4: Verificación en breakpoints clave — verificado manualmente o con tests que funciona en mobile (375px), tablet (768px) y desktop (1024px+)

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas

| ID | Título |
|----|--------|
| OP-421 | Responsive del plano de mesas |
| OP-422 | Responsive del selector de semana/día |
| OP-423 | Responsive del panel admin |
| OP-424 | Tests visuales responsive |
