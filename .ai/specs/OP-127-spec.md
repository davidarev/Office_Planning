# OP-127 — Documentar hallazgos OP-120

## Contexto
Esta subtarea es la de cierre de la auditoría OP-120. Consolida todos los hallazgos encontrados en OP-121, OP-122, OP-123, OP-124, OP-125 y OP-126 en un informe estructurado. Es equivalente a OP-115 para la auditoría de modelos (OP-110). Los hallazgos documentados aquí serán la entrada para OP-162 (correcciones de repositorios y servicios).

## Objetivo
Registrar de forma estructurada todos los hallazgos de la auditoría de repositorios y servicios. Clasificar por severidad, indicar el fichero afectado y proporcionar suficiente contexto para que OP-162 pueda aplicar las correcciones sin necesidad de releer el código desde cero.

## Restricciones
- Solo documentar — no modificar código
- Esta tarea no tiene valor por sí sola: su valor es habilitar OP-162
- Los hallazgos deben ser concisos y accionables

## Formato del informe

El informe se crea en `.ai/reports/OP-120-findings.md` con la siguiente estructura:

```markdown
# OP-120 — Informe de hallazgos: repositorios y servicios

## Resumen ejecutivo
Breve descripción del estado general de la capa de repositorios y servicios.

## Hallazgos por fichero

### reservation.repository.ts
| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-121-N | Bloqueante/Mejora/Observación | Descripción del hallazgo | Qué hacer en OP-162 |

### table.repository.ts / user.repository.ts
...

### reservation.service.ts
...

### availability.service.ts
...

### table.service.ts
...

### Documentación JSDoc
...

## Hallazgos bloqueantes
Lista de hallazgos críticos que requieren corrección antes de continuar.

## Mejoras recomendadas
Lista de mejoras no bloqueantes ordenadas por impacto.

## Observaciones
Aspectos a tener en cuenta en fases futuras sin requerir acción inmediata.
```

## Escala de severidad
- **Bloqueante**: Defecto que puede causar comportamiento incorrecto, pérdida de datos o vulnerabilidad de seguridad. Debe corregirse en OP-162.
- **Mejora**: Código funcionalmente correcto pero mejorable en claridad, mantenibilidad o robustez. Se corrige en OP-162 si el esfuerzo es bajo.
- **Observación**: Decisión de diseño cuestionable o deuda técnica a considerar en fases futuras. No requiere acción inmediata.

## Puntos a consolidar (por subtarea)
- **OP-121**: Hallazgos de `reservation.repository.ts` (queries, lean, E11000, connectDB)
- **OP-122**: Hallazgos de `table.repository.ts` y `user.repository.ts` (completitud, filtros, normalización doble)
- **OP-123**: Hallazgos de `reservation.service.ts` (orden validaciones, concurrencia, serialización, helpers)
- **OP-124**: Hallazgos de `availability.service.ts` (prioridades de estado, N+1, rango de fechas, casos límite)
- **OP-125**: Hallazgos de `table.service.ts` (TablePublic, ubicación del tipo, completitud)
- **OP-126**: Hallazgos de documentación JSDoc en todos los ficheros

## Casos límite
- Hallazgos que se solapan entre ficheros (ej. una inconsistencia de tipos afecta tanto al repositorio como al servicio) — deben documentarse en el fichero más relevante con referencia cruzada
- Observaciones que aplican a toda la capa (ej. ausencia de operaciones de escritura en repositorios) — documentar en sección de observaciones transversales

## Criterios de aceptación
- AC-1: El informe `.ai/reports/OP-120-findings.md` existe y está estructurado según el formato definido
- AC-2: Todos los hallazgos de OP-121 a OP-126 están recogidos en el informe
- AC-3: Cada hallazgo tiene ID único, severidad, descripción y acción sugerida
- AC-4: El resumen ejecutivo refleja el estado real de la capa auditada
- AC-5: Los hallazgos bloqueantes (si los hay) están claramente identificados para OP-162

## Criterio de done
- Todos los AC en PASS
- `.ai/reports/OP-120-findings.md` creado y actualizado
- Sin modificaciones al código fuente

## Execution Result

**Fecha**: 2026-04-07
**Estado**: DONE

### Suite de verificación

| Check | ID | Resultado | Nota |
|-------|----|-----------|------|
| Informe OP-120-findings.md existe | OP-127-STRUCT-1 | PASS | `.ai/reports/OP-120-findings.md` presente |
| Spec OP-127 existe | OP-127-STRUCT-2 | PASS | `.ai/specs/OP-127-spec.md` presente |
| Cobertura H-121 | OP-127-AC-2a | PASS | 5 hallazgos registrados |
| Cobertura H-122 | OP-127-AC-2b | PASS | 6 hallazgos registrados |
| Cobertura H-123 | OP-127-AC-2c | PASS | 5 hallazgos registrados |
| Cobertura H-124 | OP-127-AC-2d | PASS | 5 hallazgos registrados |
| Cobertura H-125 | OP-127-AC-2e | PASS | 5 hallazgos registrados |
| Cobertura H-126 | OP-127-AC-2f | PASS | 7 hallazgos registrados |
| IDs únicos | OP-127-AC-3 | PASS | Sin duplicados |
| Resumen ejecutivo presente | OP-127-AC-4 | PASS | Sección presente y completa |
| Sección bloqueantes presente | OP-127-AC-5 | PASS | "Ninguno" — sin hallazgos bloqueantes |
| Sin modificaciones en src/ | OP-127-DONE | PASS | 0 ficheros modificados en src/ |

### Resumen

**33 hallazgos** documentados (5 Mejora, 28 Observación) en 6 ficheros auditados. Sin hallazgos bloqueantes.

Nota: H-125-5 incluye corrección al hallazgo original — `listActiveTables()` ya aplica `.sort({ label: 1 })`, por lo que el JSDoc era correcto y el hallazgo estaba desactualizado. Se documenta la verificación en el informe.
