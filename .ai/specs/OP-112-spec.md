# OP-112 — Revisar schema Table

## Contexto
El schema Mongoose `Table` está definido en `src/lib/models/table.model.ts` y se basa en la interfaz `ITable` de `src/domain/types/table.ts`. Incluye un sub-schema `PositionSchema` para la posición en el plano. Esta subtarea forma parte de la auditoría OP-110 y no implica cambios en el código.

## Objetivo
Verificar que `TableSchema` (y su sub-schema `PositionSchema`) es correcto, completo y coherente con las reglas funcionales de `README.md §6` (tipos de mesa, asignación, disponibilidad). Identificar inconsistencias, campos faltantes o índices insuficientes.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-115 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Campos del schema principal
- `label`: required, trim — verificar si hay restricción de unicidad (¿puede haber dos mesas con el mismo label?)
- `type`: enum `["flexible", "fixed", "preferential", "blocked"]`, default `"flexible"` — verificar coherencia con `TableType`
- `position`: required, subdocumento — verificar que el sub-schema cubre todos los campos de `TablePosition`
- `assignedTo`: ObjectId ref `"User"`, default `null` — verificar si la semántica de `null` vs `undefined` es consistente con `ITable` donde es `assignedTo?: Types.ObjectId`
- `isActive`: Boolean, default `true` — verificar si es suficiente

### Sub-schema PositionSchema
- Campos: `x`, `y`, `width`, `height` (required) + `rotation` (default 0)
- Verificar coherencia con `TablePosition` donde `rotation` es opcional (`rotation?: number`)
- `_id: false` — correcto para subdocumentos sin identidad propia

### Índices
- `{ isActive: 1 }` — índice explícito para consultas de mesas activas
- Ausencia de índice en `label` — evaluar si debería ser único o al menos indexado
- Ausencia de índice en `type` — evaluar según patrones de consulta
- Ausencia de índice en `assignedTo` — evaluar para consultas de mesas asignadas a un usuario

### Timestamps
- `timestamps: true` — verificar coherencia con `ITable` que declara `createdAt` y `updatedAt`

### Coherencia con tipos
- Verificar que todos los campos de `ITable` tienen correspondencia en el schema
- Verificar el tratamiento de `assignedTo`: `null` en schema vs `undefined` opcional en interfaz

## Casos límite
- Mesa `fixed` o `preferential` sin `assignedTo` — ¿debería ser inválida? El schema no lo valida
- Mesa `blocked` que aparece en queries de disponibilidad — ¿se filtra correctamente por el servicio?
- `label` duplicado — ¿el sistema permite dos mesas con el mismo nombre?
- `position` con coordenadas negativas o fuera de rango — no hay validación de rango en el schema

## Criterios de aceptación
- AC-1: Verificar que todos los campos de `ITable` y `TablePosition` están presentes en los schemas correspondientes
- AC-2: Verificar coherencia entre `type` enum y `TableType`
- AC-3: Verificar la semántica de `assignedTo` (null vs undefined) entre schema y tipos
- AC-4: Evaluar si los índices existentes cubren los patrones de acceso principales
- AC-5: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-115
- Sin modificaciones al código fuente

---

## Execution Result

- **Fecha**: 2026-04-07
- **Rama**: develop
- **Commit**: fa095b9
- **AI-assisted**: sí (Claude Sonnet 4.6)

### Estado de criterios de aceptación

| AC | Estado | Notas |
|----|--------|-------|
| AC-1 | PASS | Todos los campos de `ITable` y `TablePosition` tienen correspondencia en `TableSchema` y `PositionSchema`. `_id` lo genera Mongoose implícitamente. `createdAt`/`updatedAt` via `timestamps: true`. |
| AC-2 | PASS | El enum `["flexible", "fixed", "preferential", "blocked"]` es exactamente coherente con `TableType`. |
| AC-3 | PASS (con hallazgo) | `assignedTo` tiene `default: null` en el schema pero `ITable` lo declara como `assignedTo?: Types.ObjectId`. Mongo siempre devuelve `null`, nunca `undefined`. Registrado como H-112-1 (Mejora). |
| AC-4 | PASS (con hallazgos) | Solo existe índice en `isActive`. Ausencia de índices en `label`, `type` y `assignedTo` documentada como H-112-3, H-112-4 y H-112-5. |
| AC-5 | PASS | 7 hallazgos documentados con severidad en `.ai/reports/OP-110-findings.md`. |

### Hallazgos registrados

| ID | Severidad | Descripción |
|----|-----------|-------------|
| H-112-1 | Mejora | `assignedTo: null` (schema) vs `assignedTo?: Types.ObjectId` (interfaz) — discrepancia null/undefined |
| H-112-2 | Observación | `rotation` siempre persiste como `0` en Mongo pero el tipo lo declara opcional |
| H-112-3 | Mejora | `label` sin unicidad — dos mesas con el mismo nombre son posibles |
| H-112-4 | Observación | Sin índice en `type` — queries de disponibilidad podrían beneficiarse de índice compuesto |
| H-112-5 | Observación | Sin índice en `assignedTo` — queries de mesas asignadas a un usuario sin soporte de índice |
| H-112-6 | Observación | `fixed`/`preferential` sin `assignedTo` no es validado por el schema |
| H-112-7 | Observación | Coordenadas sin validación de rango — valores negativos son aceptados |

### Ficheros revisados
- `src/lib/models/table.model.ts` (solo lectura)
- `src/domain/types/table.ts` (solo lectura)
- `README.md §6` (referencia funcional)

### Verify
- lint: FAIL preexistente (`.obsidian/` no ignorado, no relacionado con OP-112)
- test:unit: PASS (69 tests)
- test:integration: PASS (80 tests)
- test:api: PASS (73 tests)
- Sin modificaciones al código fuente
