# OP-155 — Corregir tests frágiles o incompletos

## Contexto
La auditoría OP-151 a OP-154 identificó 19 gaps de cobertura clasificados por severidad. Esta subtarea aplica las correcciones sobre los tests existentes: añade casos que faltan, refuerza assertions débiles, reubica tests mal clasificados y documenta limitaciones estructurales.

El stack de testing es Vitest + mongodb-memory-server. Los tests corren en serie (`maxConcurrency: 1`, `pool: "forks"`). El setup global (`tests/setup.ts`) limpia todas las colecciones en `afterEach`. Los contadores de factories (`userCounter`, `tableCounter`) no se resetean entre tests — `resetCounters()` está exportado pero no se invoca en ningún hook.

Se trabaja sobre la rama `feature/OP-150-auditoria-tests`. Esta subtarea sí modifica tests.

## Objetivo
Corregir todos los gaps de severidad crítica e importante identificados en OP-154. Los gaps de mejora se corrigen si el coste es bajo; si no, se documentan como deuda técnica en OP-156.

## Restricciones
- No modificar código de producción — solo ficheros bajo `tests/`
- No cambiar el comportamiento esperado del sistema — solo mejorar la calidad de los tests
- Mantener todos los tests existentes en verde tras cada cambio
- No introducir dependencias nuevas de testing
- Preservar la estructura de `describe` existente; añadir casos dentro de los bloques existentes o en nuevos `describe` al final del fichero

## Gaps a corregir por fichero

### `tests/unit/compute-status.test.ts` → reubicar a `tests/integration/`

**Gap G-01** (Importante): El fichero usa `mongodb-memory-server` y helpers de BD. Debe moverse a `tests/integration/compute-status.test.ts`. El nombre del fichero y los `describe` no cambian; solo cambia la ubicación.

**Gap G-06** (Crítico): Los tests acceden a `result[0]` sin verificar que el array tiene exactamente un elemento. Añadir `expect(result).toHaveLength(1)` antes de cada acceso a `result[0]` en los casos donde se crea exactamente una mesa activa.

### `tests/unit/dates.test.ts`

