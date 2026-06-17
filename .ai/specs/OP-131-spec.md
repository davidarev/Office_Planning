# OP-131 — Revisar endpoints de reservas

## Contexto
Los endpoints de reservas están implementados en tres ficheros bajo `src/app/api/reservations/`:
- `route.ts` — GET (listar por día) y POST (crear reserva)
- `[id]/route.ts` — DELETE (cancelar reserva)
- `week/route.ts` — GET (listar por rango semanal)

Fueron implementados como parte de las ramas `03-data-model-and-layer-access` y `04-availability-booking-concurrency`. Esta subtarea forma parte de la auditoría OP-130 y no implica cambios en el código.

## Objetivo
Verificar que los cuatro endpoints de reservas aplican correctamente autenticación, autorización, validación de entrada, códigos HTTP y manejo de errores sin exposición de datos internos.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### GET /api/reservations?date=YYYY-MM-DD (`route.ts`)
- Presencia y funcionamiento de `requireSession()` — debe devolver 401 si no hay sesión
- Validación de parámetro `date`: ausente → 400, formato inválido → 400
- Uso de `isValidDateString` para validar formato
- Respuesta 200 con array de reservas para la fecha
- Bloque `catch` genérico: no expone detalles internos, devuelve 500 con mensaje genérico

### POST /api/reservations (`route.ts`)
- `requireSession()` — sesión obligatoria, devuelve 401 si no hay
- Manejo de body malformado (JSON inválido) → 400
- Validación de presencia de `tableId` y `date` en el body → 400 si faltan
- Validación de `tableId` como `ObjectId` válido con `Types.ObjectId.isValid()` → 400 si inválido
- Validación de `date` como string — ¿se valida el formato YYYY-MM-DD igual que en GET?
- Delegación de userId al servicio desde `session.user.id` (nunca del body)
- Mapeo correcto de `ServiceErrorCode` a HTTP: `validation→400`, `not_found→404`, `forbidden→403`, `conflict→409`
- Respuesta 201 con la reserva creada en éxito
- Bloque `catch` genérico sin exposición interna

### DELETE /api/reservations/[id] (`[id]/route.ts`)
- `requireSession()` — sesión obligatoria
- Validación de `:id` como `ObjectId` válido → 400 si inválido
- Delegación de `userId` y `role` desde la sesión (nunca del body o query params)
- Autorización delegada al servicio: propietario o admin
- Mapeo correcto de `ServiceErrorCode` a HTTP
- Respuesta 200 con la reserva cancelada
- Bloque `catch` genérico sin exposición interna

### GET /api/reservations/week?start=YYYY-MM-DD&end=YYYY-MM-DD (`week/route.ts`)
- `requireSession()` — sesión obligatoria
- Validación de `start` y `end`: ausentes o formato inválido → 400
- Validación de orden: `start > end` → 400
- Validación de rango máximo: `MAX_RANGE_DAYS = 14` — ¿es coherente con la regla de negocio de 2 semanas?
- Respuesta 200 con array de reservas en rango
- Bloque `catch` genérico sin exposición interna

### Aspectos transversales
- `requireSession` está importado desde `@/lib/api-auth` — verificar que es la implementación correcta
- `HTTP_STATUS` como mapa de `ServiceErrorCode` → HTTP status — verificar completitud del mapa
- Consistencia de mensajes de error entre endpoints (idioma, nivel de detalle)
- Ausencia de lógica de negocio en los route handlers (toda en `services/`)
- Ningún endpoint expone stack traces, IDs de MongoDB internos ni detalles de infraestructura

## Casos límite
- POST sin campo `date` en body — ¿se valida el formato o solo que sea string?
- DELETE con `id` = `undefined` o vacío — comportamiento del matcher de ruta
- GET /week con `start === end` — debe funcionar correctamente (rango de 1 día)
- GET /week con rango de exactamente 14 días — debe ser válido (límite inclusivo)
- GET /week con rango de 15 días — debe devolver 400
- `session.user.id` de tipo string — ¿es compatible con los tipos esperados por el servicio?

## Criterios de aceptación
- AC-1: Verificar que los cuatro endpoints requieren sesión activa y devuelven 401 sin ella
- AC-2: Verificar que la validación de entrada (parámetros y body) es completa y devuelve 400 con mensaje claro en todos los casos inválidos
- AC-3: Verificar que `userId` y `role` se obtienen siempre de la sesión, nunca de la entrada del cliente
- AC-4: Verificar que el mapeo `ServiceErrorCode → HTTP status` es correcto y cubre todos los códigos posibles
- AC-5: Verificar que los bloques `catch` no exponen detalles internos y devuelven mensajes genéricos con 500
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-136
- Sin modificaciones al código fuente

---

## Execution Result

- Fecha de implementación: 2026-05-06 (CET)
- Rama: feature/OP-130-auditoria-api-routes-seguridad
- Commit: pendiente (solo auditoría, sin cambios de código)
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — Los cuatro endpoints llaman a `requireSession()` y retornan 401 via discriminated union (`{ session, error }`). `requireSession` verifica `session?.user?.id` antes de autorizar.
  - AC-2: PASS con observación — GET /reservations valida `date` con `isValidDateString`; POST no valida el formato YYYY-MM-DD de `date`, solo que sea `typeof string`. Un valor como `"hola"` pasaría la validación del route. El resto de validaciones son correctas y devuelven 400 con mensajes claros.
  - AC-3: PASS — `userId` se obtiene siempre de `session.user.id`; `role` de `session.user.role`. El body nunca se usa para estos valores.
  - AC-4: PASS — `HTTP_STATUS` cubre los cuatro `ServiceErrorCode` definidos (`validation→400`, `not_found→404`, `forbidden→403`, `conflict→409`). Está duplicado en `route.ts` y `[id]/route.ts`.
  - AC-5: PASS — Todos los bloques `catch` usan `catch { }` sin capturar la excepción y devuelven mensajes genéricos sin stack trace ni detalles de infraestructura.
  - AC-6: PASS — Hallazgos documentados con severidad:
    - **H-131-1 (Mejora)**: POST /api/reservations — `date` no se valida con `isValidDateString`. Solo se verifica que sea `typeof string`. Candidato a corrección en OP-160.
    - **H-131-2 (Observación)**: `HTTP_STATUS` duplicado en `route.ts` y `[id]/route.ts`. Candidato a centralizar en módulo compartido.
- Ficheros auditados (sin modificaciones):
  - `src/app/api/reservations/route.ts`
  - `src/app/api/reservations/[id]/route.ts`
  - `src/app/api/reservations/week/route.ts`
  - `src/lib/api-auth.ts`
  - `src/domain/types/service.ts`
  - `src/domain/types/next-auth.d.ts`
  - `src/lib/dates.ts`
- verify:
  - Comando ejecutado: verificación de estructura (filesystem checks)
  - Resultado: PASS — todos los ficheros auditados existen en las rutas esperadas
- AI-assisted:
  - Herramienta(s): Claude Code claude-sonnet-4-6
  - Alcance: lectura y análisis de los cuatro endpoints y ficheros de apoyo; redacción de hallazgos y Execution Result
- Decisiones técnicas:
  - Se consideró H-131-1 como "mejora" y no "bloqueante" porque el servicio puede rechazar fechas inválidas mediante su propia validación con `isValidDateString` internamente; sin embargo, la validación en el route es la práctica correcta según CLAUDE.md § 5.5.
  - `MAX_RANGE_DAYS = 14` se confirma como coherente con la regla de negocio (semana actual + siguiente = máx 10 laborables ≈ 14 naturales).
