# OP-156 — Documentar hallazgos OP-150

## Contexto
Las subtareas OP-151 a OP-155 han completado la auditoría de los 222 tests existentes y la corrección de los gaps identificados. Esta subtarea consolida todos los hallazgos en el informe oficial `.ai/reports/OP-150-findings.md`, siguiendo el mismo formato que los informes de las auditorías anteriores (OP-110, OP-120, OP-130, OP-140).

El informe tiene dos funciones: (1) documentar el estado de la suite de tests tras la auditoría, incluyendo lo que se corrigió en OP-155, y (2) listar los gaps que no se corrigieron en OP-155 como deuda técnica explícita para OP-160 o fases posteriores.

Esta subtarea no implica modificaciones al código ni a los tests.

## Objetivo
Producir `.ai/reports/OP-150-findings.md` con el informe consolidado de la auditoría OP-150, estructurado por subtarea (OP-151, OP-152, OP-153, OP-154), con resumen ejecutivo, tabla de hallazgos clasificados, estado tras OP-155 y candidatos revisados sin hallazgo.

## Restricciones
- Solo crear documentación — no modificar código ni tests
- El informe debe seguir el formato de los informes de auditorías anteriores (ver `.ai/reports/OP-140-findings.md`)
- Los hallazgos deben tener ID único `H-150-N`, severidad, origen, fichero, descripción, riesgo y propuesta
- Los gaps ya corregidos en OP-155 deben marcarse como `[CORREGIDO en OP-155]`
- Los gaps no corregidos deben marcarse como `[DEUDA TÉCNICA]` con justificación

## Estructura del informe

El fichero `.ai/reports/OP-150-findings.md` debe contener:

### Cabecera
```markdown
# OP-150 — Informe de hallazgos: Auditoría y refuerzo de tests

> Auditoría de la suite de tests (222 casos: unitarios, integración y API).
> Los gaps corregidos se aplicaron en OP-155. Los no corregidos se proponen para OP-160.
```

### Sección por subtarea de auditoría

Para cada subtarea (OP-151, OP-152, OP-153) incluir:
- Fecha de auditoría, auditor
- Estado de cada AC (PASS / hallazgo con ID)
- Tabla de hallazgos de esa subtarea

### Resumen ejecutivo

Tabla con totales: críticos / importantes / mejoras, y cuántos fueron corregidos en OP-155 vs. quedan como deuda técnica.

### Hallazgos completos

Un bloque por hallazgo con: ID, severidad, origen (subtarea), fichero(s) afectado(s), descripción, riesgo, estado (corregido / deuda técnica) y propuesta para OP-160 si aplica.

## Hallazgos a documentar

Los siguientes hallazgos derivan directamente de los gaps G-01 a G-19 de OP-154. Se organizan con IDs `H-150-01` a `H-150-19`.

### Críticos (4)

**H-150-01** (G-06) — Acceso a `result[0]` sin verificar longitud del array
- Origen: OP-151
- Fichero: `tests/unit/compute-status.test.ts` (reubicado a `tests/integration/` en OP-155)
- Descripción: Los tests acceden a `result[0]` asumiendo exactamente una mesa en BD, sin verificar `result.length === 1`. Un estado acumulado entre tests puede contaminar el índice.
- Estado: **[CORREGIDO en OP-155]** — se añadió `expect(result).toHaveLength(1)` antes de cada acceso.

**H-150-02** (G-08) — Índices únicos parciales no verificados como existentes en el schema
- Origen: OP-152
- Fichero: `tests/integration/reservation-repository.test.ts`, `src/lib/models/reservation.model.ts`
- Descripción: Los tests verifican el comportamiento del índice (E11000) pero no verifican que los índices `{tableId, date}` y `{userId, date}` con `partialFilterExpression: { status: "confirmed" }` están definidos en el schema. Si el índice no existe en `mongodb-memory-server`, los tests de E11000 fallarían con un error distinto al `code: 11000`, pero los de "re-reserva tras cancelar" podrían pasar por razones incorrectas.
- Estado: **[CORREGIDO en OP-155]** — se añadió `describe("index verification")` que consulta `getIndexes()` de la colección y verifica la existencia y estructura de ambos índices parciales.

**H-150-03** (G-12) — Reservas canceladas no excluidas verificadas en endpoints de lectura
- Origen: OP-153
- Fichero: `tests/api/reservations-read.test.ts`
- Descripción: `GET /api/reservations` y `GET /api/reservations/week` no tenían tests que verificaran que las reservas `cancelled` no aparecen en la respuesta. Si el filtro del repositorio se rompe, las reservas canceladas llegarían al cliente mezcladas con las confirmadas, rompiendo el plano de oficina.
- Estado: **[CORREGIDO en OP-155]** — se añadieron tests que crean reserva confirmada + cancelada y verifican que solo aparece la confirmada.

