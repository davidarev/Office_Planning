# OP-130 — Auditoría de API routes y seguridad

## Contexto
El proyecto tiene 7 API routes protegidos por sesión en `src/app/api/` y un middleware (`src/proxy.ts`) para control de acceso a rutas. Fueron implementados en las ramas 03 y 04. La auditoría de servicios (OP-120) debe completarse primero.

## Objetivo
Revisar todos los endpoints API y el middleware para verificar validación de entrada, autorización, respuestas HTTP correctas, manejo de errores seguro, y que no se expongan datos internos.

## Restricciones
- No modificar código — solo auditar y documentar
- Los hallazgos se aplican en OP-160
- Depende de OP-120 completada

## Casos límite
- Endpoints que aceptan parámetros sin validar (fechas malformadas, IDs inválidos)
- Respuestas de error que filtran stack traces o detalles de MongoDB
- Rutas admin accesibles sin verificación de rol en servidor
- Middleware que permite bypass en rutas edge

## Criterios de aceptación
- AC-1: Endpoints de reservas revisados — GET/POST /api/reservations, DELETE /api/reservations/[id], GET /api/reservations/week: validación, auth, respuestas HTTP verificados
- AC-2: Endpoints de disponibilidad revisados — GET /api/availability y GET /api/availability/week: validación de fechas, límites de rango verificados
- AC-3: Endpoint de mesas revisado — GET /api/tables: respuesta, filtrado, estructura verificados
- AC-4: proxy.ts (middleware) revisado — reglas de redirección para rutas públicas, privadas, admin y usuarios autenticados verificadas
- AC-5: Verificado que ningún endpoint expone datos internos (stack traces, detalles de infraestructura, IDs internos sensibles) en respuestas de error
- AC-6: Informe de hallazgos documentado

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-131 | Revisar endpoints de reservas |
| OP-132 | Revisar endpoints de disponibilidad |
| OP-133 | Revisar endpoint de mesas |
| OP-134 | Revisar proxy.ts (middleware) |
| OP-135 | Verificar que no se exponen datos internos en errores |
| OP-136 | Documentar hallazgos OP-130 |

## Execution Result

**Fecha**: 2026-05-06
**Rama**: feature/OP-130-auditoria-api-routes-seguridad
**Commits**: ec83e97 → 584c3d6
**Estado**: DONE

### Resultados por AC

| AC | Estado | Subtarea | Notas |
|----|--------|----------|-------|
| AC-1 | PASS | OP-131 | GET/POST /api/reservations, DELETE /api/reservations/[id], GET /api/reservations/week auditados. 2 hallazgos (1 mejora, 1 observación). |
| AC-2 | PASS | OP-132 | GET /api/availability y GET /api/availability/week auditados. 13 hallazgos (2 mejoras, 11 observaciones). |
| AC-3 | PASS | OP-133 | GET /api/tables auditado. 6 hallazgos (2 mejoras, 4 observaciones). |
| AC-4 | PASS | OP-134 | proxy.ts auditado. 7 hallazgos (0 mejoras, 7 observaciones). Componente más robusto. |
| AC-5 | PASS | OP-135 | Auditoría transversal de catch, mensajes y logging. 6 hallazgos (1 mejora, 5 observaciones). 0 bloqueantes. |
| AC-6 | PASS | OP-136 | Informe consolidado en `.ai/reports/OP-130-findings.md`. 27 hallazgos totales. |

### Resumen de hallazgos

| Severidad | Total |
|-----------|-------|
| Bloqueante | 0 |
| Mejora | 6 |
| Observación | 21 |
| **Total** | **27** |

### Mejoras para OP-161 (por prioridad)
1. **H-131-1**: POST /api/reservations — añadir `isValidDateString` en validación de `date`
2. **H-133-04**: `TablePublic.assignedTo` expone ID de usuario — evaluar `hasAssignedUser: boolean`
3. **H-133-05**: `TablePublic.isActive` siempre `true` — campo redundante, eliminar
4. **H-132-10**: `MAX_RANGE_DAYS` duplicado en dos ficheros — extraer a constante compartida
5. **H-132-09**: Inconsistencia semántica `MAX_RANGE_DAYS = 14` permite 15 días inclusivos
6. **H-135-05**: `getDuplicateKeyMessage` discrimina por texto — evaluar `keyPattern`

### Ficheros auditados (sin modificaciones al código)
- `src/app/api/reservations/route.ts`
- `src/app/api/reservations/[id]/route.ts`
- `src/app/api/reservations/week/route.ts`
- `src/app/api/availability/route.ts`
- `src/app/api/availability/week/route.ts`
- `src/app/api/tables/route.ts`
- `src/proxy.ts`
- `src/lib/api-auth.ts`
- `src/lib/auth.ts`
- `src/services/reservation.service.ts`
- `src/services/table.service.ts`
- `src/domain/types/service.ts`

### AI-assisted
- Herramienta: Claude Code claude-sonnet-4-6
- Alcance: auditoría de 7 route handlers y middleware, análisis de seguridad (autenticación, autorización, validación, manejo de errores, exposición de datos), redacción del informe consolidado
