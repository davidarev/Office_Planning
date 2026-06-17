# OP-166 — Ejecutar suite completa y verificar verde

## Contexto

Una vez aplicadas todas las correcciones de OP-161 a OP-165, esta subtarea ejecuta la verificación final de la historia OP-160. Su objetivo es confirmar que el conjunto de cambios no ha introducido regresiones, que el build de producción es correcto y que la suite de verify queda registrada en `config.yaml` para trazabilidad futura.

Esta subtarea no modifica código funcional ni tests. Es una subtarea de cierre y documentación.

## Objetivo

- Ejecutar `npm run test`, `npm run lint` y `npm run build` sobre el estado final del código tras OP-161–165
- Confirmar que todos los checks pasan en verde
- Añadir la suite `OP-160_correccion_deuda_tecnica` en `.ai/verify/config.yaml`
- Actualizar las specs OP-161 a OP-165 con sus respectivos `## Execution Result` si no lo estaban
- Actualizar la spec OP-160 con su `## Execution Result` consolidado

## Restricciones

- No modificar código funcional ni tests en esta subtarea
- Si algún check falla, registrar el fallo en el Execution Result y bloquear el cierre hasta que se resuelva en la subtarea correspondiente (OP-161 a OP-165)
- La suite de verify de OP-160 debe referenciar los tres comandos globales (`test`, `lint`, `build`) y los ficheros clave creados o modificados por la historia

## Checks a ejecutar

En orden:

1. `npm run test:unit` — tests unitarios
2. `npm run test:integration` — tests de integración
3. `npm run test:api` — tests de API
4. `npm run lint` — ESLint sin errores
5. `npm run build` — build de Next.js sin errores de TypeScript ni de compilación

Todos deben retornar exit code 0.

## Suite de verify a añadir en `config.yaml`

```yaml
OP-160_correccion_deuda_tecnica:
  description: 'Verifica que todas las correcciones de OP-160 (OP-161 a OP-165) están aplicadas y la suite pasa en verde'
  enabled: true
  related_spec: '.ai/specs/OP-160-spec.md'
  verifications:
    - id: OP-160-TEST-1
      name: 'Tests unitarios en verde'
      type: npm_script
      command: npm run test:unit
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-160-TEST-2
      name: 'Tests de integración en verde'
      type: npm_script
      command: npm run test:integration
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-160-TEST-3
      name: 'Tests de API en verde'
      type: npm_script
      command: npm run test:api
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-160-LINT-1
      name: 'ESLint sin errores'
      type: npm_script
      command: npm run lint
      expected_result: PASS
      exit_code: 0
      timeout: 60
    - id: OP-160-BUILD-1
      name: 'Build de Next.js sin errores'
      type: npm_script
      command: npm run build
      expected_result: PASS
      exit_code: 0
      timeout: 180
    - id: OP-160-STRUCT-1
      name: 'src/lib/constants.ts existe (extraído de OP-163)'
      type: filesystem
      checks:
        - path: src/lib/constants.ts
          must_exist: true
    - id: OP-160-STRUCT-2
      name: 'TablePublic definida en src/domain/types/table.ts (movida de OP-162)'
      type: filesystem
      checks:
        - path: src/domain/types/table.ts
          must_exist: true
    - id: OP-160-STRUCT-3
      name: 'next-auth.d.ts existe con extensión de User (OP-161)'
      type: filesystem
      checks:
        - path: src/domain/types/next-auth.d.ts
          must_exist: true
```

## Casos límite

- Si `npm run build` falla por errores de TypeScript derivados de los cambios de tipos (OP-161), la causa más probable es una referencia a `TableWithStatus` o a `userId` en `TableAvailability` que no se actualizó. Localizar con `grep` y corregir en la subtarea correspondiente antes de cerrar OP-166.
- Si `npm run lint` falla con errores de `@typescript-eslint/no-unused-vars` por imports de tipos eliminados (`TableWithStatus`), limpiar en la subtarea correspondiente.
- Si algún test de integración falla por el cambio de `normalizeDate` en el schema (OP-161), revisar si el test pasa una `Date` con hora distinta de UTC midnight y ajustar la assertion — el nuevo comportamiento (normalización en schema) es el correcto.

## Criterios de aceptación

- AC-1: `npm run test:unit` pasa — exit code 0
- AC-2: `npm run test:integration` pasa — exit code 0
- AC-3: `npm run test:api` pasa — exit code 0
- AC-4: `npm run lint` pasa — exit code 0
- AC-5: `npm run build` pasa — exit code 0
- AC-6: Suite `OP-160_correccion_deuda_tecnica` añadida en `.ai/verify/config.yaml`
- AC-7: Specs OP-160 a OP-165 tienen `## Execution Result` completo

## Criterio de done

- Todos los AC en PASS
- Spec actualizada con `## Execution Result`

## Execution Result

**Fecha:** 2026-05-07
**Rama:** feature/OP-160-correccion-deuda-tecnica

### Fix detectado durante verificación

`npm run build` fallaba por conflicto preexistente de versiones de `@auth/core`:
- `@auth/mongodb-adapter@3.11.1` traía `@auth/core@0.41.1` anidado
- `next-auth@5.0.0-beta.30` usa `@auth/core@0.41.0`

Solución: fijar `@auth/mongodb-adapter@3.11.0` (usa exactamente `@auth/core@0.41.0`) + `npm dedupe`.

### Criterios de aceptación

| AC | Estado | Notas |
|---|---|---|
| AC-1 | PASS | 62 tests unitarios |
| AC-2 | PASS | 102 tests de integración |
| AC-3 | PASS | 85 tests de API |
| AC-4 | PASS | 0 errores de lint |
| AC-5 | PASS | Build exitoso tras deduplicación |
| AC-6 | PASS | Suite `OP-160_correccion_deuda_tecnica` añadida |
| AC-7 | PASS | Todas las specs OP-160 a OP-165 con Execution Result |

### Verificaciones

| Check | Resultado |
|---|---|
| `npm run test:unit` | PASS (62/62) |
| `npm run test:integration` | PASS (102/102) |
| `npm run test:api` | PASS (85/85) |
| `npm run lint` | PASS (0 errores) |
| `npm run build` | PASS |
