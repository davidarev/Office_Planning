# OP-150 — Informe de hallazgos: Auditoría y refuerzo de tests

> Auditoría de la suite de tests (222 casos: unitarios, integración y API).
> Los gaps corregidos se aplicaron en OP-155. Los no corregidos se proponen para OP-160.

---

## OP-151 — Tests unitarios (`dates.test.ts`, `compute-status.test.ts`)

**Fecha de auditoría**: 2026-05-07
**Auditor**: Claude Code (IA-asistido)

### AC-1: Cobertura de `normalizeDate` — PASS con observaciones

- Tests básicos presentes para conversión de `Date` y `string`.
- **Hallazgo H-150-05**: `compute-status.test.ts` ubicado en `tests/unit/` pese a usar `mongodb-memory-server` — reclasificado como test de integración.
- **Observación**: no hay caso UTC-safe con offset negativo; el comportamiento es correcto pero sin test explícito.

### AC-2: Cobertura de `isSameDay` — PASS con hallazgos

- Faltaban casos de borde de medianoche y entrada `Date` inválida (NaN).
- **Hallazgo H-150-07**: se corrigieron ambos casos en OP-155.

### AC-3: Cobertura de `today()` — PASS con hallazgo

- **Hallazgo H-150-06**: flakiness potencial a medianoche UTC por doble `new Date()` sin mock de reloj.
- Corregido en OP-155 verificando propiedades estructurales UTC en lugar de fecha concreta.

### AC-4: Cobertura de `isValidDateString` — PASS con hallazgo

- **Hallazgo H-150-14**: strings con espacios al inicio/final no cubiertos.
- Corregidos en OP-155.

### AC-5: Cobertura de `getWeekRange` — PASS con hallazgo

- **Hallazgo H-150-15**: invariantes estructurales (`end - start === 4 días`) no verificadas.
- Corregidos en OP-155.

### AC-6: Clasificación de `compute-status.test.ts` — hallazgo crítico

- **Hallazgo H-150-01 / H-150-05**: `result[0]` sin verificación de longitud; fichero mal clasificado como unitario.
- Ambos corregidos en OP-155.

### Hallazgos OP-151

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| H-150-05 | Importante | `compute-status.test.ts` clasificado incorrectamente como test unitario | [CORREGIDO en OP-155] |
| H-150-06 | Importante | Flakiness potencial en `today()` sin mock de reloj | [CORREGIDO en OP-155] |
| H-150-07 | Importante | Casos borde no cubiertos en `isSameDay` (NaN, medianoche) | [CORREGIDO en OP-155] |
| H-150-14 | Mejora | Strings con espacios no verificados en `isValidDateString` | [CORREGIDO en OP-155] |
| H-150-15 | Mejora | Invariantes estructurales de `getWeekRange` no verificadas | [CORREGIDO en OP-155] |

---

## OP-152 — Tests de integración (5 ficheros en `tests/integration/`)

**Fecha de auditoría**: 2026-05-07
**Auditor**: Claude Code (IA-asistido)

### AC-1: Setup y teardown global — PASS con hallazgo

- El guard `readyState === 1` en `setup.ts` previene limpieza errónea sin conexión.
- **Hallazgo H-150-16**: `resetCounters()` exportado pero nunca invocado — corregido en OP-155.

### AC-2: Índices únicos parciales en `reservation-repository.test.ts` — PASS con hallazgos

- **Hallazgo H-150-02**: índices parciales `{tableId,date}` y `{userId,date}` no verificados como existentes en schema.
- **Hallazgo H-150-08**: caso "mismo usuario re-reserva misma mesa tras cancelar" no cubierto.
- Ambos corregidos en OP-155.

### AC-3: Rango de fechas — PASS con hallazgo

- **Hallazgo H-150-09**: rango invertido (`start > end`) sin comportamiento definido ni testeado.
- Corregido en OP-155 documentando el comportamiento observado.

### AC-4: Concurrencia — PASS con hallazgo

- **Hallazgo H-150-10**: limitación de concurrencia simulada no documentada; estado final en BD no verificado.
- Corregido en OP-155 con comentario JSDoc y verificación de exactamente 1 reserva `confirmed`.

