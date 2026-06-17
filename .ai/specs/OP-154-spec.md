# OP-154 — Identificar gaps de cobertura

## Contexto
Las subtareas OP-151, OP-152 y OP-153 han auditado los 222 tests existentes (unitarios, integración y API). Esta subtarea consolida todos los gaps de cobertura identificados en una lista estructurada, clasificada por severidad y área, que sirve de entrada directa a OP-155 (corrección) y OP-156 (informe final).

Un gap de cobertura es un escenario crítico, caso borde o comportamiento del sistema que no está cubierto por ningún test existente — o que está cubierto de forma insuficiente (assertion demasiado débil para detectar una regresión real).

Esta subtarea no implica modificaciones al código ni a los tests. Solo audita y documenta.

## Objetivo
Producir la lista completa y priorizada de gaps de cobertura de la suite, organizados por severidad (crítico, importante, mejora) y por área (unitario, integración, API). Esta lista es la entrada formal para OP-155 y OP-156.

## Restricciones
- Solo auditar y documentar — no modificar código ni tests
- No añadir nuevos tests en esta subtarea (eso corresponde a OP-155)
- Los gaps deben poder trazarse a un escenario concreto del sistema, no ser genéricos

## Clasificación de severidad

| Nivel | Criterio |
|-------|----------|
| **Crítico** | La ausencia del test permite que una regresión en una regla de negocio o de seguridad pase desapercibida |
| **Importante** | La ausencia del test deja un caso borde relevante sin verificar; un fallo silencioso es posible |
| **Mejora** | El test existe pero la assertion es débil o la cobertura es parcial; el fallo sería detectable pero con menos precisión |

---

## Gaps identificados

### G-01 · Clasificación incorrecta de `compute-status.test.ts`
- **Área**: Unitario
- **Severidad**: Importante
- **Descripción**: `tests/unit/compute-status.test.ts` usa `mongodb-memory-server` y helpers de BD para crear usuarios, mesas y reservas. Está clasificado como test unitario pero es estructuralmente un test de integración. Esto impide ejecutar la suite unitaria de forma aislada y rápida, y puede enmascarar fallos de la capa de servicio como si fueran fallos de la función `computeStatus`.
- **Escenario no cubierto**: No existe ningún test unitario puro de `computeStatus` — la función es privada y solo se ejerce a través del servicio completo.

### G-02 · Flakiness potencial en `today()` sin mock de reloj
- **Área**: Unitario
- **Severidad**: Importante
- **Descripción**: `tests/unit/dates.test.ts` verifica que `today()` devuelve UTC midnight comparando con `new Date()` del sistema. Si el test corre exactamente a medianoche UTC, `new Date()` puede devolver el día siguiente mientras `today()` devuelve el actual, provocando un fallo no determinista.
- **Escenario no cubierto**: Ejecución de `today()` a medianoche UTC sin mock de `Date`.

### G-03 · Casos borde no cubiertos en `isSameDay`
- **Área**: Unitario
- **Severidad**: Importante
- **Descripción**: No hay tests para: (a) dos fechas al límite de día (`23:59:59.999Z` vs `00:00:00.000Z` del siguiente), (b) entrada de `Date` inválida (NaN) — la función llama a `normalizeDate` internamente, que lanza; conviene verificar que `isSameDay` propaga el error en lugar de retornar `false` silenciosamente.
- **Escenario no cubierto**: `isSameDay(new Date("invalid"), "2026-04-01")`.

### G-04 · Casos borde no cubiertos en `isValidDateString`
- **Área**: Unitario
- **Severidad**: Mejora
- **Descripción**: No hay tests para strings con espacios al inicio o al final (e.g. `" 2026-03-19"` o `"2026-03-19 "`). El regex `^\d{4}-\d{2}-\d{2}$` los rechaza, pero no está verificado explícitamente. En un contexto web donde el input viene de un query param, estos casos son realistas.
- **Escenario no cubierto**: `isValidDateString(" 2026-03-19")`, `isValidDateString("2026-03-19 ")`.

### G-05 · Invariantes de `getWeekRange` no verificadas
- **Área**: Unitario
- **Severidad**: Mejora
- **Descripción**: Los tests verifican casos concretos (miércoles → lunes/viernes) pero no verifican propiedades estructurales: (a) `start` siempre ≤ `end`, (b) la diferencia entre `start` y `end` es siempre exactamente 4 días. Si la función se refactorizara incorrectamente, un test basado solo en ejemplos podría pasar con una diferencia de 3 o 5 días.
- **Escenario no cubierto**: Assertion de propiedad `end - start === 4 * 86400000` para cualquier entrada.

