# OP-174 — Etiquetar baseline

## Contexto

Con `main` verificado en verde (OP-173 en PASS), el código auditado y consolidado de la Fase 1 queda estabilizado en la rama de producción. Esta subtarea crea el tag de versión `v0.1.0` que marca formalmente la baseline del proyecto: el primer estado auditado, con tests en verde y build correcto.

Este tag es el punto de referencia para todo el desarrollo futuro. Permite identificar de forma inequívoca qué código corresponde a la Fase 1 completa y facilita comparaciones, rollbacks y referencias en PRs futuras.

## Objetivo

- Crear el tag anotado `v0.1.0` sobre el merge commit en `main`
- Publicar el tag en el remoto (`git push origin v0.1.0`)
- Documentar el hash del commit etiquetado en el Execution Result
- Verificar que el tag es visible en el historial y en el repositorio remoto

## Restricciones

- El tag debe crearse sobre el HEAD de `main` tras el merge (el merge commit de OP-172)
- Usar tag **anotado** (`git tag -a`) — no un tag ligero — para incluir metadata (autor, fecha, mensaje)
- El mensaje del tag debe describir brevemente qué representa `v0.1.0`
- No etiquetar si OP-173 no está en PASS
- No reutilizar ni mover el tag una vez publicado en remoto

## Mensaje del tag

```
v0.1.0 — Baseline Fase 1

Primer estado auditado del proyecto Office Desk Booking.
Incluye: modelos, repositorios, servicios, API routes, autenticación
y suite de tests en verde (249 tests).

Historia completada: OP-100 (OP-110 a OP-166).
```

## Pasos de ejecución

1. Verificar que OP-173 está en PASS y que `main` es el branch activo
2. Confirmar el hash del HEAD con `git log --oneline -1`
3. Crear el tag anotado:
   ```bash
   git tag -a v0.1.0 -m "v0.1.0 — Baseline Fase 1

   Primer estado auditado del proyecto Office Desk Booking.
   Incluye: modelos, repositorios, servicios, API routes, autenticación
   y suite de tests en verde (249 tests).

   Historia completada: OP-100 (OP-110 a OP-166)."
   ```
4. Publicar el tag: `git push origin v0.1.0`
5. Verificar: `git tag -l` debe mostrar `v0.1.0`; `git show v0.1.0` debe mostrar los metadatos del tag

## Casos límite

- **Tag ya existe localmente**: si por algún motivo el tag `v0.1.0` existe de una ejecución anterior fallida, eliminarlo con `git tag -d v0.1.0` antes de recrearlo (solo si aún no está publicado en remoto).
- **Tag ya publicado en remoto**: si el tag ya está en remoto, **no** usar `git push --force` sobre tags — contactar al equipo para gestión manual.
- **HEAD de `main` no es el merge commit de OP-172**: verificar `git log main --oneline -3` antes de etiquetar. Si hay commits posteriores no contemplados, documentarlos en el Execution Result.

## Criterios de aceptación

- AC-1: OP-173 está en PASS antes de crear el tag
- AC-2: Tag anotado `v0.1.0` creado sobre el merge commit de `main`
- AC-3: `git show v0.1.0` muestra el mensaje del tag y el commit asociado
- AC-4: Tag publicado en remoto — `git ls-remote --tags origin` muestra `refs/tags/v0.1.0`
- AC-5: `git log main --oneline` muestra el tag `v0.1.0` asociado al merge commit

## Criterio de done

- Todos los AC en PASS
- Spec actualizada con `## Execution Result`