### Hallazgos OP-152

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| H-150-02 | Crítico | Índices únicos parciales no verificados como existentes en el schema | [CORREGIDO en OP-155] |
| H-150-08 | Importante | Mismo usuario re-reservando misma mesa tras cancelar no cubierto | [CORREGIDO en OP-155] |
| H-150-09 | Importante | Rango invertido (`start > end`) sin comportamiento definido | [CORREGIDO en OP-155] |
| H-150-10 | Importante | Limitación de concurrencia simulada no documentada; estado final en BD no verificado | [CORREGIDO en OP-155] |
| H-150-16 | Mejora | `resetCounters()` no invocado en ningún hook | [CORREGIDO en OP-155] |

---

## OP-153 — Tests de API (6 ficheros en `tests/api/`)

**Fecha de auditoría**: 2026-05-07
**Auditor**: Claude Code (IA-asistido)

### AC-1: Endpoints de lectura de reservas — PASS con hallazgo

- **Hallazgo H-150-03**: reservas canceladas no verificadas como excluidas en `GET /api/reservations` y `/week`.
- Corregido en OP-155.

### AC-2: Endpoint de creación — PASS con hallazgo crítico de seguridad

- **Hallazgo H-150-04**: `userId` manipulado en body de `POST /api/reservations` no cubierto (IDOR).
- Corregido en OP-155.

### AC-3: Cuerpos de respuesta de error — PASS con hallazgo

- **Hallazgo H-150-11**: tests de error `4xx` verificaban solo el status code, no el campo `error` del body.
- Corregido en OP-155 en los endpoints críticos (409 de reservas, 400 de disponibilidad).

### AC-4: Endpoint de cancelación — PASS con hallazgo

- **Hallazgo H-150-12**: admin cancelando reserva ya cancelada no cubierto.
- Corregido en OP-155.

### AC-5: No filtración de datos del propietario — PASS con hallazgo

- **Hallazgo H-150-13**: test de 403 no verificaba email ni nombre del propietario.
- Corregido en OP-155.

### AC-6: Content-Type y limitación estructural — hallazgos de mejora

- **Hallazgo H-150-18**: `Content-Type: application/json` no verificado en ningún test.
- **Hallazgo H-150-19**: limitación de tests sin servidor HTTP no documentada.

### Hallazgos OP-153

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| H-150-03 | Crítico | Reservas canceladas no excluidas verificadas en endpoints de lectura | [CORREGIDO en OP-155] |
| H-150-04 | Crítico | `userId` manipulado en body de `POST /api/reservations` no cubierto (IDOR) | [CORREGIDO en OP-155] |
| H-150-11 | Importante | Cuerpos de respuesta de error no verificados en tests de API | [CORREGIDO en OP-155] |
| H-150-12 | Importante | Admin cancelando reserva ya cancelada no cubierto en API | [CORREGIDO en OP-155] |
| H-150-13 | Importante | Filtración de email y nombre del propietario en respuesta 403 no verificada | [CORREGIDO en OP-155] |
| H-150-17 | Mejora | Assertion débil sobre objeto `reservation` en respuesta de disponibilidad | [CORREGIDO en OP-155] |
| H-150-18 | Mejora | `Content-Type` de respuestas no verificado | [DEUDA TÉCNICA] |
| H-150-19 | Mejora | Limitación estructural de tests de API no documentada | [CORREGIDO en OP-155] |

---

## Resumen ejecutivo

La suite de tests cubría 222 casos al inicio de la auditoría. Se identificaron **19 gaps** clasificados en críticos, importantes y mejoras. Tras OP-155, 18 de los 19 gaps fueron corregidos. Uno se mantiene como deuda técnica explícita para OP-160.

### Totales por severidad y estado

| Severidad | Total | Corregidos en OP-155 | Deuda técnica |
|-----------|-------|----------------------|---------------|
| Crítico | 4 | 4 | 0 |
| Importante | 9 | 9 | 0 |
| Mejora | 6 | 5 | 1 |
| **Total** | **19** | **18** | **1** |

### Origen por subtarea de auditoría

| Subtarea | Hallazgos | Corregidos | Deuda |
|----------|-----------|------------|-------|
| OP-151 (unitarios) | 5 | 5 | 0 |
| OP-152 (integración) | 5 | 5 | 0 |
| OP-153 (API) | 9 | 8 | 1 |