**H-150-04** (G-14) — `userId` manipulado en body de `POST /api/reservations` no cubierto
- Origen: OP-153
- Fichero: `tests/api/reservations-create.test.ts`, `src/app/api/reservations/route.ts`
- Descripción: No existía ningún test que verificara que si un cliente envía `userId` ajeno en el body, el endpoint usa el `userId` de la sesión y no el del body. Un handler que extrajera `userId` del body permitiría a un usuario crear reservas en nombre de otro.
- Estado: **[CORREGIDO en OP-155]** — se añadió test con `userId` ajeno en body, verificando que `body.userId === session.userId`.

### Importantes (9)

**H-150-05** (G-01) — `compute-status.test.ts` clasificado incorrectamente como test unitario
- Origen: OP-151
- Fichero: `tests/unit/compute-status.test.ts`
- Descripción: El fichero usa `mongodb-memory-server` y helpers de BD — es estructuralmente un test de integración. Su presencia en `tests/unit/` impide ejecutar la suite unitaria de forma aislada y rápida.
- Estado: **[CORREGIDO en OP-155]** — fichero reubicado a `tests/integration/compute-status.test.ts`.

**H-150-06** (G-02) — Flakiness potencial en `today()` sin mock de reloj
- Origen: OP-151
- Fichero: `tests/unit/dates.test.ts`
- Descripción: El test "returns today's date (same calendar day)" compara el resultado de `today()` con `new Date()`. Si el test corre exactamente a medianoche UTC, los valores pueden diferir en un día.
- Estado: **[CORREGIDO en OP-155]** — se añadió comentario explícito sobre el riesgo y se verificó que las dos llamadas a `new Date()` (dentro del test y dentro de `today()`) son suficientemente atómicas en la práctica; como solución más robusta se verifican solo las propiedades estructurales (UTC midnight) y no la fecha concreta.

**H-150-07** (G-03) — Casos borde no cubiertos en `isSameDay`
- Origen: OP-151
- Fichero: `tests/unit/dates.test.ts`
- Descripción: Faltaban tests para `Date` inválida (NaN) y para fechas al límite de medianoche UTC (`23:59:59.999Z` vs `00:00:00.000Z` del día siguiente).
- Estado: **[CORREGIDO en OP-155]** — añadidos ambos casos.

**H-150-08** (G-09) — Mismo usuario re-reservando la misma mesa tras cancelar no cubierto
- Origen: OP-152
- Fichero: `tests/integration/reservation-repository.test.ts`
- Descripción: Los tests de índice parcial no cubrían el caso `cancelar(user1, mesa1, date)` → `insertar(user1, mesa1, date)`. Solo cubrían re-reserva con usuario distinto o mesa distinta.
- Estado: **[CORREGIDO en OP-155]** — añadido test de re-reserva mismo usuario misma mesa.

**H-150-09** (G-10) — Rango invertido (`start > end`) sin comportamiento definido
- Origen: OP-152
- Fichero: `tests/integration/reservation-repository.test.ts`, `tests/integration/availability-service.test.ts`
- Descripción: `getReservationsByDateRange` y `getTableAvailabilityForRange` no tenían tests para rango invertido. El comportamiento real (array vacío vs. lanza) no estaba documentado ni verificado.
- Estado: **[CORREGIDO en OP-155]** — añadidos tests que documentan el comportamiento observado.

**H-150-10** (G-11) — Limitación de concurrencia simulada no documentada
- Origen: OP-152
- Fichero: `tests/integration/concurrency.test.ts`
- Descripción: Los tests de carrera usan `Promise.allSettled` en el mismo event loop con una sola conexión a `mongodb-memory-server`. No reproducen concurrencia real multi-proceso. Esta limitación no estaba documentada y el estado final en BD no se verificaba.
- Estado: **[CORREGIDO en OP-155]** — añadido comentario JSDoc con la limitación y tests que verifican el estado final en BD (exactamente 1 reserva `confirmed` tras la carrera).

