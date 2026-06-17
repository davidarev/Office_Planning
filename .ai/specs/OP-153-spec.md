# OP-153 — Revisar tests de API

## Contexto
El proyecto cuenta con seis ficheros de tests de API en `tests/api/`, todos en verde con Vitest:

- `tables.test.ts` — 4 casos: `GET /api/tables`
- `availability.test.ts` — 13 casos: `GET /api/availability` y `GET /api/availability/week`
- `reservations-create.test.ts` — 14 casos: `POST /api/reservations`
- `reservations-cancel.test.ts` — 6 casos: `DELETE /api/reservations/:id`
- `reservations-read.test.ts` — 10 casos: `GET /api/reservations` y `GET /api/reservations/week`
- `auth-security.test.ts` — 18 casos transversales: auth 401 para todos los endpoints, autorización, inputs inválidos, no-filtración de errores, operaciones repetidas

Los tests invocan los handlers de Next.js directamente (sin servidor HTTP). La autenticación se mockea a través de `vi.mock("@/lib/api-auth")` con los helpers `mockAuthenticated` y `mockUnauthenticated`. La BD usa `mongodb-memory-server` con el mismo setup global de `tests/setup.ts` (limpieza en `afterEach`).

Esta subtarea forma parte de la auditoría OP-150 y no implica cambios en el código.

## Objetivo
Revisar la calidad, exhaustividad y robustez de los tests de API. Identificar gaps en la cobertura de escenarios HTTP (códigos de estado, cuerpos de respuesta, cabeceras), fragilidades en el mecanismo de mock de sesión, assertions débiles sobre el cuerpo de respuesta, y escenarios de seguridad no cubiertos.

## Restricciones
- Solo auditar — no modificar código ni tests
- Los hallazgos se documentan para ser aplicados en OP-155 (corrección) y OP-160 (aplicación)
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Mecanismo de mock de sesión

- El mock de `requireSession` devuelve `{ session, error: null }` o `{ session: null, error: NextResponse }`. ¿Se verifica que `vi.restoreAllMocks()` en `beforeEach` realmente restaura el mock entre tests, o el `vi.mock("@/lib/api-auth")` a nivel de módulo persiste entre `describe`?
- Los tests de `auth-security.test.ts` llaman a `mockUnauthenticated()` en `beforeEach` dentro de un `describe`, pero otros `describe` del mismo fichero llaman a `mockAuthenticated()` dentro de cada `it`. ¿Hay riesgo de que un test olvide configurar el mock y herede el estado del anterior?
- `mockSession` usa `role: "user"` por defecto. ¿Los tests que requieren rol `admin` siempre lo especifican explícitamente? Un test que olvide especificar `role: "admin"` cuando lo necesita pasará de forma incorrecta si la lógica falla antes de llegar a la comprobación de rol.
- `mockSession` hardcodea `email: "test@example.com"` por defecto. ¿Hay tests que dependan de que el email de la sesión coincida con el del usuario creado en BD? Si los hay, el default puede provocar falsos positivos.

### tables.test.ts

- Solo 4 casos para `GET /api/tables`. ¿Se verifica el `Content-Type: application/json` de la respuesta?
- ¿Se cubre el campo `assignedTo` en la respuesta — se expone el ObjectId crudo, el objeto usuario, o no se incluye?
- ¿Se verifica que el endpoint no expone campos sensibles del modelo (e.g. `__v`, campos de Mongoose internos)?
- ¿Se cubre el comportamiento cuando la BD no tiene conexión activa (simulación de error de infraestructura)?

### availability.test.ts

#### GET /api/availability
- El test "reflects reservation in availability" usa `expect(body[0].reservation).toBeDefined()` — assertion débil. ¿Debería verificar la estructura completa del objeto `reservation` (`_id`, `userId`, `userName`)?
- ¿Se cubre el caso de mesa `fixed` en la respuesta — el campo `assignedUser` se incluye con nombre correcto?
- ¿Se cubre el caso de fecha válida sin mesas en BD (respuesta `[]`)?
- ¿Se verifica que el status `400` por fecha inválida incluye un campo `error` en el cuerpo, no solo el código HTTP?