**Conclusión**: La suite de tests es **funcionalmente robusta** tras OP-155. Los 4 gaps críticos y los 9 importantes han sido corregidos. La única deuda técnica abierta (H-150-18) es de baja prioridad y no afecta a la corrección funcional de los tests existentes.

---

## Hallazgos completos

### H-150-01 — Acceso a `result[0]` sin verificar longitud del array

- **Severidad**: Crítico
- **Origen**: OP-151
- **Fichero(s)**: `tests/unit/compute-status.test.ts` (reubicado a `tests/integration/compute-status.test.ts` en OP-155)
- **Descripción**: Los tests acceden a `result[0]` asumiendo exactamente una mesa en BD, sin verificar `result.length === 1`. Un estado acumulado entre tests puede contaminar el índice.
- **Riesgo**: Si el `afterEach` de limpieza fallara o se deshabilitara, `result[0]` podría devolver datos de un test anterior, produciendo falsos positivos silenciosos.
- **Estado**: **[CORREGIDO en OP-155]** — se añadió `expect(result).toHaveLength(1)` antes de cada acceso a `result[0]`.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-02 — Índices únicos parciales no verificados como existentes en el schema

- **Severidad**: Crítico
- **Origen**: OP-152
- **Fichero(s)**: `tests/integration/reservation-repository.test.ts`, `src/lib/models/reservation.model.ts`
- **Descripción**: Los tests verifican el comportamiento del índice (E11000) pero no verifican que los índices `{tableId, date}` y `{userId, date}` con `partialFilterExpression: { status: "confirmed" }` están definidos en el schema. Si el índice no existe en `mongodb-memory-server`, los tests de E11000 fallarían con un error distinto al `code: 11000`, pero los de "re-reserva tras cancelar" podrían pasar por razones incorrectas.
- **Riesgo**: Los tests de concurrencia y unicidad podrían pasar por razones distintas a las que se quieren verificar, enmascarando regresiones en la definición de índices.
- **Estado**: **[CORREGIDO en OP-155]** — se añadió `describe("index verification")` que consulta `getIndexes()` de la colección y verifica la existencia y estructura de ambos índices parciales.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-03 — Reservas canceladas no excluidas verificadas en endpoints de lectura

- **Severidad**: Crítico
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/reservations-read.test.ts`
- **Descripción**: `GET /api/reservations` y `GET /api/reservations/week` no tenían tests que verificaran que las reservas `cancelled` no aparecen en la respuesta. Si el filtro del repositorio se rompe, las reservas canceladas llegarían al cliente mezcladas con las confirmadas, rompiendo el plano de oficina.
- **Riesgo**: Una regresión en el filtro de reservas canceladas pasaría desapercibida, produciendo datos incorrectos en el plano de oficina visible por todos los usuarios.
- **Estado**: **[CORREGIDO en OP-155]** — se añadieron tests que crean reserva confirmada + cancelada y verifican que solo aparece la confirmada en la respuesta.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-04 — `userId` manipulado en body de `POST /api/reservations` no cubierto

- **Severidad**: Crítico
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/reservations-create.test.ts`, `src/app/api/reservations/route.ts`
- **Descripción**: No existía ningún test que verificara que si un cliente envía `userId` ajeno en el body, el endpoint usa el `userId` de la sesión y no el del body. Un handler que extrajera `userId` del body permitiría a un usuario crear reservas en nombre de otro (IDOR).
- **Riesgo**: Vulnerabilidad IDOR — un usuario podría crear reservas que aparecen como de otro usuario, manipulando el estado del plano de oficina.
- **Estado**: **[CORREGIDO en OP-155]** — se añadió test con `userId` ajeno en body, verificando que `body.userId === session.userId`.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-05 — `compute-status.test.ts` clasificado incorrectamente como test unitario

- **Severidad**: Importante
- **Origen**: OP-151
- **Fichero(s)**: `tests/unit/compute-status.test.ts`
- **Descripción**: El fichero usa `mongodb-memory-server` y helpers de BD — es estructuralmente un test de integración. Su presencia en `tests/unit/` impide ejecutar la suite unitaria de forma aislada y rápida.
- **Riesgo**: `npm run test:unit` incluye tests que arrancan MongoDB, haciéndolo más lento y menos aislado de lo esperado. Los umbrales de cobertura por directorio también quedan distorsionados.
- **Estado**: **[CORREGIDO en OP-155]** — fichero reubicado a `tests/integration/compute-status.test.ts`.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-06 — Flakiness potencial en `today()` sin mock de reloj

