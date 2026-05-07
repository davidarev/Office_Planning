# OP-135 — Verificar que no se exponen datos internos en errores

## Contexto
Todos los endpoints de la API (`src/app/api/`) y el middleware (`src/proxy.ts`) manejan errores de distinta naturaleza: errores de validación, errores de negocio del servicio, errores inesperados de infraestructura (MongoDB, red). Esta subtarea forma parte de la auditoría OP-130 y no implica cambios en el código.

## Objetivo
Verificar de forma transversal que ningún endpoint ni el middleware expone en sus respuestas información interna sensible: stack traces, mensajes de error de MongoDB, nombres de colecciones, rutas de ficheros, IDs internos no necesarios ni detalles de infraestructura.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Bloques `catch` genéricos
Revisar todos los bloques `catch` en los siguientes ficheros:
- `src/app/api/reservations/route.ts` (GET y POST)
- `src/app/api/reservations/[id]/route.ts` (DELETE)
- `src/app/api/reservations/week/route.ts` (GET)
- `src/app/api/availability/route.ts` (GET)
- `src/app/api/availability/week/route.ts` (GET)
- `src/app/api/tables/route.ts` (GET)

Para cada bloque verificar:
- El error capturado no se incluye en la respuesta JSON (ni como `error.message`, ni como `stack`, ni como objeto completo)
- El mensaje devuelto al cliente es genérico e informativo, sin detalles técnicos
- El status devuelto es 500
- Si hay logging interno del error (recomendable), que no se exponga al cliente

### Mensajes de error de negocio (ServiceResult)
- Los mensajes de `result.message` provienen del servicio — verificar que estos mensajes no filtran información técnica interna
- Verificar que los mensajes de error de validación (400) son descriptivos para el usuario sin revelar estructura interna

### Middleware (`src/proxy.ts`)
- El middleware no genera respuestas de error directas (solo redirige) — verificar que no hay casos donde pueda devolver una respuesta con detalles internos
- Verificar que `NextResponse.redirect` no incluye información sensible en las URLs construidas

### Ausencia de logging inseguro
- Verificar si existe algún `console.log(error)` o equivalente que pueda exponer datos sensibles en logs de producción (Vercel logs)
- Los logs internos son aceptables, pero deben registrar el error sin datos de usuario sensibles

## Casos límite
- Error `E11000` de MongoDB (duplicate key) — ¿llega al bloque `catch` del route handler o lo captura el servicio? En cualquier caso, verificar que no se expone al cliente
- Error de conexión a MongoDB (timeout, red) — el mensaje genérico del `catch` debe cubrir este caso
- Error de parsing de JSON en POST — está manejado explícitamente con 400 antes del `catch` genérico
- Errores de Mongoose con mensajes que incluyen nombres de campos o colecciones — verificar que no escapan al cliente

## Criterios de aceptación
- AC-1: Verificar que todos los bloques `catch` de los route handlers devuelven únicamente un mensaje genérico sin detalles del error capturado
- AC-2: Verificar que los mensajes de error de negocio (`result.message`) no contienen información técnica interna
- AC-3: Verificar que el error `E11000` de MongoDB no puede llegar al cliente con su mensaje original
- AC-4: Verificar que no hay `console.log(error)` u otros logs que expongan datos sensibles de usuario en producción
- AC-5: Documentar hallazgos con severidad (bloqueante / mejora / observación)

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
| AC-1 | PASS | Todos los bloques `catch` usan `catch {}` sin variable — el error es estructuralmente imposible de incluir en la respuesta. Todos devuelven 500 con mensaje genérico. |
| AC-2 | PASS | Mensajes de `result.message` son todos amigables y de negocio. Sin nombres de colecciones, stack traces ni detalles técnicos. |
| AC-3 | PASS | E11000 capturado en el servicio antes de llegar al route handler. `getDuplicateKeyMessage` solo usa `err.message` internamente para discriminar — nunca expone el mensaje original de MongoDB al cliente. |
| AC-4 | PASS | Sin ningún `console.log`, `console.error` ni equivalente en todo `src/` (excluyendo tests). |
| AC-5 | PASS | 6 hallazgos documentados en `.ai/reports/OP-130-findings.md`: 0 bloqueantes, 1 mejora, 5 observaciones. |

### Hallazgos destacados
- **H-135-05** (Mejora): `getDuplicateKeyMessage` discrimina el tipo de conflicto E11000 por texto de `err.message` — frágil ante cambios de formato de MongoDB. Evaluar usar `keyPattern`.
- **H-135-02** (Observación): Sin ningún logging de errores en producción — correcto para seguridad, pero dificulta diagnóstico.

### Suite de verificación
| Check | Estado |
|-------|--------|
| OP-135-STRUCT-1: src/app/api/reservations/route.ts existe | PASS |
| OP-135-STRUCT-2: src/services/reservation.service.ts existe | PASS |
| OP-135-STRUCT-3: .ai/reports/OP-130-findings.md existe | PASS |
