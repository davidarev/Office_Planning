Completar una tarea del canvas.

Antes de ejecutar finish, verificar el checklist de cierre (AGENTS.md § 9):

1. **Verificar implementación**:
   - Ejecutar `npm run lint`
   - Ejecutar `npm run test`
   - Ejecutar `npm run build`

2. **Actualizar spec con Execution Result**:
   - Leer `.ai/specs/$ARGUMENTS-spec.md` (o buscar spec correspondiente)
   - Añadir sección `## Execution Result` con formato de AGENTS.md § 7.3
   - Incluir: fecha, rama, commit, estado de AC, ficheros, verify, AI-assisted

3. **Añadir suite de verificación**:
   - Actualizar `.ai/verify/config.yaml` con la suite de la tarea

4. **Commit de documentación**:
   ```
   docs($ARGUMENTS): añadir execution result y suite de verify
   ```

5. **Ejecutar finish**:
   ```
   python3 canvas-tool.py office_planning.canvas finish $ARGUMENTS
   ```

6. Mostrar resumen del cierre: AC cumplidos, verify result, tareas desbloqueadas.