### G-06 · Estado de BD acumulado en `compute-status.test.ts`
- **Área**: Unitario / Integración
- **Severidad**: Crítico
- **Descripción**: Los tests de `compute-status.test.ts` usan `result[0]` asumiendo que hay exactamente una mesa en BD. El `afterEach` global de `setup.ts` limpia colecciones, pero dentro de un mismo `describe` los tests acumulan mesas. Si dos `it` consecutivos crean mesas, el segundo test puede ver `result[0]` apuntando a la mesa del test anterior (si la limpieza no ocurrió entre ellos). Además, los dos `describe` del fichero usan fechas distintas (`"2026-04-01"` vs `"2026-04-02"`) como separador de estado, práctica frágil que falla si algún test previo usa la misma fecha.
- **Escenario no cubierto**: Verificación de que `result` tiene exactamente 1 elemento antes de acceder a `result[0]`.

### G-07 · `resetCounters()` no invocado en ningún hook
- **Área**: Integración
- **Severidad**: Mejora
- **Descripción**: `factories.ts` exporta `resetCounters()` pero no se llama en `setup.ts` ni en ningún `beforeEach`. Los contadores `userCounter` y `tableCounter` crecen indefinidamente entre tests. Aunque no afecta a la corrección (los labels son únicos), dificulta el diagnóstico de fallos porque los mensajes de error referencian `Mesa 47` en lugar de `Mesa 1`.
- **Escenario no cubierto**: Reseteo de contadores entre tests.

### G-08 · Índices únicos parciales no verificados como existentes
- **Área**: Integración
- **Severidad**: Crítico
- **Descripción**: Los tests de `reservation-repository.test.ts` verifican el comportamiento de los índices únicos parciales (`{tableId, date}` y `{userId, date}` solo para reservas `confirmed`), pero no verifican que los índices estén definidos en el schema de Mongoose. Si el índice no existe en `mongodb-memory-server` (por un error en la definición del schema), los tests de E11000 fallarían con un error inesperado distinto al `code: 11000`, pero los tests de "se puede re-reservar tras cancelar" podrían pasar por razones incorrectas.
- **Escenario no cubierto**: Verificación explícita de que `getIndexes()` de la colección incluye los índices `{tableId, date}` y `{userId, date}` con `partialFilterExpression: { status: "confirmed" }`.

### G-09 · Cancelar y re-reservar con el mismo usuario no cubierto
- **Área**: Integración
- **Severidad**: Importante
- **Descripción**: Los tests de índice parcial verifican "cancelar reserva de usuario1 y reservar con usuario2" (índice `{tableId, date}`) y "cancelar reserva de usuario en mesa1 y reservar en mesa2" (índice `{userId, date}`). Pero no verifican "cancelar reserva de usuario1 en mesa1 y volver a reservar usuario1 en mesa1 el mismo día" — el caso donde el mismo usuario recupera la misma mesa tras cancelar.
- **Escenario no cubierto**: `cancelar(user1, mesa1, date)` → `insertar(user1, mesa1, date)` debe tener éxito.

### G-10 · Rango invertido no cubierto en repositorio y servicio
- **Área**: Integración
- **Severidad**: Importante
- **Descripción**: `getReservationsByDateRange` y `getTableAvailabilityForRange` no tienen tests para el caso `start > end`. El comportamiento no está definido (¿array vacío?, ¿lanza?) y un consumidor podría recibir resultados inesperados.
- **Escenario no cubierto**: `getReservationsByDateRange("2026-04-05", "2026-04-01")`.

### G-11 · Concurrencia simulada vs. real no documentada
- **Área**: Integración
- **Severidad**: Importante
- **Descripción**: `concurrency.test.ts` usa `Promise.allSettled` en el mismo event loop de Node.js con una sola conexión a `mongodb-memory-server`. Esto no reproduce concurrencia real entre múltiples instancias de Vercel. El test verifica que el índice único rechaza el duplicado, pero no garantiza el comportamiento bajo carga real. Esta limitación no está documentada en ningún comentario del fichero.
- **Escenario no cubierto**: Documentación explícita de la limitación; test de estado final en BD tras la carrera (verificar que exactamente 1 reserva `confirmed` existe, no solo que el servicio retornó `ok: false`).

