# Skill: Update Execution Result

## Objetivo
Actualizar la spec de una tarea con la sección `## Execution Result`
tras completar la implementación y ejecutar las verificaciones.

## Cuándo usarlo
- Después de implementar una tarea y ejecutar verificaciones.
- Antes de ejecutar `finish` en el canvas.
- Cuando se necesite actualizar el Execution Result con nuevas ejecuciones.

## Inputs mínimos
- Spec de la tarea: `.ai/specs/<KEY>-spec.md`
- Resultado de verificaciones (`npm run test`, `npm run build`, `npm run lint`)
- Lista de ficheros creados o modificados
- Herramienta de IA usada y alcance

## Pasos que debe seguir la IA

1. **Recopilar información**
   - Fecha actual (ISO 8601, zona CET)
   - Rama Git actual: `git branch --show-current`
   - Hash del último commit: `git rev-parse --short HEAD`
   - Lista de AC de la spec
   - Resultados de verificaciones ejecutadas

2. **Evaluar estado de cada AC**
   Para cada AC en la spec, determinar: PASS, FAIL o NO VERIFICADO.

3. **Listar ficheros relevantes**
   Obtener ficheros creados/modificados con: `git diff --name-only HEAD~1`

4. **Componer la sección Execution Result**
   Seguir el formato definido en AGENTS.md § 7.3.

5. **Añadir al final de la spec**
   Si ya existe una sección `## Execution Result`, añadir como subapartado con fecha.
   No borrar historial previo.

6. **Añadir/actualizar suite en verify config**
   Actualizar `.ai/verify/config.yaml` con la suite correspondiente a la tarea.

## Output esperado
- Sección `## Execution Result` completa y coherente añadida a la spec
- Suite de verificación añadida/actualizada en `.ai/verify/config.yaml`
- Listo para commit de documentación:
  ```
  docs(<KEY>): añadir execution result y suite de verify
  ```