#### GET /api/availability/week
- El test "returns 400 when range exceeds 14 days" verifica que `body.error` contiene `"14"`. ¿Es suficiente para garantizar un mensaje claro al usuario, o debería verificar el mensaje completo?
- ¿Se cubre el comportamiento con `start === end` (rango de un día)?
- ¿Se verifica el `Content-Type` de la respuesta 200?
- ¿Se cubre el caso de `end` con formato inválido (`bad` en `end` pero `start` válido)?

### reservations-create.test.ts

- ¿Se verifica el cuerpo completo de la respuesta 201 — todos los campos (`_id`, `userId`, `tableId`, `date`, `status`) y sus tipos?
- El test "returns 409 when table already reserved" no verifica el cuerpo del error. ¿El endpoint devuelve un campo `error` con mensaje comprensible?
- ¿Se cubre el caso de reserva en mesa `preferential` — debería devolver 201?
- ¿Se cubre el campo `Content-Type: application/json` en la respuesta 201?
- ¿Se verifica que el `userId` en la respuesta corresponde al usuario de la sesión y no a un campo del body que el cliente podría manipular?

### reservations-cancel.test.ts

- Solo 6 casos para `DELETE /api/reservations/:id`. El fichero es correcto en auth y autorización básica, pero:
- ¿Se verifica el cuerpo completo de la respuesta 200 — más allá de `body.status === "cancelled"`, se verifican `_id`, `userId`, `tableId`, `date`?
- ¿Se cubre el caso de un admin que cancela una reserva ya cancelada — debe devolver 400?
- ¿Se verifica que la respuesta 403 no filtra información sobre quién es el propietario de la reserva?

### reservations-read.test.ts

#### GET /api/reservations
- El test "returns reservations for valid date" verifica `body[0].date` y `body[0].status`, pero no verifica que `_id`, `userId`, `tableId` sean strings (no ObjectIds de Mongoose).
- ¿Se cubre que las reservas canceladas **no** aparecen en la respuesta?
- ¿Se verifica el orden de los resultados cuando hay múltiples reservas para el mismo día?

#### GET /api/reservations/week
- El test "returns reservations for valid range" solo verifica `body.length === 1`. ¿Se verifica la estructura del array — cada elemento tiene `date` como string YYYY-MM-DD?
- ¿Se cubre el caso de rango con reservas canceladas — no deben aparecer?
- ¿Se cubre `start === end` (rango de un día)?

### auth-security.test.ts

- El describe "all endpoints return 401 without session" cubre todos los endpoints conocidos. ¿Se verifica que cada respuesta 401 incluye el campo `error: "No autorizado"` además del código HTTP?
- El test "user cannot cancel another user's reservation" verifica que `body.error` no contiene el `_id` del propietario. ¿Se verifica también que no contiene el email del propietario?
- El describe "invalid input edge cases" cubre inputs maliciosos (SQL injection, XSS, long string, numeric). ¿Se cubre el caso de body con un ObjectId válido pero que apunta a una mesa de otro contexto (IDOR)?
- ¿Se cubre el caso de un usuario que intenta crear una reserva con el `userId` de otro usuario en el body — el endpoint debe ignorar el `userId` del body y usar el de la sesión?
- ¿Se verifica que los endpoints de lectura (`GET /api/reservations`, `GET /api/availability`) no filtran datos en función del usuario autenticado, sino que devuelven datos globales (comportamiento esperado según el diseño del sistema)?

### Cobertura de Content-Type y cabeceras

- Ningún test verifica `Content-Type: application/json` en las respuestas. Si el handler lanzara un error no capturado y Next.js devolviera HTML, los tests seguirían pasando al verificar solo el status code.
- ¿Se verifica que las respuestas de error no incluyen cabeceras de cache que puedan almacenar la respuesta erróneamente?