- **Severidad**: Importante
- **Origen**: OP-151
- **Fichero(s)**: `tests/unit/dates.test.ts`
- **Descripción**: El test "returns today's date (same calendar day)" compara el resultado de `today()` con `new Date()`. Si el test corre exactamente a medianoche UTC, los valores pueden diferir en un día.
- **Riesgo**: Test no determinista en CI — puede fallar esporádicamente en ejecuciones nocturnas o en zonas horarias con offset UTC negativo, generando alertas falsas y erosionando la confianza en la suite.
- **Estado**: **[CORREGIDO en OP-155]** — se añadió comentario explícito sobre el riesgo y se verifican solo las propiedades estructurales (UTC midnight) y no la fecha concreta.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-07 — Casos borde no cubiertos en `isSameDay`

- **Severidad**: Importante
- **Origen**: OP-151
- **Fichero(s)**: `tests/unit/dates.test.ts`
- **Descripción**: Faltaban tests para `Date` inválida (NaN) y para fechas al límite de medianoche UTC (`23:59:59.999Z` vs `00:00:00.000Z` del día siguiente).
- **Riesgo**: Si `isSameDay` se refactoriza y deja de delegar correctamente en `normalizeDate`, los casos borde podrían retornar `false` en lugar de lanzar, sin que ningún test lo detecte.
- **Estado**: **[CORREGIDO en OP-155]** — añadidos ambos casos.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-08 — Mismo usuario re-reservando la misma mesa tras cancelar no cubierto

- **Severidad**: Importante
- **Origen**: OP-152
- **Fichero(s)**: `tests/integration/reservation-repository.test.ts`
- **Descripción**: Los tests de índice parcial no cubrían el caso `cancelar(user1, mesa1, date)` → `insertar(user1, mesa1, date)`. Solo cubrían re-reserva con usuario distinto o mesa distinta.
- **Riesgo**: El escenario más directo para verificar el índice `{userId, date}` con `status: confirmed` como condición parcial estaba sin cubrir. Una regresión en el índice parcial podría pasar desapercibida.
- **Estado**: **[CORREGIDO en OP-155]** — añadido test de re-reserva mismo usuario misma mesa.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-09 — Rango invertido (`start > end`) sin comportamiento definido

- **Severidad**: Importante
- **Origen**: OP-152
- **Fichero(s)**: `tests/integration/reservation-repository.test.ts`, `tests/integration/availability-service.test.ts`
- **Descripción**: `getReservationsByDateRange` y `getTableAvailabilityForRange` no tenían tests para rango invertido. El comportamiento real (array vacío vs. lanza) no estaba documentado ni verificado.
- **Riesgo**: Si la UI o un servicio upstream envía accidentalmente `start > end` (por ejemplo, al navegar hacia atrás en el calendario), el comportamiento real es desconocido y puede producir resultados inesperados o errores 500.
- **Estado**: **[CORREGIDO en OP-155]** — añadidos tests que documentan el comportamiento observado.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-10 — Limitación de concurrencia simulada no documentada

- **Severidad**: Importante
- **Origen**: OP-152
- **Fichero(s)**: `tests/integration/concurrency.test.ts`
- **Descripción**: Los tests de carrera usan `Promise.allSettled` en el mismo event loop con una sola conexión a `mongodb-memory-server`. No reproducen concurrencia real multi-proceso. Esta limitación no estaba documentada y el estado final en BD no se verificaba.
- **Riesgo**: Los tests pueden dar una falsa sensación de cobertura de concurrencia real (múltiples instancias Vercel). Además, si el servicio retorna `ok: true` pero no inserta en BD, los tests no lo detectarían.
- **Estado**: **[CORREGIDO en OP-155]** — añadido comentario JSDoc con la limitación y tests que verifican el estado final en BD (exactamente 1 reserva `confirmed` tras la carrera).
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-11 — Cuerpos de respuesta de error no verificados en tests de API