**Gap G-02** (Importante): El test de `today()` compara contra `new Date()` sin mock de reloj. Reescribir para verificar solo propiedades estructurales (UTC midnight) sin asumir la fecha concreta del sistema — el test existente ya lo hace parcialmente; verificar que la segunda aserción (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`) usa `new Date()` del mismo instante y añadir comentario sobre el riesgo de medianoche UTC.

**Gap G-03** (Importante): Añadir en el `describe("isSameDay")`:
- Test: `isSameDay` con `Date` inválida (NaN) lanza en lugar de retornar `false`
- Test: fechas al límite de día (`"2026-03-19T23:59:59.999Z"` vs `"2026-03-20T00:00:00.000Z"`) devuelven `false`

**Gap G-04** (Mejora): Añadir en `describe("isValidDateString")`:
- Test: string con espacio inicial `" 2026-03-19"` → `false`
- Test: string con espacio final `"2026-03-19 "` → `false`

**Gap G-05** (Mejora): Añadir en `describe("getWeekRange")`:
- Test: para cualquier entrada válida, `end.getTime() - start.getTime() === 4 * 24 * 60 * 60 * 1000`
- Test: `start` siempre ≤ `end` (verificar con `start.getTime() <= end.getTime()`)
- Test: entrada de `Date` inválida lanza

### `tests/integration/reservation-repository.test.ts`

**Gap G-08** (Crítico): Añadir un `describe("index verification")` que verifique que la colección de reservas tiene los índices únicos parciales definidos:
```ts
import mongoose from "mongoose";
// Obtener los índices de la colección y verificar que existen
// { tableId: 1, date: 1 } con partialFilterExpression { status: "confirmed" }
// { userId: 1, date: 1 } con partialFilterExpression { status: "confirmed" }
```

**Gap G-09** (Importante): Añadir en `describe("partial unique index behavior")`:
- Test: cancelar reserva de `user1` en `mesa1` y re-reservar el **mismo** `user1` en la **misma** `mesa1` el mismo día → debe tener éxito

**Gap G-10** (Importante): Añadir en `describe("getReservationsByDateRange")`:
- Test: rango invertido (`start > end`) → devuelve array vacío (o documenta si lanza)

### `tests/integration/reservation-service.test.ts`

**Gap G-10** (Importante): Añadir en `describe("getReservationsForDay")` y `describe("getReservationsForRange")`:
- Test: reservas canceladas no aparecen en la respuesta de `getReservationsForDay`
- Test: reservas canceladas no aparecen en la respuesta de `getReservationsForRange`
- Test: campos `_id`, `userId`, `tableId` son strings y `date` es string YYYY-MM-DD en el resultado de `getReservationsForDay`

**Gap G-11** (Importante): Añadir en `concurrency.test.ts` (o en un bloque nuevo al final):
- Comentario JSDoc que documente la limitación: "concurrencia simulada a nivel de event loop, no multi-proceso"
- Test: tras la carrera, verificar en BD que exactamente 1 reserva con `status: "confirmed"` existe para la combinación `{tableId, date}` disputada

### `tests/integration/availability-service.test.ts`

**Gap G-10** (Importante): Añadir en `describe("getTableAvailabilityForRange")`:
- Test: rango invertido → documenta comportamiento esperado

### `tests/setup.ts`

**Gap G-07** (Mejora): Añadir llamada a `resetCounters()` en el `afterEach` existente, después de limpiar las colecciones:
```ts
import { resetCounters } from "./helpers";
// ...
afterEach(async () => {
  // limpiar colecciones...
  resetCounters();
});
```

### `tests/api/reservations-read.test.ts`

**Gap G-12** (Crítico): Añadir en `describe("GET /api/reservations")`:
- Test: crear reserva confirmada + reserva cancelada para el mismo día → `GET` devuelve solo 1 resultado (la confirmada)

Añadir en `describe("GET /api/reservations/week")`:
- Test: reservas canceladas no aparecen en el rango

**Gap G-13** (Importante): Reforzar el test "returns reservations for valid date":
- Añadir assertions sobre `typeof body[0]._id === "string"`, `typeof body[0].userId === "string"`, `typeof body[0].tableId === "string"`, `typeof body[0].date === "string"` y que `body[0].date` cumple formato YYYY-MM-DD

### `tests/api/reservations-create.test.ts`

**Gap G-13** (Importante): Reforzar el test "returns 201 on successful reservation":
- Ya verifica `body._id`, `body.userId`, `body.tableId`, `body.date`, `body.status` — añadir que todos son del tipo correcto (`string`)
- Añadir que `body.userId === user._id.toString()` (ya existe pero confirmar que no puede venir de un campo manipulado del body)

**Gap G-14** (Crítico): Añadir en `describe("POST /api/reservations")`:
- Test: request con `userId` ajeno en el body — la reserva se crea igualmente con el `userId` de la sesión, no con el del body:
```ts
it("ignores userId in body and uses session userId", async () => {
  const user = await createUser();
  const otherUser = await createUser();
  const table = await createTable({ type: "flexible" });
  mockAuthenticated(mockSession({ id: user._id.toString() }));

  const response = await POST(makePostRequest({
    tableId: table._id.toString(),
    date: "2026-04-01",
    userId: otherUser._id.toString(), // campo extra malicioso
  }));
  expect(response.status).toBe(201);
  const body = await response.json();
  expect(body.userId).toBe(user._id.toString());
  expect(body.userId).not.toBe(otherUser._id.toString());
});
```

**Gap G-13**: Añadir en tests de error 4xx que falta verificación de body:
- En "returns 409 when table already reserved": añadir `expect(body.error).toBeDefined()`
- En "returns 409 when user already has reservation that day": añadir `expect(body.error).toBeDefined()`

### `tests/api/reservations-cancel.test.ts`

**Gap G-17** (Importante): Añadir en `describe("DELETE /api/reservations/:id")`:
- Test: admin cancela reserva ya cancelada → `400`

**Gap G-13** (Importante): Reforzar el test "owner can cancel their own reservation (200)":
- Añadir assertions sobre `body._id`, `body.userId`, `body.tableId`, `body.date` además de `body.status`

### `tests/api/availability.test.ts`

**Gap G-15** (Mejora): Reforzar el test "reflects reservation in availability":
- Reemplazar `expect(body[0].reservation).toBeDefined()` por verificación de estructura completa:
```ts
expect(body[0].reservation).toMatchObject({
  _id: expect.any(String),
  userId: expect.any(String),
  userName: "Test User",
});
```

**Gap G-13** (Importante): Añadir en tests de error que verifican solo el status:
- En "returns 400 without date param": añadir `const body = await response.json(); expect(body.error).toBeDefined()`
- En "returns 400 with invalid date": ídem

### `tests/api/auth-security.test.ts`

**Gap G-18** (Importante): Reforzar el test "user cannot cancel another user's reservation":
- Añadir: `expect(JSON.stringify(body)).not.toContain(owner.email)`
- Añadir: `expect(JSON.stringify(body)).not.toContain(owner.name ?? "Test User")`

**Gap G-19** (Mejora): Añadir comentario JSDoc al inicio de `tests/api/` (o en un fichero `tests/api/README.md`) documentando la limitación estructural:
> Los tests de API invocan los handlers de Next.js directamente sin pasar por el servidor HTTP. No se ejercita el middleware de Next.js, cabeceras CORS, ni lógica del runtime de Vercel.

## Casos límite
- Al mover `compute-status.test.ts` a `tests/integration/`, verificar que Vitest lo recoge correctamente con el glob `tests/**/*.test.ts`
- `resetCounters()` en `afterEach` de `setup.ts` debe importarse sin crear dependencia circular con las factories
- El test de verificación de índices (G-08) depende de la API interna de Mongoose (`mongoose.connection.collection("reservations").indexes()`) — verificar que funciona en `mongodb-memory-server`
- El test de `userId` manipulado (G-14) debe ejecutarse con una tabla real en BD para llegar al punto donde el servicio asigna el userId — si la mesa no existe, el 404 se devuelve antes y el test no verifica lo que pretende

## Criterios de aceptación
- AC-1: Los 4 gaps críticos (G-06, G-08, G-12, G-14) corregidos con tests que fallarían si se introduce la regresión correspondiente
- AC-2: Los 9 gaps importantes (G-01, G-02, G-03, G-09, G-10, G-11, G-13, G-17, G-18) corregidos o documentados como deuda técnica justificada
- AC-3: `compute-status.test.ts` reubicado a `tests/integration/` y todos los accesos a `result[0]` protegidos con `expect(result).toHaveLength(1)`
- AC-4: `resetCounters()` invocado en `afterEach` de `setup.ts`
- AC-5: `npm run test` en verde con todos los tests existentes más los nuevos añadidos
- AC-6: Los gaps de mejora no abordados documentados en OP-156 como deuda técnica con justificación

## Criterio de done
- Todos los AC en PASS
- `npm run test` verde (sin regresiones)
- Spec actualizada con ## Execution Result

## Execution Result

**Estado: DONE — 2026-05-07**

### Cambios aplicados

| Gap | Severidad | Fichero(s) modificado(s) | Acción |
|-----|-----------|--------------------------|--------|
| G-01 | Importante | `tests/unit/compute-status.test.ts` → eliminado; `tests/integration/compute-status.test.ts` → creado | Reubicado a integración |
| G-02 | Importante | `tests/unit/dates.test.ts` | Test de `today()` usa `vi.useFakeTimers()` con fecha fija |
| G-03 | Importante | `tests/unit/dates.test.ts` | 3 casos nuevos en `isSameDay`: borde de día, NaN en arg1, NaN en arg2 |
| G-04 | Mejora | `tests/unit/dates.test.ts` | 2 casos nuevos en `isValidDateString`: espacio inicial, espacio final |
| G-05 | Mejora | `tests/unit/dates.test.ts` | 3 casos nuevos en `getWeekRange`: invariante 4 días, `start ≤ end`, Date inválida |
| G-06 | Crítico | `tests/integration/compute-status.test.ts` | `expect(result).toHaveLength(1)` antes de cada `result[0]` en todos los tests |
| G-07 | Mejora | `tests/setup.ts` | `resetCounters()` llamado en `afterEach` |
| G-08 | Crítico | `tests/integration/reservation-repository.test.ts` | 2 tests que verifican existencia de índices parciales en la colección vía `collection.indexes()` |
| G-09 | Importante | `tests/integration/reservation-repository.test.ts` | Test: mismo usuario misma mesa re-reserva tras cancelar |
| G-10 | Importante | `tests/integration/reservation-repository.test.ts`, `tests/integration/availability-service.test.ts`, `tests/integration/reservation-service.test.ts` | Tests de rango invertido y reservas canceladas excluidas |
| G-11 | Importante | `tests/integration/concurrency.test.ts` | Comentario de limitación estructural; `failures.toHaveLength(2)` en three-way race; verificación de estado BD en 2 tests |
| G-12 | Crítico | `tests/api/reservations-read.test.ts` | 2 tests: canceladas excluidas en GET por día y por rango |
| G-13 | Importante | `tests/api/reservations-read.test.ts`, `tests/api/reservations-create.test.ts`, `tests/api/reservations-cancel.test.ts`, `tests/api/availability.test.ts` | Assertions de tipos y `body.error` en errores 4xx |
| G-14 | Crítico | `tests/api/reservations-create.test.ts`, `tests/api/auth-security.test.ts` | 2 tests: `userId` ajeno en body ignorado, `body.userId` es el de la sesión |
| G-15 | Mejora | `tests/api/availability.test.ts` | `toMatchObject` con estructura completa de `reservation` |
| G-17 | Importante | `tests/api/reservations-cancel.test.ts` | Test: admin cancela reserva ya cancelada → 400 |
| G-18 | Importante | `tests/api/auth-security.test.ts` | Email y nombre del propietario no filtrados en respuesta 403 |
| G-19 | Mejora | `tests/api/auth-security.test.ts` | Comentario JSDoc de limitación estructural (sin servidor HTTP) |

### Gaps no abordados (deuda técnica para OP-156)

- **G-16** (Content-Type no verificado): coste bajo pero transversal a todos los endpoints — documentado en OP-156 como mejora pendiente.

### Resultado final

- **Tests antes**: 222 tests en 12 ficheros
- **Tests después**: 242 tests en 13 ficheros (+20 nuevos, +1 fichero reubicado)
- **`npm run test`**: 13 passed, 242 passed — verde sin regresiones
