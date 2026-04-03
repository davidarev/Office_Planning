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
