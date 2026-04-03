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