### G-12 · Reservas canceladas no excluidas en endpoints de lectura
- **Área**: API
- **Severidad**: Crítico
- **Descripción**: `GET /api/reservations` y `GET /api/reservations/week` no tienen tests que verifiquen que las reservas con `status: "cancelled"` **no** aparecen en la respuesta. Si el filtro del repositorio se rompe, los clientes recibirían reservas canceladas mezcladas con las confirmadas, afectando la vista del plano de oficina.
- **Escenario no cubierto**: Crear reserva confirmada + reserva cancelada para la misma fecha; verificar que `GET /api/reservations?date=...` devuelve solo 1 resultado.

### G-13 · Cuerpo de respuestas de error no verificado en tests de API
- **Área**: API
- **Severidad**: Importante
- **Descripción**: La mayoría de tests de API verifican el status code HTTP pero no el campo `error` del body. Un handler que devuelva `{ message: "..." }` en lugar de `{ error: "..." }` pasaría todos los tests de status code pero rompería los clientes que leen `response.error`. Afecta a: `400` de `POST /api/reservations`, `409` de `POST /api/reservations`, `400` de endpoints de rango, y `400` de `GET /api/availability`.
- **Escenario no cubierto**: `expect(body.error).toBeDefined()` o `expect(body).toHaveProperty("error")` en cada test de error 4xx.

### G-14 · `userId` manipulado en body de `POST /api/reservations` no cubierto
- **Área**: API / Seguridad
- **Severidad**: Crítico
- **Descripción**: No existe ningún test que verifique que si un cliente envía `{ tableId, date, userId: "otro-id" }` en el body, el endpoint ignora el `userId` del body y usa el de la sesión. Si el handler extrajera `userId` del body en lugar de la sesión, un usuario podría crear reservas en nombre de otro.
- **Escenario no cubierto**: `POST /api/reservations` con `userId` ajeno en body — la reserva debe crearse con el `userId` de la sesión.

### G-15 · Assertion débil en `availability.test.ts` sobre objeto `reservation`
- **Área**: API
- **Severidad**: Mejora
- **Descripción**: El test "reflects reservation in availability" usa `expect(body[0].reservation).toBeDefined()`. Si el servicio devolviera `reservation: {}` (objeto vacío) o `reservation: true`, el test pasaría. Debe verificarse la estructura completa: `{ _id: string, userId: string, userName: string }`.
- **Escenario no cubierto**: Verificación de estructura completa de `reservation` en la respuesta de disponibilidad.

### G-16 · `Content-Type` de respuestas no verificado
- **Área**: API
- **Severidad**: Mejora
- **Descripción**: Ningún test verifica que las respuestas incluyen `Content-Type: application/json`. Si un handler lanzara una excepción no capturada y Next.js respondiera con HTML de error, todos los tests de status code 500 pasarían — pero el cliente recibiría HTML en lugar de JSON y se rompería al parsear.
- **Escenario no cubierto**: `expect(response.headers.get("Content-Type")).toContain("application/json")` en tests representativos de cada endpoint.

### G-17 · Admin cancelando reserva ya cancelada no cubierto en API
- **Área**: API
- **Severidad**: Importante
- **Descripción**: `reservations-cancel.test.ts` cubre que el propietario no puede cancelar dos veces (en `auth-security.test.ts`), pero no cubre que un admin que intenta cancelar una reserva ya cancelada también recibe `400`. La lógica de autorización y la de validación de estado son independientes — ambas deben verificarse.
- **Escenario no cubierto**: Admin cancela reserva ya cancelada → `400`.

### G-18 · Filtración de información en respuesta 403 no verificada completamente
- **Área**: API / Seguridad
- **Severidad**: Importante
- **Descripción**: `auth-security.test.ts` verifica que `body.error` no contiene el `_id` del propietario, pero no verifica que no contiene su email, nombre, ni detalles de la reserva. Una respuesta 403 que filtre el nombre del propietario sería una vulnerabilidad de privacidad.
- **Escenario no cubierto**: `expect(JSON.stringify(body)).not.toContain(owner.email)`, `expect(JSON.stringify(body)).not.toContain(owner.name)`.

