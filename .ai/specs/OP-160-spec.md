# OP-160 — Corrección de deficiencias y deuda técnica

## Contexto
Las auditorías de las historias OP-110 a OP-150 habrán identificado deficiencias en modelos, tipos, repositorios, servicios, API routes, autenticación y tests. Esta historia aplica las correcciones necesarias sin cambiar funcionalidad. Depende de que todas las auditorías estén completadas.

## Objetivo
Aplicar todas las correcciones encontradas en las auditorías anteriores: modelos, tipos, repositorios, servicios, API routes, autenticación y tests. Refactorizar lo necesario sin cambiar comportamiento funcional. Asegurar que toda la suite pasa tras las correcciones.

## Restricciones
- No cambiar funcionalidad existente — solo corregir deficiencias
- Todas las correcciones deben estar trazadas a hallazgos de OP-110 a OP-150
- No introducir nuevas dependencias sin justificación
- Depende de OP-110, OP-120, OP-130, OP-140 y OP-150 completadas

## Casos límite
- Correcciones en modelos que requieren reindexación
- Cambios en tipos que rompen contratos existentes
- Correcciones en servicios que cambian comportamiento de tests existentes
- Nuevos tests que descubren bugs adicionales durante la corrección

## Criterios de aceptación
- AC-1: Correcciones a modelos y tipos aplicadas — deficiencias de OP-110 corregidas
- AC-2: Correcciones a repositorios y servicios aplicadas — deficiencias de OP-120 corregidas
- AC-3: Correcciones a API routes y middleware aplicadas — deficiencias de OP-130 corregidas
- AC-4: Correcciones a autenticación aplicadas — deficiencias de OP-140 corregidas
- AC-5: Tests faltantes implementados y tests frágiles corregidos — deficiencias de OP-150 corregidas
- AC-6: Suite completa ejecutada y en verde — `npm run test`, `npm run lint` y `npm run build` pasan

## Criterio de done
- Todos los AC en PASS
- verify en verde (`npm run test && npm run lint && npm run build`)
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-161 | Aplicar correcciones a modelos y tipos |
| OP-162 | Aplicar correcciones a repositorios y servicios |
| OP-163 | Aplicar correcciones a API routes y middleware |
| OP-164 | Aplicar correcciones a autenticación |
| OP-165 | Aplicar correcciones y nuevos tests |
| OP-166 | Ejecutar suite completa y verificar verde |
