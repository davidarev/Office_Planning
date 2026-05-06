# OP-133 — Revisar endpoint de mesas

## Contexto
El endpoint de mesas está implementado en `src/app/api/tables/route.ts`. Expone un único método GET que devuelve todas las mesas activas con su información básica. Fue implementado en las ramas iniciales del proyecto. Esta subtarea forma parte de la auditoría OP-130 y no implica cambios en el código.

## Objetivo
Verificar que el endpoint GET /api/tables aplica correctamente autenticación, devuelve la estructura de respuesta adecuada y no expone datos sensibles ni detalles internos.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### GET /api/tables (`route.ts`)
- Presencia y funcionamiento de `requireSession()` — debe devolver 401 si no hay sesión
- El endpoint no acepta parámetros — verificar que no hay surface de inyección
- Delegación a `getTablesWithBasicInfo()` del servicio — sin lógica de negocio en el handler
- Respuesta 200 con array de mesas activas
- Bloque `catch` genérico: no expone detalles internos, devuelve 500 con mensaje genérico

### Estructura de respuesta
- Verificar qué campos devuelve `getTablesWithBasicInfo()` — ¿se filtran campos innecesarios o sensibles?
- Verificar que no se expone información de usuarios asignados a mesas fijas/preferentes más allá de lo necesario
- Verificar que las mesas bloqueadas o inactivas no aparecen en la respuesta (filtrado en servicio o repositorio)

### Aspectos transversales
- El endpoint es de solo lectura — no modifica estado
- Ausencia de lógica de negocio en el route handler
- Sin parámetros de entrada → sin superficie de validación adicional que revisar

## Casos límite
- Sin mesas activas en BD — respuesta debe ser array vacío `[]`, no error
- Fallo de conexión a MongoDB — bloque `catch` debe capturarlo y devolver 500 genérico

## Criterios de aceptación
- AC-1: Verificar que el endpoint requiere sesión activa y devuelve 401 sin ella
- AC-2: Verificar que la respuesta no expone campos sensibles o innecesarios de las mesas
- AC-3: Verificar que el bloque `catch` no expone detalles internos y devuelve 500 con mensaje genérico
- AC-4: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-136
- Sin modificaciones al código fuente

## Execution Result

**Fecha**: 2026-05-06
**Estado**: DONE

### Resultados por AC

| AC | Estado | Notas |
|----|--------|-------|
| AC-1 | PASS | `requireSession()` presente y funcional. Devuelve 401 con `{ error: "No autorizado" }` sin sesión. |
| AC-2 | PASS con observaciones | Respuesta correcta en general. Detectados dos campos mejorables: `assignedTo` expone ID de usuario (H-133-04) e `isActive` es siempre `true` y por tanto redundante (H-133-05). |
| AC-3 | PASS | Bloque `catch {}` devuelve 500 con mensaje genérico `"Error al obtener las mesas"`. Sin exposición interna. |
| AC-4 | PASS | 6 hallazgos documentados en `.ai/reports/OP-130-findings.md`: 0 bloqueantes, 2 mejoras, 4 observaciones. |

### Hallazgos destacados
- **H-133-04** (Mejora): `TablePublic.assignedTo` expone ID de usuario — evaluar si sustituir por booleano `hasAssignedUser`.
- **H-133-05** (Mejora): `TablePublic.isActive` siempre es `true` en la respuesta — campo redundante a eliminar.

### Suite de verificación
| Check | Estado |
|-------|--------|
| OP-133-STRUCT-1: api/tables/route.ts existe | PASS |
| OP-133-STRUCT-2: lib/api-auth.ts existe | PASS |
| OP-133-STRUCT-3: services/table.service.ts existe | PASS |
| OP-133-STRUCT-4: .ai/reports/OP-130-findings.md existe | PASS |
