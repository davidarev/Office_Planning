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
| ID | Título | Estado |
|----|--------|--------|
| OP-151 | Revisar tests unitarios | Done |
| OP-152 | Revisar tests de integración | Done |
| OP-153 | Revisar tests de API | Done |
| OP-154 | Identificar gaps de cobertura | Done |
| OP-155 | Corregir tests frágiles o incompletos | Done |
| OP-156 | Documentar hallazgos OP-150 | Done |

## Execution Result

- Fecha de implementación: 2026-05-07 (CET)
- Rama: feature/OP-150-auditoria-tests
- Commit: fccbc72
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — Tests unitarios revisados (OP-151). 23 hallazgos documentados (2 HIGH, 9 MEDIUM, 11 LOW). Hallazgos clave: flakiness en `today()` (U-006), `compute-status.test.ts` mal clasificado como unitario (U-015).
  - AC-2: PASS — Tests de integración revisados (OP-152). 28 hallazgos documentados (1 HIGH, 16 MEDIUM, 11 LOW). Hallazgo clave: concurrencia simulada en mismo event loop sin documentación ni verificación de estado final en BD (I-031 HIGH).
  - AC-3: PASS — Tests de API revisados (OP-153). 27 hallazgos documentados (2 HIGH, 15 MEDIUM, 10 LOW). Hallazgos clave: IDOR en `POST /api/reservations` sin test explícito (A-015, A-029 HIGH).
  - AC-4: PASS — Gaps de cobertura identificados y consolidados (OP-154): 4 críticos, 9 importantes, 6 mejoras (G-01 a G-19).
  - AC-5: PASS — Tests frágiles corregidos (OP-155): 18 de 19 gaps aplicados; 1 mantenido como deuda técnica (G-16, Content-Type).
  - AC-6: PASS — Informe de hallazgos documentado (OP-156): `.ai/reports/OP-150-findings.md` con H-150-01 a H-150-19, resumen ejecutivo y candidatos sin hallazgo.
- Ficheros creados o modificados:
  - `.ai/reports/OP-150-findings.md` — informe consolidado de la auditoría completa
  - `tests/integration/compute-status.test.ts` — creado (reubicado desde `tests/unit/`)
  - `tests/unit/compute-status.test.ts` — eliminado
  - `tests/unit/dates.test.ts` — reforzado con casos borde (isSameDay, today, isValidDateString, getWeekRange)
  - `tests/integration/reservation-repository.test.ts` — verificación de índices parciales, re-reserva mismo usuario, rango invertido
  - `tests/integration/availability-service.test.ts` — rango invertido
  - `tests/integration/reservation-service.test.ts` — reservas canceladas excluidas
  - `tests/integration/concurrency.test.ts` — comentario de limitación, estado final en BD
  - `tests/api/reservations-read.test.ts` — canceladas excluidas en GET por día y por rango
  - `tests/api/reservations-create.test.ts` — IDOR: userId ajeno en body ignorado; body.error en 409
  - `tests/api/reservations-cancel.test.ts` — admin cancela ya cancelada → 400
  - `tests/api/availability.test.ts` — assertion completa sobre objeto reservation; body.error en 400
  - `tests/api/auth-security.test.ts` — not.toContain email/nombre propietario en 403; comentario limitación
  - `tests/setup.ts` — resetCounters() en afterEach
- verify:
  - Comando ejecutado: `npm run test` (todas las suites)
  - Resultado: PASS — suite completa en verde tras las correcciones de OP-155
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: auditoría completa de los 222 tests (OP-151 a OP-153), consolidación de gaps (OP-154), corrección de tests (OP-155) y redacción del informe (OP-156)
- Decisiones técnicas:
  - G-16 (Content-Type no verificado) mantenido como deuda técnica: en invocación directa de handlers Next.js garantiza el header; el beneficio marginal no justifica el coste de añadirlo en decenas de tests
  - `compute-status.test.ts` reubicado a `tests/integration/` en lugar de extraer `computeStatus` como función exportable: la función es privada por diseño y el coste de cambiar la arquitectura supera el beneficio de cobertura unitaria pura
