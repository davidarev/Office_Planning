# Skill: Implementar feature desde spec

## Objetivo
Implementar una subtarea/feature siguiendo estrictamente su spec técnica,
cumpliendo todos los criterios de aceptación y respetando las convenciones
del proyecto.

## Cuándo usarlo
- Al iniciar la implementación de una subtarea con spec lista.
- Cuando la tarea está en estado Blocked (rojo) en el canvas y sus dependencias están resueltas.

## Inputs mínimos
- `AGENTS.md` como contexto global del proyecto
- Spec de la tarea: `.ai/specs/<KEY>-spec.md`
- Canvas file: `office_planning.canvas` (para verificar estado)
- Código existente relevante según la spec

## Pasos que debe seguir la IA

1. **Verificar estado en canvas**
   ```bash
   python3 canvas-tool.py office_planning.canvas status <KEY>
   ```
   Confirmar que la tarea puede iniciar (dependencias resueltas).

2. **Ejecutar start**
   ```bash
   python3 canvas-tool.py office_planning.canvas start <KEY>
   ```

3. **Leer la spec completa**
   Leer `.ai/specs/<KEY>-spec.md`. Entender contexto, objetivo, restricciones y AC.

4. **Implementar AC por AC**
   - Seguir el orden de los AC cuando sea posible.
   - Trazar cada bloque de código contra AC concretos.
   - Respetar arquitectura por capas (dominio → servicio → repositorio → API → UI).
   - No inventar requisitos fuera de la spec.

5. **Ejecutar verificaciones**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

6. **Actualizar spec con Execution Result**
   Usar skill `update-execution-result` o añadir manualmente la sección `## Execution Result`.

7. **Commit**
   ```bash
   git add <ficheros relevantes>
   git commit -m "feat(<KEY>): descripción del cambio"
   ```

8. **Commit de documentación**
   ```bash
   git add .ai/specs/<KEY>-spec.md .ai/verify/config.yaml
   git commit -m "docs(<KEY>): añadir execution result y suite de verify"
   ```

9. **Ejecutar finish**
   ```bash
   python3 canvas-tool.py office_planning.canvas finish <KEY>
   ```

## Output esperado
- Código implementado y commiteado
- Spec actualizada con `## Execution Result`
- Suite de verificación añadida a `.ai/verify/config.yaml`
- Tarea movida a Review (cyan) en el canvas
