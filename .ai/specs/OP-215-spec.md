# OP-215 — Tests del selector de semana y día

> Historia padre: OP-210 | Depende de: OP-211, OP-212, OP-213, OP-214

## Contexto

Tras OP-211 a OP-214, existen:
- `src/lib/week-selector.ts` — lógica pura: `getWorkWeeks`, `getDefaultWorkDay`, `WorkWeek`, `WorkDay`
- `src/components/booking/WeekSelector.tsx` — componente controlado
- `src/components/booking/DaySelector.tsx` — componente controlado
- `src/components/booking/DateSelectionProvider.tsx` — provider de estado + contexto
- `src/context/date-selection.context.ts` — `useDateSelection()`

El proyecto usa **Vitest** con `environment: "node"` global (ver `vitest.config.ts`). Los tests existentes en `tests/unit/` son tests unitarios puros sin DOM. No hay jsdom ni testing-library configurados.

## Objetivo

Crear los tests que cubran los AC de OP-211 a OP-214. El foco principal son los tests unitarios de `week-selector.ts` (lógica pura, sin DOM). Los tests de componente quedan fuera del alcance de esta subtarea dado que requieren configurar jsdom y `@testing-library/react`, lo cual es una decisión de infraestructura que excede el scope de OP-210.

## Restricciones

- Tests en `tests/unit/week-selector.test.ts`
- Usar solo Vitest (`describe`, `it`, `expect`, `vi`) — sin dependencias nuevas
- No añadir jsdom ni testing-library en esta subtarea — si se necesita en el futuro, se aborda en una historia de infraestructura de testing
- Las funciones deben ser testables sin mockear `Date` gracias al parámetro `referenceDate` de OP-211
- No testear comportamiento interno de React (renderizado, hooks) — solo lógica de dominio

## Cobertura esperada

### `getWorkWeeks(referenceDate)`

| Caso | `referenceDate` de ejemplo |
|------|---------------------------|
| Día laborable normal (miércoles) | `2026-05-06` (miércoles) |
| Lunes — primer día de semana | `2026-05-04` (lunes) |
| Viernes — último día de semana | `2026-05-08` (viernes) |
| Sábado — fuera de semana laboral | `2026-05-09` (sábado) |
| Domingo — fuera de semana laboral | `2026-05-10` (domingo) |
| Cruce de mes (semana L–V) | `2026-03-31` (martes, semana 30 mar – 3 abr) |
| Cruce de año | `2025-12-31` (miércoles, semana 29 dic – 2 ene) |

Para cada caso verificar:
- Devuelve exactamente 2 semanas
- Cada semana tiene exactamente 5 `WorkDay`
- Los días son L, M, X, J, V en orden (verificar `label` o `getUTCDay()`)
- Todos los días están normalizados (UTC midnight)
- `weekOffset` es 0 para semana actual y 1 para la siguiente
- `label` de cada semana refleja correctamente el rango

### `getDefaultWorkDay(referenceDate)`

| Caso | `referenceDate` | Día esperado |
|------|----------------|--------------|
| Lunes | `2026-05-04` | lunes 4 may |
| Miércoles | `2026-05-06` | miércoles 6 may |
| Viernes | `2026-05-08` | viernes 8 may |
| Sábado | `2026-05-09` | lunes 11 may (semana siguiente) |
| Domingo | `2026-05-10` | lunes 11 may (semana siguiente) |

Para cada caso verificar:
- El `WorkDay` devuelto tiene `dateString` correcto
- La fecha está normalizada (UTC midnight)
- El `label` corresponde al día de la semana esperado

### Invariantes estructurales

- Todos los `WorkDay` tienen `dateString` en formato `YYYY-MM-DD` válido
- El segundo `WorkDay` de cada semana es siempre martes (offset +1 día desde lunes)
- El quinto `WorkDay` de cada semana es siempre viernes (offset +4 días desde lunes)
- Las dos semanas devueltas por `getWorkWeeks` no se solapan

## Criterios de aceptación

- AC-1: Tests de `getWorkWeeks` cubren día laborable normal, lunes, viernes, sábado, domingo, cruce de mes y cruce de año
- AC-2: Tests de `getDefaultWorkDay` cubren lunes, miércoles, viernes, sábado y domingo
- AC-3: Tests verifican invariantes estructurales (5 días por semana, orden L–V, UTC midnight, no solapamiento)
- AC-4: Todos los tests pasan con `npm run test:unit` sin dependencias nuevas
- AC-5: No se mockea `Date` globalmente — se usa el parámetro `referenceDate` inyectable

## Criterio de done

- Todos los AC en PASS
- `npm run test:unit` en verde
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 21:13 (CET)
- Rama: feature/OP-210-selector-semana-dia
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — tests de `getWorkWeeks` cubren miércoles, lunes, viernes, sábado, domingo, cruce de mes (30 mar – 3 abr) y cruce de año (29 dic – 2 ene)
  - AC-2: PASS — tests de `getDefaultWorkDay` cubren lunes, miércoles, viernes, sábado y domingo; también cruces de mes y año en fin de semana
  - AC-3: PASS — invariantes verificados: 2 semanas, 5 días c/u, orden L–V (getUTCDay 1–5), UTC midnight, no solapamiento, 7 días entre lunes
  - AC-4: PASS — `npm run test:unit` en verde (95/95), sin dependencias nuevas
  - AC-5: PASS — todos los tests usan `referenceDate` inyectable; ningún mock global de `Date`
- Ficheros creados o modificados:
  - `tests/unit/week-selector.test.ts` (creado en OP-211, ya cubría los AC de OP-215)
- verify:
  - Comando ejecutado: `npm run test:unit`
  - Resultado: PASS — 95 tests en verde
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: verificación de cobertura y cierre de tarea
- Decisiones técnicas:
  - Los tests se crearon durante OP-211 ya cubriendo los AC de OP-215; OP-215 actúa como tarea de verificación y cierre formal de la cobertura de tests de la historia OP-210
