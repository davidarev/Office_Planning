# OP-173 — Verificación post-merge

## Contexto

Una vez completado el merge a `main` (OP-172), es posible que diferencias de configuración entre ramas, dependencias no contempladas o efectos colaterales del merge hayan introducido fallos que no existían en `develop`. Esta subtarea ejecuta la suite completa sobre `main` tras el merge para confirmar que el código es funcional en la rama de producción.

La verificación post-merge es simétrica a la pre-merge (OP-171) pero se ejecuta sobre `main` tras el merge commit.

## Objetivo

- Ejecutar la suite completa de verificación sobre `main` tras el merge (tests, lint, build)
- Confirmar que todos los checks retornan exit code 0 en `main`
- Identificar y documentar cualquier divergencia respecto a los resultados de OP-171
- Añadir la suite `OP-173_verificacion_post_merge` en `.ai/verify/config.yaml`

## Restricciones

- No modificar código funcional en esta subtarea salvo que sea estrictamente necesario para corregir un problema introducido por el merge (no por el código auditado)
- Si se detecta un fallo, analizar si es atribuible al merge o a un problema preexistente antes de aplicar cualquier corrección
- Los resultados deben ser comparables con los de OP-171 (mismos comandos, mismo entorno)
- Cualquier corrección aplicada en esta subtarea debe estar documentada en el Execution Result con su justificación

## Checks a ejecutar

En orden (idénticos a OP-171, sobre `main` tras el merge):

1. `npm run test:unit` — tests unitarios
2. `npm run test:integration` — tests de integración
3. `npm run test:api` — tests de API
4. `npm run lint` — ESLint sin errores
5. `npm run build` — build de Next.js sin errores

Todos deben retornar exit code 0.

## Suite de verify a añadir en `config.yaml`

```yaml
OP-173_verificacion_post_merge:
  description: 'Verifica que main pasa la suite completa tras el merge desde develop'
  enabled: true
  related_spec: '.ai/specs/OP-173-spec.md'
  verifications:
    - id: OP-173-TEST-1
      name: 'Tests unitarios en verde (post-merge, main)'
      type: npm_script
      command: npm run test:unit
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-173-TEST-2
      name: 'Tests de integración en verde (post-merge, main)'
      type: npm_script
      command: npm run test:integration
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-173-TEST-3
      name: 'Tests de API en verde (post-merge, main)'
      type: npm_script
      command: npm run test:api
      expected_result: PASS
      exit_code: 0
      timeout: 120
    - id: OP-173-LINT-1
      name: 'ESLint sin errores (post-merge, main)'
      type: npm_script
      command: npm run lint
      expected_result: PASS
      exit_code: 0
      timeout: 60
    - id: OP-173-BUILD-1
      name: 'Build de Next.js sin errores (post-merge, main)'
      type: npm_script
      command: npm run build
      expected_result: PASS
      exit_code: 0
      timeout: 180
    - id: OP-173-STRUCT-1
      name: 'node_modules instalado en main'
      type: filesystem
      checks:
        - path: node_modules
          must_exist: true
```

## Casos límite

- **`node_modules` ausente en `main`**: ejecutar `npm install` antes de los checks si el directorio no existe (es normal si es un checkout limpio).
- **Diferencias de `package-lock.json`**: si el lock fue regenerado durante el merge (caso límite de OP-172), puede que `npm install` descargue versiones ligeramente distintas. Confirmar que el build sigue pasando.
- **Variables de entorno**: si el build falla por variables ausentes, verificar que `.env.local` o `.env.example` es coherente con el estado de `main`. No commitear variables reales.
- **Tests que fallan solo en `main`**: comparar con resultado de OP-171. Si el fallo no existe en `develop`, es atribuible al merge y debe resolverse antes de etiquetar (OP-174).

## Criterios de aceptación

- AC-1: `npm run test:unit` pasa en `main` — exit code 0
- AC-2: `npm run test:integration` pasa en `main` — exit code 0
- AC-3: `npm run test:api` pasa en `main` — exit code 0
- AC-4: `npm run lint` pasa en `main` — exit code 0
- AC-5: `npm run build` pasa en `main` — exit code 0
- AC-6: Suite `OP-173_verificacion_post_merge` añadida en `.ai/verify/config.yaml`
- AC-7: Los resultados son equivalentes o mejores a los registrados en OP-171

## Criterio de done

- Todos los AC en PASS
- Spec actualizada con `## Execution Result`
