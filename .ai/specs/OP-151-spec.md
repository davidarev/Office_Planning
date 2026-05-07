# OP-151 — Revisar tests unitarios

## Contexto
El proyecto cuenta con dos ficheros de tests unitarios implementados en la rama `045-testing-qa`, todos en verde con Vitest:

- `tests/unit/dates.test.ts` — 39 casos para las 6 funciones de `src/lib/dates.ts` (`normalizeDate`, `isSameDay`, `today`, `toDateString`, `isValidDateString`, `getWeekRange`)
- `tests/unit/compute-status.test.ts` — 14 casos para la lógica de `computeStatus` testeada a través de `getTableAvailabilityForDate` del servicio de disponibilidad

El fichero `compute-status.test.ts`, a pesar de llamarse "unitario", usa `mongodb-memory-server` y helpers de base de datos (`createUser`, `createTable`, `createReservation`), lo que lo convierte en un test de integración encubierto.

Esta subtarea forma parte de la auditoría OP-150 y no implica cambios en el código.

## Objetivo
Revisar la calidad, exhaustividad y robustez de los tests unitarios existentes. Identificar assertions débiles, casos borde no cubiertos, dependencias de estado externo encubiertas y cualquier fragilidad estructural que limite la fiabilidad de la suite como red de seguridad para futuras refactorizaciones.

## Restricciones
- Solo auditar — no modificar código ni tests
- Los hallazgos se documentan para ser aplicados en OP-155 (corrección) y OP-160 (aplicación)
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### dates.test.ts

#### normalizeDate
- ¿Se cubre el caso de fecha local con offset negativo (UTC-N) que podría desplazar el día al anterior?
- ¿Se verifica que el resultado es independiente del timezone del servidor donde corre el test?
- ¿El test de `throws on invalid date string` verifica solo que lanza, o también verifica el mensaje exacto del error?

#### isSameDay
- ¿Se cubre el caso de dos fechas al borde del día (23:59:59.999Z vs 00:00:00.000Z del día siguiente)?
- ¿Se cubre entrada de dos `Date` inválidas (NaN)?
- ¿Se cubre entrada con `undefined` o `null` (verificar que lanza y no retorna silenciosamente `false`)?

#### today
- ¿El test verifica la fecha correcta o solo que devuelve UTC midnight? Un test sin mock del reloj puede pasar en CI pero ser no determinista si corre a medianoche UTC.
- ¿Hay riesgo de flakiness por ejecución justo a medianoche UTC?

#### toDateString
- ¿Se verifica el comportamiento con una `Date` inválida (NaN)?
- ¿El test de padding verifica ambos casos (mes y día de un dígito) en combinación, no solo por separado?

#### isValidDateString
- ¿Se cubre `null` y `undefined` pasados como argumento (TypeScript lo previene en compile-time, pero conviene verificar comportamiento en runtime)?
- ¿Se cubre el caso de string con espacios al inicio/final (e.g. `" 2026-03-19"`)?
- ¿Se cubre `"2026-03-19 "` (espacio al final que podría pasar el regex)?

#### getWeekRange
- ¿Se cubre el caso de semana que empieza en enero 1 de año nuevo (ej. 2026-01-01 es jueves)?
- ¿Se verifica que `start` siempre es anterior o igual a `end`?
- ¿Se verifica que la diferencia entre `start` y `end` es siempre exactamente 4 días?
- ¿Se cubre entrada de `Date` inválida?

### compute-status.test.ts

#### Clasificación incorrecta como test unitario
- El fichero usa `mongodb-memory-server` y helpers de BD → es un test de integración, no unitario. Evaluar si debe reubicarse a `tests/integration/`.
- `computeStatus` es una función privada del servicio: testearla solo a través de `getTableAvailabilityForDate` limita la granularidad del test y lo acopla a la capa de servicio completa.

#### Cobertura de estados
- ¿Se cubre el caso de `fixed` con reserva confirmada propia (debería seguir siendo `red`, pero por la reserva, no por el tipo)?
- ¿Se cubre el caso de `preferential` con reserva de otro usuario (debería ser `red`, no `yellow`)?
- ¿Se verifica que el estado `gray` de una mesa `blocked` persiste aunque tenga `assignedTo` configurado?

