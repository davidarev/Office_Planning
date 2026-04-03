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
| ID | Título |
|----|--------|
| OP-171 | Verificación pre-merge |
| OP-172 | Merge develop → main |
| OP-173 | Verificación post-merge |
| OP-174 | Etiquetar baseline |
