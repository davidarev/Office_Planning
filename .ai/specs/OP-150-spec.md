# OP-150 — Auditoría y refuerzo de tests

## Contexto
El proyecto cuenta con 222 tests (unitarios, integración y API) implementados en la rama `045-testing-qa`, todos en verde. Usan Vitest + mongodb-memory-server. Los tests cubren dates.ts, compute-status, servicios, repositorios y endpoints. Las auditorías de servicios (OP-120) y API (OP-130) deben completarse primero para conocer el estado real del código que los tests cubren.

## Objetivo
Revisar la calidad, cobertura y robustez del test suite existente. Identificar gaps de cobertura, tests frágiles, y escenarios críticos no cubiertos.

## Restricciones
- No modificar código — solo auditar y documentar
- Los hallazgos se aplican en OP-160
- Depende de OP-120 y OP-130 completadas

## Casos límite
- Tests que dependen de orden de ejecución
- Tests que comparten estado mutable entre casos
- Assertions débiles (toBeTruthy en lugar de verificar valor concreto)
- Tests de concurrencia que no prueban realmente ejecución simultánea
- Escenarios de error no cubiertos (E11000, timeouts, datos inválidos)

## Criterios de aceptación
- AC-1: Tests unitarios revisados — cobertura de casos borde en dates.ts y compute-status, calidad de assertions verificados
- AC-2: Tests de integración revisados — cobertura de reglas de negocio en servicios/repositorios, setup/teardown, uso de mongodb-memory-server verificados
- AC-3: Tests de API revisados — cobertura de escenarios (éxito, error, auth), mocks de sesión, assertions de respuesta HTTP verificados
- AC-4: Gaps de cobertura identificados — lista de escenarios críticos no cubiertos documentada
- AC-5: Tests frágiles o incompletos identificados — tests dependientes de orden, timing o estado compartido documentados
- AC-6: Informe de hallazgos documentado

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-151 | Revisar tests unitarios |
| OP-152 | Revisar tests de integración |
| OP-153 | Revisar tests de API |
| OP-154 | Identificar gaps de cobertura |
| OP-155 | Corregir tests frágiles o incompletos |
| OP-156 | Documentar hallazgos OP-150 |