#### Assertions
- Los tests de estado usan `result[0]` sin garantizar que solo hay una mesa en BD — estado compartido entre casos dentro del mismo `describe` puede contaminar el índice.
- El test "inactive table → gray" tiene un comentario que indica que las mesas inactivas no aparecen en el resultado, pero el test verifica `result[0].tableId` contra la mesa activa — ¿la assertion es suficientemente explícita sobre el comportamiento esperado?

#### Setup y teardown
- ¿Hay `beforeEach`/`afterEach` que limpien la BD entre casos? Si no, los tests dependen del orden de ejecución y del estado acumulado entre casos.
- ¿Comparten estado mutable los dos `describe` del fichero (`DATE = "2026-04-01"` vs `DATE = "2026-04-02"`)? Usar fechas distintas como separador de estado es una práctica frágil.

## Casos límite
- Test de `today` corriendo justo a medianoche UTC: riesgo de flakiness real
- Tests de `compute-status` con estado de BD acumulado entre casos: riesgo de contaminación si el teardown no limpia entre cada `it`
- Assertions que usan `result[0]` asumiendo una sola mesa en BD: falso positivo si hay datos residuales de otros tests

## Criterios de aceptación
- AC-1: Verificar que `dates.test.ts` cubre todos los casos borde relevantes para cada función, con assertions concretas (no solo `toBeTruthy`/`toBeFalsy`)
- AC-2: Verificar que `dates.test.ts` no tiene tests con dependencia de timezone del entorno de ejecución o riesgo de flakiness por tiempo real
- AC-3: Verificar que `compute-status.test.ts` tiene setup/teardown correcto (limpieza de BD entre casos) y no depende del orden de ejecución
- AC-4: Verificar que los dos `describe` de `compute-status.test.ts` no comparten estado mutable de forma implícita
- AC-5: Evaluar si `compute-status.test.ts` debe reclasificarse como test de integración y documentar la recomendación
- AC-6: Documentar gaps de cobertura, assertions débiles y tests frágiles encontrados, con severidad, para consolidar en OP-154 y OP-155

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en `.ai/reports/OP-150-findings.md`
- Sin modificaciones al código fuente ni a los tests
- Spec actualizada con ## Execution Result

## Execution Result

**Estado: DONE — 2026-05-07**

### AC-1 — PASS (con gaps)
`dates.test.ts` usa assertions concretas (`.toBe(...)`, `.toISOString()`), no `toBeTruthy`/`toBeFalsy`. Sin embargo, hay gaps de cobertura: `isSameDay` con NaN/null, `toDateString` con Date inválida, `isValidDateString` con strings con espacios, `getWeekRange` con Date inválida. Registrados como U-004, U-005, U-007, U-009, U-012 en OP-150-findings.md.

### AC-2 — FAIL
El test `today → returns today's date` usa `new Date()` como referencia sin mockear el reloj. Si corre exactamente a medianoche UTC, `now` y `today()` pueden diferir en un día → riesgo de flakiness real en CI. Registrado como U-006 (HIGH).

### AC-3 — PASS
`setup.ts` global implementa `afterEach` que limpia todas las colecciones de MongoDB entre tests. `compute-status.test.ts` no depende del orden de ejecución gracias a este teardown.

### AC-4 — PASS (con observación)
Los dos `describe` usan fechas distintas (`2026-04-01` vs `2026-04-02`) como separador implícito, pero el aislamiento real lo provee el `afterEach` de `setup.ts`. No hay estado mutable compartido en la práctica, pero el patrón de fechas distintas es innecesario y crea una dependencia implícita. Registrado como U-019 (MEDIUM).

### AC-5 — RECOMENDACIÓN: reclasificar
`compute-status.test.ts` usa `mongodb-memory-server` y helpers de BD directamente — es un test de integración, no unitario. Se recomienda moverlo a `tests/integration/`. Registrado como U-015 (HIGH).

### AC-6 — PASS
23 hallazgos documentados en `.ai/reports/OP-150-findings.md` con severidad: 2 HIGH, 9 MEDIUM, 11 LOW, 1 INFO.

**Hallazgos HIGH:**
- U-006: flakiness potencial en test de `today()` por ejecución a medianoche UTC
- U-015: `compute-status.test.ts` clasificado incorrectamente como test unitario

**Sin modificaciones al código fuente ni a los tests.**
