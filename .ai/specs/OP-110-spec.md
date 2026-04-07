# OP-110 — Auditoría de modelos y tipos de dominio

## Contexto
El proyecto tiene modelos Mongoose (User, Table, Reservation) en `src/lib/models/` y tipos TypeScript en `src/domain/types/`. Fueron implementados en la rama `03-data-model-and-layer-access`. Necesitan validación contra README.md y AGENTS.md antes de construir sobre ellos.

## Objetivo
Revisar exhaustivamente los schemas Mongoose, tipos TypeScript, índices y coherencia con las reglas funcionales de README.md. Identificar inconsistencias, gaps y mejoras necesarias.

## Restricciones
- No modificar código en esta historia — solo auditar y documentar hallazgos
- No introducir cambios funcionales
- Los hallazgos se aplican en OP-160

## Casos límite
- Campos opcionales que deberían ser obligatorios o viceversa
- Índices únicos parciales que no cubren todos los escenarios de concurrencia
- Tipos públicos que exponen datos internos que no deberían ser visibles
- Enums que no coinciden con los tipos funcionales definidos en README.md §6

## Criterios de aceptación
- AC-1: Schema User revisado — campos, validaciones, índice unique en email, enum de roles verificados contra README.md §3
- AC-2: Schema Table revisado — campos (label, type, position, assignedTo, isActive), enum de tipos, índice verificados contra README.md §6
- AC-3: Schema Reservation revisado — campos, status enum, índices únicos parciales ({tableId,date} y {userId,date} con status=confirmed) verificados contra README.md §8
- AC-4: Tipos de dominio revisados — IUser, ITable, IReservation, tipos públicos (UserPublic, TableAvailability, ReservationPublic), ServiceResult y next-auth.d.ts verificados
- AC-5: Informe de hallazgos documentado con lista de inconsistencias, mejoras necesarias y decisiones propuestas

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-111 | Revisar schema User |
| OP-112 | Revisar schema Table |
| OP-113 | Revisar schema Reservation |
| OP-114 | Revisar tipos de dominio |
| OP-115 | Documentar hallazgos OP-110 |

---

## Execution Result

- **Fecha**: 2026-04-07
- **Rama**: develop
- **Commit**: 2bcac57
- **AI-assisted**: sí (Claude Sonnet 4.6)
- **Informe**: [`.ai/reports/OP-110-findings.md`](.ai/reports/OP-110-findings.md)

### Estado de criterios de aceptación

| AC | Estado | Notas |
|----|--------|-------|
| AC-1 | PASS | Schema User auditado (OP-111) — 6 hallazgos, ninguno bloqueante |
| AC-2 | PASS | Schema Table auditado (OP-112) — 7 hallazgos, 2 mejoras relevantes |
| AC-3 | PASS | Schema Reservation auditado (OP-113) — 4 hallazgos, índices únicos parciales correctos |
| AC-4 | PASS | Tipos de dominio auditados (OP-114) — 6 hallazgos, exposición de userId detectada |
| AC-5 | PASS | 23 hallazgos consolidados con severidad, priorización y acciones propuestas para OP-160 |

### Resumen de hallazgos
- **Bloqueantes**: 0
- **Mejoras**: 5 (H-112-1, H-113-1, H-114-1, H-114-2, H-111-2, H-112-3)
- **Observaciones**: 17
- **Prioridad máxima para OP-160**: H-112-1 (null/undefined assignedTo), H-113-1 (normalización de fecha en schema), H-114-1 (userId en disponibilidad pública)

### Verify
- test:unit: PASS (69 tests)
- test:integration: PASS (80 tests)
- test:api: PASS (73 tests)
- lint: FAIL preexistente (`.obsidian/` no ignorado, no introducido por OP-110)
