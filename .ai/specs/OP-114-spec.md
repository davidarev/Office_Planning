# OP-114 — Revisar tipos de dominio

## Contexto
Los tipos de dominio están en `src/domain/types/`: `user.ts`, `table.ts`, `reservation.ts`, `service.ts` e `index.ts`. También existe `next-auth.d.ts` que extiende los tipos de NextAuth con campos propios. Esta subtarea forma parte de la auditoría OP-110 y no implica cambios en el código.

## Objetivo
Verificar que los tipos de dominio son completos, correctos, coherentes con los schemas Mongoose y seguros (no exponen datos internos innecesarios). Identificar tipos públicos que exponen demasiado, gaps de cobertura o inconsistencias.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-115 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### IUser / UserPublic (`user.ts`)
- `IUser`: `_id: Types.ObjectId` — correcto para Mongoose, pero implica dependencia de la librería en el dominio
- `UserPublic`: omite `createdAt` y `updatedAt` — verificar si es suficiente o faltan campos útiles para admin
- `UserPublic._id: string` — correcto para serialización JSON, pero introduce asimetría con `IUser._id`
- Ausencia de tipo para creación de usuario (CreateUserDTO o similar) — ¿se maneja ad-hoc en la API?

### ITable / TableWithStatus / TableAvailability (`table.ts`)
- `ITable.assignedTo?: Types.ObjectId` — opcional en la interfaz, `null` en el schema → inconsistencia semántica
- `TableWithStatus` vs `TableAvailability` — dos tipos públicos para representaciones similares de mesa enriquecida; verificar si hay duplicidad innecesaria
- `TableAvailability.reservation` incluye `userName` — verificar si siempre se puede garantizar ese campo o puede ser null
- `TablePosition.rotation?: number` vs schema donde `rotation` tiene `default: 0` — la opcionalidad del tipo no coincide con el comportamiento del schema
- Ausencia de tipo para creación/actualización de mesa (CreateTableDTO)

### IReservation / ReservationPublic (`reservation.ts`)
- `ReservationPublic.userName?: string` y `tableLabel?: string` — campos opcionales que enriquecen la respuesta; verificar si la opcionalidad es correcta o debería ser siempre requerida cuando se devuelve al cliente
- `ReservationPublic.date: string` — serializado como string ISO, correcto para JSON; verificar que la conversión es consistente
- Ausencia de tipo para creación de reserva (CreateReservationDTO)

### ServiceResult (`service.ts`)
- `ServiceErrorCode`: `"validation" | "not_found" | "forbidden" | "conflict"` — verificar cobertura de casos de error del sistema
- `ServiceResult<T>`: discriminated union — patrón correcto; verificar que se usa consistentemente en todos los servicios
- Ausencia de `ServiceErrorCode` para errores de concurrencia (podría cubrirse con `"conflict"`)

### next-auth.d.ts
- Extiende `Session.user` con `id`, `name`, `email`, `role`, `image?`
- Verificar si falta extender el tipo `User` de NextAuth (además de `Session`)
- Verificar que `role: UserRole` no es `string` genérico — el tipo importado garantiza la restricción
- Verificar si `isActive` debería estar en la sesión para bloquear acceso sin re-consultar BD

### index.ts
- Verificar que re-exporta todos los tipos necesarios de forma centralizada
- Verificar que no hay exports innecesarios o duplicados

## Casos límite
- `UserPublic` con `isActive: boolean` — permite saber si un usuario está activo; evaluar si es información sensible para exponer al cliente
- `TableAvailability` sin `isActive` explícito — la lógica de status (`gray`) lo absorbe, pero el campo no es visible
- `ReservationPublic` con `userId: string` — expone el ID del usuario propietario a todos los clientes que ven disponibilidad

## Criterios de aceptación
- AC-1: Verificar coherencia entre tipos de dominio y schemas Mongoose (campos, opcionalidad, tipos)
- AC-2: Verificar que los tipos públicos no exponen más información de la necesaria
- AC-3: Verificar que `ServiceResult<T>` se usa de forma consistente y los códigos de error cubren todos los casos
- AC-4: Verificar que `next-auth.d.ts` extiende correctamente los tipos de sesión con los campos necesarios
- AC-5: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-115
- Sin modificaciones al código fuente

---

## Execution Result

- **Fecha**: 2026-04-07
- **Rama**: develop
- **Commit**: 8899caf
- **AI-assisted**: sí (Claude Sonnet 4.6)

### Estado de criterios de aceptación

| AC | Estado | Notas |
|----|--------|-------|
| AC-1 | PASS con hallazgos | Tipos coherentes con schemas. Confirmadas inconsistencias `assignedTo` (null/undefined) y `rotation` (opcional/default) ya registradas en OP-112. |
| AC-2 | PASS con hallazgos | `TableAvailability.reservation.userId` expone el ID del propietario a todos los usuarios (H-114-1, Mejora). `UserPublic.isActive` expone estado interno (H-114-4, Observación). |
| AC-3 | PASS | `ServiceResult<T>` usado consistentemente en `reservation.service.ts`. `HTTP_STATUS: Record<ServiceErrorCode, number>` garantiza exhaustividad. Los 4 códigos cubren todos los casos actuales. |
| AC-4 | PASS con hallazgo | `next-auth.d.ts` solo extiende `Session`, no `User` de NextAuth (H-114-2, Mejora). `isActive` ausente en sesión (H-114-3, Observación). |
| AC-5 | PASS | 6 hallazgos documentados con severidad en `.ai/reports/OP-110-findings.md`. |

### Hallazgos registrados

| ID | Severidad | Descripción |
|----|-----------|-------------|
| H-114-1 | Mejora | `TableAvailability.reservation.userId` expone ID del propietario a todos los usuarios autenticados |
| H-114-2 | Mejora | `next-auth.d.ts` no extiende el tipo `User` de NextAuth — tipado incompleto en callbacks de auth |
| H-114-3 | Observación | `isActive` ausente en sesión — verificación de usuario activo requiere consulta BD por request |
| H-114-4 | Observación | `UserPublic.isActive` expone estado de activación al propio usuario |
| H-114-5 | Observación | Ausencia de tipos DTO para creación/actualización de entidades — validación ad-hoc en rutas |
| H-114-6 | Observación | `TableWithStatus` declarado y re-exportado pero sin uso activo en ningún servicio o ruta |

### Ficheros revisados
- `src/domain/types/user.ts` (solo lectura)
- `src/domain/types/table.ts` (solo lectura)
- `src/domain/types/reservation.ts` (solo lectura)
- `src/domain/types/service.ts` (solo lectura)
- `src/domain/types/index.ts` (solo lectura)
- `src/domain/types/next-auth.d.ts` (solo lectura)
- `src/services/availability.service.ts` (solo lectura)
- `src/app/api/reservations/route.ts` (solo lectura)
- `src/app/api/reservations/[id]/route.ts` (solo lectura)

### Verify
- lint: FAIL preexistente (`.obsidian/` no ignorado, no relacionado con OP-114)
- test:unit: PASS (69 tests)
- test:integration: PASS (80 tests)
- test:api: PASS (73 tests)
- Sin modificaciones al código fuente