**H-150-11** (G-13) — Cuerpos de respuesta de error no verificados en tests de API
- Origen: OP-153
- Fichero: `tests/api/reservations-create.test.ts`, `tests/api/availability.test.ts`, `tests/api/reservations-read.test.ts`
- Descripción: Los tests de error 4xx verificaban el status code pero no el campo `error` del body. Un handler que devolviera `{ message: "..." }` en lugar de `{ error: "..." }` pasaría todos los tests.
- Estado: **[CORREGIDO en OP-155]** — añadidas assertions `expect(body.error).toBeDefined()` en los tests de error más críticos (409 de reservas, 400 de disponibilidad).

**H-150-12** (G-17) — Admin cancelando reserva ya cancelada no cubierto en API
- Origen: OP-153
- Fichero: `tests/api/reservations-cancel.test.ts`
- Descripción: El fichero solo cubría que el propietario no puede cancelar dos veces, pero no que un admin tampoco puede. La lógica de autorización y la de validación de estado son independientes.
- Estado: **[CORREGIDO en OP-155]** — añadido test de admin cancelando reserva ya cancelada → 400.

**H-150-13** (G-18) — Filtración de email y nombre del propietario en respuesta 403 no verificada
- Origen: OP-153
- Fichero: `tests/api/auth-security.test.ts`
- Descripción: El test de "user cannot cancel another user's reservation" solo verificaba que `body.error` no contiene el `_id` del propietario, pero no su email ni nombre.
- Estado: **[CORREGIDO en OP-155]** — añadidas verificaciones `not.toContain(owner.email)` y `not.toContain(owner.name)`.

### Mejoras (6)

**H-150-14** (G-04) — Strings con espacios no verificados en `isValidDateString`
- Origen: OP-151
- Fichero: `tests/unit/dates.test.ts`
- Descripción: No había tests para strings con espacios al inicio o al final. Casos realistas en inputs de query params web.
- Estado: **[CORREGIDO en OP-155]** — añadidos tests `" 2026-03-19"` y `"2026-03-19 "`.

**H-150-15** (G-05) — Invariantes estructurales de `getWeekRange` no verificadas
- Origen: OP-151
- Fichero: `tests/unit/dates.test.ts`
- Descripción: Los tests verificaban ejemplos concretos pero no propiedades estructurales: `end - start === 4 días` y `start ≤ end` para cualquier entrada.
- Estado: **[CORREGIDO en OP-155]** — añadidos tests de propiedad estructural y de entrada inválida.

**H-150-16** (G-07) — `resetCounters()` no invocado en ningún hook
- Origen: OP-152
- Fichero: `tests/setup.ts`, `tests/helpers/factories.ts`
- Descripción: Los contadores de factories crecen entre tests, dificultando el diagnóstico de fallos. `resetCounters()` estaba exportado pero sin usar.
- Estado: **[CORREGIDO en OP-155]** — añadida llamada a `resetCounters()` en `afterEach` de `setup.ts`.

**H-150-17** (G-15) — Assertion débil sobre objeto `reservation` en respuesta de disponibilidad
- Origen: OP-153
- Fichero: `tests/api/availability.test.ts`
- Descripción: `expect(body[0].reservation).toBeDefined()` no verifica la estructura del objeto.
- Estado: **[CORREGIDO en OP-155]** — reforzado con `toMatchObject({ _id: expect.any(String), userId: expect.any(String), userName: "Test User" })`.

**H-150-18** (G-16) — `Content-Type` de respuestas no verificado
- Origen: OP-153
- Fichero: `tests/api/` (todos los ficheros)
- Descripción: Ningún test verificaba que las respuestas incluyen `Content-Type: application/json`.
- Estado: **[DEUDA TÉCNICA]** — coste de añadir la verificación en todos los tests es alto y el beneficio real es bajo en el contexto de invocación directa de handlers (donde Next.js garantiza el header). Se documenta como mejora baja prioridad para OP-160 o una fase posterior.

**H-150-19** (G-19) — Limitación estructural de tests de API no documentada
- Origen: OP-153
- Fichero: `tests/api/` (todos los ficheros)
- Descripción: Los handlers se invocan directamente sin servidor HTTP. No se ejercita el middleware de Next.js, CORS ni lógica del runtime de Vercel.
- Estado: **[CORREGIDO en OP-155]** — añadido comentario JSDoc en `auth-security.test.ts` (fichero transversal de la suite de API) documentando la limitación.

## Candidatos revisados sin hallazgo

Los siguientes puntos fueron examinados durante la auditoría y no generaron hallazgo:

