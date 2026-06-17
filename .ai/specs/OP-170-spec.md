# OP-170 — Merge develop → main y baseline

## Contexto
Todo el trabajo del proyecto está en la rama `develop`, mientras que `main` está en el commit inicial. Tras completar las correcciones de OP-160, el código estará auditado, corregido y con tests en verde. Es el momento de fusionar a `main` y establecer la baseline del proyecto. Depende de OP-160 completada.

## Objetivo
Fusionar develop a main de forma controlada, verificar que todo funciona tras el merge, y establecer la baseline del proyecto con un tag de versión.

## Restricciones
- Solo fusionar si la suite completa pasa en develop
- No hacer force push ni reescribir historia
- Resolver conflictos conservando el código auditado
- Depende de OP-160 completada

## Casos límite
- Conflictos de merge entre develop y main
- Tests que pasan en develop pero fallan en main tras merge (diferencias de configuración)
- Build que falla en main por dependencias no contempladas

## Criterios de aceptación
- AC-1: Verificación pre-merge completada — suite completa (tests, lint, build) pasa en develop
- AC-2: Merge develop → main realizado — sin conflictos o conflictos resueltos correctamente
- AC-3: Verificación post-merge completada — suite completa pasa en main tras el merge
- AC-4: Tag de baseline creado — versión v0.1.0 (o similar) etiquetando la baseline auditada

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título | Estado |
|----|--------|--------|
| OP-171 | Verificación pre-merge | cyan (Review) |
| OP-172 | Merge develop → main | cyan (Review) |
| OP-173 | Verificación post-merge | cyan (Review) |
| OP-174 | Etiquetar baseline | cyan (Review) |

## Execution Result

- Fecha de implementación: 2026-05-07 20:24 (CET)
- Rama: feature/OP-170-merge-develop-main-baseline
- Merge commit en main: `8e9546e`
- Tag baseline: `v0.1.0`
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – OP-171 completada; 249/249 tests, lint 0 errores, build OK en `develop`
  - AC-2: PASS – OP-172 completada; merge `--no-ff` sin conflictos, publicado en remoto (`a07f620..8e9546e`)
  - AC-3: PASS – OP-173 completada; 249/249 tests, lint 0 errores, build OK en `main` — sin regresiones
  - AC-4: PASS – OP-174 completada; tag anotado `v0.1.0` sobre `8e9546e`, publicado en remoto
- Subtareas:
  - OP-171: PASS – [spec](.ai/specs/OP-171-spec.md)
  - OP-172: PASS – [spec](.ai/specs/OP-172-spec.md)
  - OP-173: PASS – [spec](.ai/specs/OP-173-spec.md)
  - OP-174: PASS – [spec](.ai/specs/OP-174-spec.md)
- verify:
  - `npm run test:unit`: PASS (62/62) — verificado en develop y main
  - `npm run test:integration`: PASS (102/102) — verificado en develop y main
  - `npm run test:api`: PASS (85/85) — verificado en develop y main
  - `npm run lint`: PASS (0 errores) — verificado en develop y main
  - `npm run build`: PASS — verificado en develop y main
- Casos límite resueltos:
  - Sin conflictos de merge: `main` estaba en el commit inicial, merge limpio con estrategia `ort`
  - Sin regresiones post-merge: resultados idénticos en `develop` y `main`
  - Build en `main` sin problemas de dependencias
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: ejecución completa de todas las subtareas (verificaciones, merge, tag) y documentación