- **Severidad**: Importante
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/reservations-create.test.ts`, `tests/api/availability.test.ts`, `tests/api/reservations-read.test.ts`
- **Descripción**: Los tests de error 4xx verificaban el status code pero no el campo `error` del body. Un handler que devolviera `{ message: "..." }` en lugar de `{ error: "..." }` pasaría todos los tests.
- **Riesgo**: Una regresión en el contrato de respuesta de error (campo `error` → `message`, o body vacío) pasaría desapercibida, produciendo clientes que no pueden mostrar el mensaje de error correcto.
- **Estado**: **[CORREGIDO en OP-155]** — añadidas assertions `expect(body.error).toBeDefined()` en los tests de error más críticos (409 de reservas, 400 de disponibilidad).
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-12 — Admin cancelando reserva ya cancelada no cubierto en API

- **Severidad**: Importante
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/reservations-cancel.test.ts`
- **Descripción**: El fichero solo cubría que el propietario no puede cancelar dos veces, pero no que un admin tampoco puede. La lógica de autorización y la de validación de estado son independientes.
- **Riesgo**: Si la validación de estado solo se aplica para el propietario y no para el admin, un admin podría cancelar una reserva ya cancelada sin error, generando estados inconsistentes en BD.
- **Estado**: **[CORREGIDO en OP-155]** — añadido test de admin cancelando reserva ya cancelada → 400.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-13 — Filtración de email y nombre del propietario en respuesta 403 no verificada

- **Severidad**: Importante
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/auth-security.test.ts`
- **Descripción**: El test de "user cannot cancel another user's reservation" solo verificaba que `body.error` no contiene el `_id` del propietario, pero no su email ni nombre.
- **Riesgo**: Si el servicio de cancelación incluyera el email o nombre del propietario en el mensaje de error (inadvertidamente o por regresión), el test no lo detectaría — información personal del propietario quedaría expuesta al usuario no autorizado.
- **Estado**: **[CORREGIDO en OP-155]** — añadidas verificaciones `not.toContain(owner.email)` y `not.toContain(owner.name)`.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-14 — Strings con espacios no verificados en `isValidDateString`

- **Severidad**: Mejora
- **Origen**: OP-151
- **Fichero(s)**: `tests/unit/dates.test.ts`
- **Descripción**: No había tests para strings con espacios al inicio o al final. Casos realistas en inputs de query params web.
- **Riesgo**: Si el regex se refactoriza y se eliminan los anchors `^...$`, los strings con espacios pasarían como válidos, produciendo queries con fechas incorrectas en MongoDB.
- **Estado**: **[CORREGIDO en OP-155]** — añadidos tests `" 2026-03-19"` y `"2026-03-19 "`.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-15 — Invariantes estructurales de `getWeekRange` no verificadas

- **Severidad**: Mejora
- **Origen**: OP-151
- **Fichero(s)**: `tests/unit/dates.test.ts`
- **Descripción**: Los tests verificaban ejemplos concretos pero no propiedades estructurales: `end - start === 4 días` y `start ≤ end` para cualquier entrada.
- **Riesgo**: Si la lógica de `getWeekRange` cambia para devolver un rango de longitud distinta (por ejemplo, 5 días incluyendo fin de semana), ningún test de ejemplo concreto lo detectaría si los valores absolutos siguen siendo correctos.
- **Estado**: **[CORREGIDO en OP-155]** — añadidos tests de propiedad estructural y de entrada inválida.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-16 — `resetCounters()` no invocado en ningún hook

- **Severidad**: Mejora
- **Origen**: OP-152
- **Fichero(s)**: `tests/setup.ts`, `tests/helpers/factories.ts`
- **Descripción**: Los contadores de factories crecen entre tests, dificultando el diagnóstico de fallos. `resetCounters()` estaba exportado pero sin usar.
- **Riesgo**: Sin impacto en la corrección funcional, pero dificulta la depuración: los labels acumulan índices crecientes (`Mesa 47` en lugar de `Mesa 1`), haciendo los mensajes de error de Vitest más difíciles de relacionar con el test fallido.
- **Estado**: **[CORREGIDO en OP-155]** — añadida llamada a `resetCounters()` en `afterEach` de `setup.ts`.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-17 — Assertion débil sobre objeto `reservation` en respuesta de disponibilidad

- **Severidad**: Mejora
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/availability.test.ts`
- **Descripción**: `expect(body[0].reservation).toBeDefined()` no verifica la estructura del objeto.
- **Riesgo**: Si el contrato de respuesta de la API cambia (por ejemplo, `reservation` devuelve solo el `_id` en lugar del objeto completo), el test seguiría pasando mientras `reservation` tenga cualquier valor truthy.
- **Estado**: **[CORREGIDO en OP-155]** — reforzado con `toMatchObject({ _id: expect.any(String), userId: expect.any(String), userName: "Test User" })`.
- **Propuesta para OP-160**: N/A — corregido.