## Casos límite
- Mock de sesión no restaurado entre tests: si `vi.restoreAllMocks()` falla silenciosamente, un test puede heredar el estado de autenticación del anterior, produciendo falsos positivos
- Invocación directa de handlers sin servidor HTTP: no ejercita middleware de Next.js (CORS, headers globales, rate limiting si existiera) — limitación estructural de la suite que debe documentarse
- Tests de seguridad que no verifican el body de error: un `status: 400` sin `{ error: "..." }` correcto en el body no es suficiente para garantizar una buena UX ni ausencia de filtración de datos

## Criterios de aceptación
- AC-1: Verificar que el mecanismo de mock de sesión (`vi.mock` + `vi.restoreAllMocks`) garantiza aislamiento entre tests y que ningún `describe` puede heredar el estado de auth de otro
- AC-2: Verificar que los tests de respuesta exitosa (`201`, `200`) verifican la estructura completa del body y los tipos de los campos, no solo el status code o campos individuales
- AC-3: Verificar que los tests de error (`400`, `403`, `404`, `409`) verifican el campo `error` en el body además del código HTTP
- AC-4: Verificar que `auth-security.test.ts` cubre el escenario de `userId` manipulado en el body de `POST /api/reservations`, y que la respuesta 403 no filtra email ni ID del propietario
- AC-5: Verificar que se documenta la limitación estructural de los tests (invocación directa de handlers, sin middleware de Next.js ni servidor HTTP real)
- AC-6: Documentar gaps de cobertura, assertions débiles y riesgos de aislamiento encontrados, con severidad, para consolidar en OP-154 y OP-155

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en `.ai/reports/OP-150-findings.md`
- Sin modificaciones al código fuente ni a los tests
- Spec actualizada con ## Execution Result

## Execution Result

**Estado: DONE — 2026-05-07**

### AC-1 — PASS
El mecanismo de mock funciona correctamente: `vi.mock("@/lib/api-auth")` a nivel de módulo + `vi.restoreAllMocks()` en cada `beforeEach` garantiza aislamiento entre tests. Los `describe` que requieren `role: "admin"` lo especifican explícitamente. No hay riesgo de herencia de estado entre `describe`.

### AC-2 — FAIL parcial
La respuesta 201 de `POST /api/reservations` sí verifica todos los campos y tipos. Las respuestas exitosas de `DELETE` solo verifican `body.status === "cancelled"`, faltando `_id`, `userId`, `tableId`, `date` (A-019, MEDIUM). `GET /api/reservations` no verifica que los campos sean strings serialized (A-023, MEDIUM).

### AC-3 — FAIL
Los tests de error `400` y `409` de `reservations-create.test.ts` no verifican el campo `error` en el body (A-016, A-017). Los `400` de `availability.test.ts` tampoco (A-009). Los `401` del describe de seguridad solo verifican status code, no el body (A-027, MEDIUM). Solo un subconjunto de los tests de error valida el body del mensaje.

### AC-4 — FAIL
No existe ningún test que envíe un `userId` ajeno en el body de `POST /api/reservations` para confirmar que es ignorado — escenario IDOR no cubierto (A-029, HIGH). El test "user cannot cancel another user's reservation" no verifica ausencia del email del propietario en el error (A-028, MEDIUM).

### AC-5 — FAIL
Ningún test ni comentario documenta la limitación estructural: los tests invocan handlers directamente sin servidor HTTP, sin middleware de Next.js, sin CORS ni rate limiting (A-030, MEDIUM). Esta limitación debería estar documentada en los tests o en un fichero de contexto de la suite.

### AC-6 — PASS
27 hallazgos documentados en `.ai/reports/OP-150-findings.md` con severidad: 2 HIGH, 15 MEDIUM, 10 LOW, 4 INFO.

**Hallazgos HIGH:**
- A-015: el test de `POST /api/reservations` confirma implícitamente que se usa el `userId` de la sesión, pero no hay test explícito que envíe un `userId` distinto en el body para verificar que es ignorado
- A-029: escenario IDOR directo en `POST /api/reservations` no cubierto en `auth-security.test.ts`

**Sin modificaciones al código fuente ni a los tests.**
