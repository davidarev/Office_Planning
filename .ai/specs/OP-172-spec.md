# OP-172 — Merge develop → main

## Contexto

Con la verificación pre-merge completada (OP-171 en PASS), esta subtarea realiza el merge formal de `develop` a `main`. La rama `main` está en el commit inicial del proyecto; no hay historial divergente significativo, pero el proceso debe ser controlado: sin force push, sin reescritura de historia, y con resolución explícita de cualquier conflicto.

El merge se hace desde la rama de historia `feature/OP-170-merge-develop-main-baseline`, que fue creada desde `develop`.

## Objetivo

- Cambiar a `main`, incorporar todos los commits de `develop` mediante `git merge --no-ff`
- Resolver conflictos si los hubiera, conservando siempre el código auditado de `develop`
- Confirmar que el merge commit queda registrado correctamente en el historial
- No alterar el historial existente de ninguna de las dos ramas

## Restricciones

- **Sin force push** — nunca `git push --force` ni `git push --force-with-lease` a `main`
- **Sin reescritura de historia** — no usar `git rebase` sobre commits ya publicados
- **Merge commit obligatorio** — usar `--no-ff` para preservar la trazabilidad del punto de merge
- Solo ejecutar si OP-171 está en PASS
- En caso de conflicto, conservar la versión de `develop` (el código auditado) salvo que el conflicto indique claramente que `main` tiene algo válido (situación altamente improbable dado que `main` está en el commit inicial)
- El mensaje del merge commit debe seguir la convención del proyecto

## Pasos de ejecución

1. Verificar que OP-171 está en estado PASS antes de continuar
2. `git checkout main` — cambiar a la rama destino
3. `git fetch origin` — sincronizar con remoto
4. `git merge --no-ff develop -m "merge(OP-172): fusionar develop → main — baseline v0.1.0"` — merge con commit explícito
5. Si hay conflictos: resolverlos conservando el código de `develop`, marcar como resueltos y continuar el merge
6. `git push origin main` — publicar el merge en remoto
7. Verificar el historial con `git log --oneline -10` para confirmar que el merge commit es visible

## Casos límite

- **Conflicto en `package-lock.json`**: regenerar con `npm install` tras el merge y commitar el resultado.
- **Conflicto en ficheros de configuración** (`.env.example`, `next.config.ts`, `tsconfig.json`): revisar manualmente; conservar la versión de `develop` como punto de partida y ajustar si procede.
- **main tiene commits desconocidos**: si `git log main` muestra commits inesperados más allá del commit inicial, detener y consultar antes de continuar.
- **Push rechazado**: si el remoto rechaza el push por divergencia, NO usar force push — investigar la causa e informar.

## Criterios de aceptación

- AC-1: OP-171 está en PASS antes del merge
- AC-2: `git log main --oneline` muestra el merge commit de `develop` como HEAD
- AC-3: No se ha usado `git push --force` ni reescritura de historia
- AC-4: Todos los commits de `develop` están presentes en `main` tras el merge
- AC-5: El merge commit tiene mensaje en formato convención del proyecto

## Criterio de done

- Todos los AC en PASS
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 20:20 (CET)
- Rama: feature/OP-170-merge-develop-main-baseline → merge commit en `main`
- Commit merge: 8e9546e
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – OP-171 completada y en cyan antes del merge
  - AC-2: PASS – `git log main --oneline` muestra `8e9546e merge(OP-172): fusionar develop → main — baseline v0.1.0` como HEAD
  - AC-3: PASS – merge con `--no-ff`, sin force push ni reescritura de historia
  - AC-4: PASS – 65 commits de develop incorporados en main sin conflictos (153 ficheros, 24928 inserciones)
  - AC-5: PASS – mensaje de merge commit en formato convención del proyecto: `merge(OP-172): fusionar develop → main — baseline v0.1.0`
- verify:
  - Estrategia de merge: `ort` (sin conflictos)
  - Push: `a07f620..8e9546e main -> main` — aceptado sin rechazo
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: ejecución del merge y documentación del Execution Result
- Decisiones técnicas:
  - No hubo conflictos: `main` estaba en el commit inicial (`a07f620`), `develop` no tenía historial divergente, merge limpio con estrategia `ort`
  - El merge incorpora también los 2 commits de specs/canvas de la rama de historia (OP-171–174), ya que fue creada desde `develop` — esto es correcto y esperado