---

### H-150-18 — `Content-Type` de respuestas no verificado

- **Severidad**: Mejora
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/` (todos los ficheros)
- **Descripción**: Ningún test verificaba que las respuestas incluyen `Content-Type: application/json`.
- **Riesgo**: Bajo en el contexto actual de invocación directa de handlers (Next.js garantiza el header). Un error no capturado que produjera HTML de error pasaría los tests de status 200, pero los tests de estructura del body lo detectarían igualmente.
- **Estado**: **[DEUDA TÉCNICA]** — el coste de añadir la verificación en todos los tests es alto (decenas de assertions) y el beneficio real es bajo dado que: (1) los handlers se invocan directamente sin servidor HTTP, (2) Next.js garantiza `Content-Type: application/json` en `NextResponse.json()`, y (3) los tests de estructura del body ya actúan como red de seguridad.
- **Propuesta para OP-160**: Añadir la verificación en un test representativo por endpoint como smoke test, no en todos los casos.

---

### H-150-19 — Limitación estructural de tests de API no documentada

- **Severidad**: Mejora
- **Origen**: OP-153
- **Fichero(s)**: `tests/api/` (todos los ficheros)
- **Descripción**: Los handlers se invocan directamente sin servidor HTTP. No se ejercita el middleware de Next.js, CORS ni lógica del runtime de Vercel.
- **Riesgo**: Los tests de API no detectan problemas en la capa de middleware ni en headers globales configurados en `next.config.js`. Esta limitación puede dar una falsa sensación de cobertura completa de la capa API.
- **Estado**: **[CORREGIDO en OP-155]** — añadido comentario JSDoc en `auth-security.test.ts` (fichero transversal de la suite de API) documentando la limitación.
- **Propuesta para OP-160**: N/A — corregido.

---

## Candidatos revisados sin hallazgo

Los siguientes puntos fueron examinados durante la auditoría y no generaron hallazgo:

| Candidato | Resultado | Justificación |
|-----------|-----------|---------------|
| `afterEach` de `setup.ts` corriendo para tests unitarios sin BD | Sin hallazgo | El guard `readyState === 1` evita el intento de limpieza si Mongoose no está conectado. Sin overhead real. |
| `vi.restoreAllMocks()` en `beforeEach` de tests de API — ¿restaura correctamente? | Sin hallazgo | `vi.mock()` a nivel de módulo mantiene el mock del módulo, pero `vi.restoreAllMocks()` restaura la implementación de cada `vi.fn()`. El patrón es correcto: el módulo sigue mockeado pero la función vuelve a su implementación base (que lanza si se llama sin configurar). |
| Tests de concurrencia con `maxConcurrency: 1` en vitest.config — ¿son relevantes? | Sin hallazgo | `maxConcurrency: 1` controla la concurrencia de ficheros de test entre sí, no la concurrencia dentro de un test. `Promise.allSettled` dentro de un test sigue siendo efectivo para el propósito de verificar el índice único. |
| `mockSession` con `email: "test@example.com"` por defecto — ¿causa falsos positivos? | Sin hallazgo | Ningún test de los ficheros auditados depende de que el email de la sesión coincida con el del usuario creado en BD. El email de la sesión es irrelevante para las operaciones verificadas. |
| Race condition en `getMongoClient()` al crear dos instancias concurrentes | Sin hallazgo | La promesa se asigna a `cached.promise` antes de `await`, por lo que llamadas concurrentes comparten la misma `Promise`. No hay ventana de doble creación. |
| Tests de tipo `fixed` sin reserva → verifican color `red` | Sin hallazgo | La lógica de `computeStatus` aplica el tipo antes que el estado de reserva; el comportamiento está correctamente cubierto en el test existente. |