| Candidato | Resultado | Justificación |
|---|---|---|
| `afterEach` de `setup.ts` corriendo para tests unitarios sin BD | Sin hallazgo | El guard `readyState === 1` evita el intento de limpieza si Mongoose no está conectado. Sin overhead real. |
| `vi.restoreAllMocks()` en `beforeEach` de tests de API — ¿restaura correctamente? | Sin hallazgo | `vi.mock()` a nivel de módulo mantiene el mock del módulo, pero `vi.restoreAllMocks()` restaura la implementación de cada `vi.fn()`. El patrón es correcto: el módulo sigue mockeado pero la función vuelve a su implementación base (que lanza si se llama sin configurar). |
| Tests de concurrencia con `maxConcurrency: 1` en vitest.config — ¿son relevantes? | Sin hallazgo | `maxConcurrency: 1` controla la concurrencia de ficheros de test entre sí, no la concurrencia dentro de un test. `Promise.allSettled` dentro de un test sigue siendo efectivo para el propósito de verificar el índice único. |
| `mockSession` con `email: "test@example.com"` por defecto — ¿causa falsos positivos? | Sin hallazgo | Ningún test de los ficheros auditados depende de que el email de la sesión coincida con el del usuario creado en BD. El email de la sesión es irrelevante para las operaciones verificadas. |

## Criterios de aceptación
- AC-1: `.ai/reports/OP-150-findings.md` creado con estructura completa: cabecera, secciones por subtarea, resumen ejecutivo y hallazgos H-150-01 a H-150-19
- AC-2: Los 4 hallazgos críticos marcados como `[CORREGIDO en OP-155]` con descripción de la corrección aplicada
- AC-3: Los 9 hallazgos importantes marcados con estado (corregido o deuda técnica) y justificación
- AC-4: Los 6 hallazgos de mejora marcados con estado y justificación para los no corregidos
- AC-5: Tabla de candidatos revisados sin hallazgo con justificación
- AC-6: Resumen ejecutivo con totales por severidad y estado (corregido vs. deuda técnica)

## Criterio de done
- Todos los AC en PASS
- `.ai/reports/OP-150-findings.md` creado y coherente con lo ejecutado en OP-151 a OP-155
- Sin modificaciones al código fuente ni a los tests
- Spec actualizada con ## Execution Result

## Execution Result

- Fecha de implementación: 2026-05-07 (CET)
- Rama: feature/OP-150-auditoria-tests
- Commit: 332860a
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — `.ai/reports/OP-150-findings.md` reescrito con estructura completa: cabecera, secciones por subtarea (OP-151, OP-152, OP-153), hallazgos H-150-01 a H-150-19, resumen ejecutivo y candidatos sin hallazgo
  - AC-2: PASS — Los 4 hallazgos críticos (H-150-01, H-150-02, H-150-03, H-150-04) marcados como `[CORREGIDO en OP-155]` con descripción de la corrección aplicada
  - AC-3: PASS — Los 9 hallazgos importantes (H-150-05 a H-150-13) marcados como `[CORREGIDO en OP-155]` con justificación
  - AC-4: PASS — Los 6 hallazgos de mejora (H-150-14 a H-150-19) marcados: 5 como `[CORREGIDO en OP-155]` y 1 como `[DEUDA TÉCNICA]` (H-150-18) con justificación de baja prioridad
  - AC-5: PASS — Tabla de 6 candidatos revisados sin hallazgo con justificación detallada
  - AC-6: PASS — Resumen ejecutivo con totales por severidad (4 críticos, 9 importantes, 6 mejoras) y estado (18 corregidos, 1 deuda técnica)
- Ficheros creados o modificados:
  - `.ai/reports/OP-150-findings.md` — reescrito completamente con formato oficial siguiendo OP-140-findings.md
- verify:
  - Comando ejecutado: N/A — tarea exclusivamente de documentación, sin modificaciones a código ni tests
  - Resultado: PASS — sin modificaciones al código fuente ni a los tests
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: redacción completa del informe consolidado a partir de los hallazgos documentados en OP-151 a OP-154 y el estado de correcciones de OP-155
- Decisiones técnicas:
  - El informe existente tenía formato de auditoría incremental (hallazgos por subtarea en formato de tabla); se reescribió siguiendo el formato OP-140 con bloque por hallazgo, severidad, riesgo y propuesta explícita
  - H-150-18 (`Content-Type` no verificado) mantenido como deuda técnica: en el contexto de invocación directa de handlers sin servidor HTTP, el beneficio es marginal vs. el coste de añadir la assertion en decenas de tests
  - Se añadió un candidato sin hallazgo adicional respecto a la spec (race condition en `getMongoClient()`) que surgió de la revisión del OP-140 y era relevante documentar para coherencia entre auditorías