### G-19 · Limitación estructural de tests de API no documentada
- **Área**: API
- **Severidad**: Mejora
- **Descripción**: Los handlers se invocan directamente sin pasar por el servidor HTTP de Next.js. Esto excluye: middleware global, cabeceras CORS, compresión, y cualquier lógica que viva en `middleware.ts` o en el runtime de Vercel. Ningún test ni comentario documenta esta limitación, lo que puede dar falsa confianza de cobertura completa.
- **Escenario no cubierto**: Comentario JSDoc en `tests/api/` explicando la limitación estructural.

---

## Resumen por severidad

| Severidad | Gaps | IDs |
|-----------|------|-----|
| **Crítico** | 4 | G-06, G-08, G-12, G-14 |
| **Importante** | 9 | G-01, G-02, G-03, G-09, G-10, G-11, G-13, G-17, G-18 |
| **Mejora** | 6 | G-04, G-05, G-07, G-15, G-16, G-19 |

## Resumen por área

| Área | Gaps | IDs |
|------|------|-----|
| Unitario | 5 | G-01, G-02, G-03, G-04, G-05 |
| Unitario / Integración | 1 | G-06 |
| Integración | 5 | G-07, G-08, G-09, G-10, G-11 |
| API | 5 | G-12, G-13, G-15, G-16, G-17 |
| API / Seguridad | 3 | G-14, G-18, G-19 |

## Criterios de aceptación
- AC-1: Todos los gaps críticos (G-06, G-08, G-12, G-14) documentados con escenario concreto, fichero afectado y criterio de corrección
- AC-2: Todos los gaps importantes documentados con escenario concreto y propuesta de test
- AC-3: Todos los gaps de mejora documentados con justificación de por qué la assertion actual es insuficiente
- AC-4: Gaps clasificados por severidad y área en tablas de resumen
- AC-5: Lista de gaps trasladada a `.ai/reports/OP-150-findings.md` como sección `## Gaps de cobertura`
- AC-6: Cada gap incluye referencia a la subtarea de auditoría que lo originó (OP-151, OP-152 o OP-153)

## Criterio de done
- Todos los AC en PASS
- Lista de gaps consolidada en `.ai/reports/OP-150-findings.md`
- Sin modificaciones al código fuente ni a los tests
- Spec actualizada con ## Execution Result

## Execution Result

**Estado: DONE — 2026-05-07**

### AC-1 — PASS
Los 4 gaps críticos documentados con escenario concreto, fichero afectado y criterio de corrección:
- **G-06** (`tests/unit/compute-status.test.ts`) — `result[0]` sin garantía de unicidad en BD → filtrar por `tableId` explícito
- **G-08** (`tests/integration/reservation-repository.test.ts`) — índices únicos parciales no verificados como existentes en la colección
- **G-12** (`tests/api/reservations-read.test.ts`) — reservas canceladas no excluidas verificadas en endpoints de lectura
- **G-14** (`tests/api/auth-security.test.ts`) — `userId` ajeno en body de `POST /api/reservations` no testeado (riesgo IDOR)

### AC-2 — PASS
Los 9 gaps importantes documentados con escenario concreto y propuesta de test: G-01 (reclasificación compute-status), G-02 (flakiness today()), G-03 (isSameDay con NaN/borde de día), G-09 (mismo usuario re-reserva misma mesa tras cancelar), G-10 (rango invertido), G-11 (concurrencia simulada sin documentación ni estado final BD), G-13 (body de errores 4xx no verificado), G-17 (admin cancela ya cancelada), G-18 (filtración de email/nombre en 403).

### AC-3 — PASS
Los 6 gaps de mejora documentados con justificación: G-04 (strings con espacios en isValidDateString), G-05 (invariante estructural getWeekRange), G-07 (resetCounters no invocado), G-15 (assertion débil en objeto reservation), G-16 (Content-Type no verificado), G-19 (limitación estructural no documentada).

### AC-4 — PASS
Gaps clasificados por severidad (4 críticos, 9 importantes, 6 mejoras) y por área (unitario, integración, API, seguridad) en tablas de resumen.

### AC-5 — PASS
Lista completa trasladada a `.ai/reports/OP-150-findings.md` en sección `## OP-154 — Gaps de cobertura consolidados` con resumen consolidado de 77 hallazgos totales (OP-151 + OP-152 + OP-153).

### AC-6 — PASS
Cada gap incluye referencia a los hallazgos originales (U-xxx, I-xxx, A-xxx) que lo originaron, con trazabilidad completa a OP-151, OP-152 y OP-153.

**Sin modificaciones al código fuente ni a los tests.**
