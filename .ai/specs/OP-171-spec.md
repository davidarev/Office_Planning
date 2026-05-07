# OP-171 — Verificación pre-merge

## Contexto

Antes de fusionar `develop` a `main`, es imprescindible confirmar que el estado actual de la rama `develop` es completamente funcional: tests en verde, sin errores de lint y build de producción exitoso. Esta subtarea ejecuta la suite completa como condición de entrada al merge.

La suite de tests al cierre de OP-166 alcanzó 249 tests en verde (62 unitarios, 102 de integración, 85 de API). Esta verificación confirma que ese estado se mantiene en el HEAD actual de `develop` antes de abrir el merge.

## Objetivo

- Ejecutar la suite completa de verificación sobre `develop` (tests, lint, build)
- Confirmar que todos los checks retornan exit code 0
- Registrar el resultado como condición de entrada formal al merge (AC de OP-172)
- Añadir la suite `OP-171_verificacion_pre_merge` en `.ai/verify/config.yaml`

## Restricciones

- No modificar código funcional ni tests en esta subtarea
- No proceder a OP-172 si cualquier check retorna exit code distinto de 0
- La verificación debe ejecutarse sobre el HEAD de `develop` en la rama `feature/OP-170-merge-develop-main-baseline`
- Si se detecta un fallo no introducido en esta historia, debe abrirse una incidencia antes de continuar

## Checks a ejecutar

En orden:

1. `npm run test:unit` — tests unitarios (Vitest)
2. `npm run test:integration` — tests de integración (Vitest + mongodb-memory-server)
3. `npm run test:api` — tests de API (Vitest + mongodb-memory-server)
4. `npm run lint` — ESLint sin errores ni warnings de error-level
5. `npm run build` — build de Next.js sin errores TypeScript ni de compilación

Todos deben retornar exit code 0.

## Suite de verify a añadir en `config.yaml`

```yaml
OP-171_verificacion_pre_merge:
  description: 'Verifica que develop pasa la suite completa antes del merge a main'
  enabled: true
  related_spec: '.ai/specs/OP-171-spec.md'
  verifications:
    - id: OP-171-TEST-1
      name: 'Tests unitarios en verde (pre-merge)'
      type: npm_script
      command: npm run test:unit
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-171-TEST-2
      name: 'Tests de integración en verde (pre-merge)'
      type: npm_script
      command: npm run test:integration
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-171-TEST-3
      name: 'Tests de API en verde (pre-merge)'
      type: npm_script
      command: npm run test:api
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-171-LINT-1
      name: 'ESLint sin errores (pre-merge)'
      type: npm_script
      command: npm run lint
      expected_result: PASS
      exit_code: 0
      timeout: 60
    - id: OP-171-BUILD-1
      name: 'Build de Next.js sin errores (pre-merge)'
      type: npm_script
      command: npm run build
      expected_result: PASS
      exit_code: 0
      timeout: 180
```

## Casos límite

- Si un test falla por estado del entorno (puerto ocupado, variables de entorno ausentes), reintentar antes de registrar como fallo real.
- Si `npm run build` falla por un tipo no resuelto o dependencia ausente, localizar el origen con `tsc --noEmit` antes de escalar.
- Si `npm run lint` genera errores en `node_modules/` o `.obsidian/`, confirmar que el `.eslintignore` o la configuración de ESLint los excluye — no son bloqueantes.

## Criterios de aceptación

- AC-1: `npm run test:unit` pasa — exit code 0
- AC-2: `npm run test:integration` pasa — exit code 0
- AC-3: `npm run test:api` pasa — exit code 0
- AC-4: `npm run lint` pasa — exit code 0
- AC-5: `npm run build` pasa — exit code 0
- AC-6: Suite `OP-171_verificacion_pre_merge` añadida en `.ai/verify/config.yaml`

## Criterio de done

- Todos los AC en PASS
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 20:15 (CET)
- Rama: feature/OP-170-merge-develop-main-baseline
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – 62/62 tests unitarios
  - AC-2: PASS – 102/102 tests de integración (6 suites)
  - AC-3: PASS – 85/85 tests de API (6 suites)
  - AC-4: PASS – 0 errores ESLint (4 warnings de nivel warning, no error-level)
  - AC-5: PASS – Build Next.js exitoso, 13 rutas generadas
  - AC-6: PASS – Suite `OP-171_verificacion_pre_merge` añadida en `.ai/verify/config.yaml`
- verify:
  - `npm run test:unit`: PASS (62/62)
  - `npm run test:integration`: PASS (102/102)
  - `npm run test:api`: PASS (85/85)
  - `npm run lint`: PASS (0 errores; 4 warnings preexistentes en tests — `Types` unused en 3 ficheros, `table3` unused en 1 fichero)
  - `npm run build`: PASS (Turbopack, 13 rutas, TypeScript OK)
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: ejecución de checks y redacción del Execution Result
- Decisiones técnicas:
  - Los 4 warnings de lint son preexistentes (existían en OP-166) y son de nivel `warning`, no `error` — no bloquean el merge según AC-4 que exige 0 errores de error-level
