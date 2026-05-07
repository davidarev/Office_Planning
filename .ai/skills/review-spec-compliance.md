# Skill: Review spec compliance

## Objetivo
Verificar que el código implementado cumple todos los criterios de aceptación
definidos en la spec de una tarea. Generar un informe de cumplimiento.

## Cuándo usarlo
- Antes de ejecutar `finish` en una tarea.
- Al revisar una PR para validar que cumple la spec.
- Cuando se quiera auditar el estado de una implementación.

## Inputs mínimos
- Spec de la tarea: `.ai/specs/<KEY>-spec.md`
- Diff o ficheros modificados de la implementación
- Resultado de `npm run test` si está disponible

## Pasos que debe seguir la IA

1. **Leer la spec completa**
   Extraer todos los AC (AC-1, AC-2, …) y las restricciones.

2. **Leer el código implementado**
   Revisar los ficheros creados o modificados según la spec.

3. **Evaluar cada AC individualmente**
   Para cada AC:
   - ¿Está implementado? (PASS / FAIL / PARCIAL)
   - ¿Dónde está implementado? (fichero:línea)
   - ¿Hay evidencia de verificación? (test, build, etc.)

4. **Evaluar restricciones**
   - ¿Se ha respetado cada restricción de la spec?
   - ¿Se ha añadido algo fuera del alcance?

5. **Evaluar casos límite**
   - ¿Se contemplan los edge cases definidos en la spec?

6. **Generar informe**

## Output esperado
Informe estructurado en markdown:

```markdown
## Informe de cumplimiento — <KEY>

### Criterios de aceptación
| AC | Estado | Ubicación | Notas |
|----|--------|-----------|-------|
| AC-1 | PASS/FAIL | fichero:línea | ... |

### Restricciones
| Restricción | Cumple | Notas |
|-------------|--------|-------|

### Casos límite
| Caso | Cubierto | Notas |
|------|----------|-------|

### Resultado global
PASS / FAIL — resumen

### Recomendaciones
- ...
```
