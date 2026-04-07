# OP-120 — Informe de hallazgos: repositorios y servicios

## Resumen ejecutivo

> **Estado**: en construcción — se irá completando a medida que se ejecuten OP-121 a OP-126.

Auditoría en curso de la capa de repositorios y servicios. Los hallazgos se consolidan aquí desde cada subtarea. Al cierre de OP-126 se completará el resumen ejecutivo definitivo.

---

## Hallazgos por fichero

### reservation.repository.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-121-1 | Mejora | `insertReservation` recibe `date: Date` pero no llama a `normalizeDate` internamente. Si el caller pasa una fecha sin normalizar, se persiste con hora distinta de UTC midnight y los filtros por fecha fallarán silenciosamente. | Llamar a `normalizeDate(date)` al inicio de `insertReservation`, igual que hacen las funciones de lectura. |
| H-121-2 | Mejora | `markReservationCancelled` usa `{ returnDocument: "after" }` en el tercer argumento de `findByIdAndUpdate`. Esta opción es sintaxis del MongoDB driver nativo; Mongoose utiliza `{ new: true }`. En versiones actuales de Mongoose, `returnDocument: "after"` puede no tener efecto, devolviendo el documento original en lugar del actualizado. | Reemplazar `{ returnDocument: "after" }` por `{ new: true }` para garantizar que se devuelve el documento actualizado. |
| H-121-3 | Observación | `getReservationById` no filtra por `status: "confirmed"`. Esto es correcto y necesario para que el servicio de cancelación pueda recuperar reservas antes de modificarlas. Sin embargo, el JSDoc dice "any status" sin explicar por qué. | Añadir en el JSDoc una nota explícita: "Returns reservation regardless of status — required for cancellation flow". |
| H-121-4 | Observación | `getUserReservationByDate` y `getTableReservationByDate` aceptan `userId: string` y `tableId: string` respectivamente, sin validar que sean ObjectId válidos. Un string mal formado produce un query que devuelve `null` sin error, lo que puede confundirse con "sin reserva". | Añadir validación de formato ObjectId en el servicio (no en el repositorio, para respetar separación de responsabilidades). Documentar este comportamiento en el JSDoc del repositorio. |
| H-121-5 | Observación | `insertReservation` usa `doc.toObject() as IReservation` en lugar de `.lean()`. Es correcto porque `Reservation.create()` no admite `.lean()` directamente, pero el cast `as IReservation` puede ocultar divergencias entre el documento Mongoose y la interfaz TypeScript. | Verificar en OP-162 que `IReservation` cubre todos los campos que `toObject()` puede devolver (incluyendo `__v`). Si `__v` no está tipado, considerar suprimirlo o incluirlo en la interfaz. |

**Resultado AC OP-121:**
| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | Todas las funciones de lectura filtran `status: "confirmed"`. `getReservationById` no filtra — correcto y justificado. |
| AC-2 | PASS | `.lean()` consistente en todas las queries de lectura. `insertReservation` usa `.toObject()` — correcto por limitación de Mongoose. |
| AC-3 | PASS | `await connectDB()` presente en todas las funciones. |
| AC-4 | PASS | El repositorio no contiene lógica de negocio ni validaciones de dominio. |
| AC-5 | PASS con observación | Tipado correcto. El cast `as IReservation` en `insertReservation` puede ocultar divergencias (ver H-121-5). |
| AC-6 | PASS | Hallazgos registrados con severidad. |

---

### table.repository.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-122-1 | Observación | `getTableById` no filtra por `isActive`. En `reservation.service.createReservation`, el caller comprueba explícitamente `!table.isActive` tras la llamada, lo que es correcto. Sin embargo, esta decisión no está documentada y puede sorprender a futuros callers. | Añadir en el JSDoc de `getTableById` una nota: "Returns inactive tables too — callers are responsible for checking isActive if needed". |
| H-122-2 | Observación | `table.repository` carece de operaciones de escritura (insert, update, deactivate). Actualmente no existe panel admin, pero la Fase 2-3 lo requiere. La ausencia es correcta para la fase actual pero introduce deuda previsible. | Registrar para OP-162: evaluar si añadir operaciones de escritura básicas (p.ej. `updateTable`, `deactivateTable`) antes de implementar el panel admin (Fase 3). |
| H-122-3 | Observación | No existen `getTablesByType(type)` ni `getTablesByAssignedUser(userId)`. `availability.service` obtiene todas las mesas activas y filtra en memoria. Para el volumen de mesas esperado esto es aceptable, pero limitante si en Fase 3 se necesitan queries específicas. | Sin acción inmediata. Documentar como deuda para Fase 3. |

**Resultado AC OP-122 — table.repository.ts:**
| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | `listActiveTables` filtra correctamente por `{ isActive: true }`. `getTableById` no filtra — correcto, caller lo verifica. |
| AC-3 | PASS | Sin lógica de negocio. |
| AC-4 | PASS con observación | Operaciones de escritura y queries por tipo/usuario asignado ausentes — correctas para fase actual, deuda para Fase 3. |
| AC-5 | PASS | `.lean()` y `await connectDB()` presentes en ambas funciones. |
| AC-6 | PASS | Hallazgos registrados con severidad. |

---

### user.repository.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-122-4 | Mejora | `getUserByEmail` llama a `email.toLowerCase()` antes de la query, pero el schema de Mongoose ya tiene `lowercase: true` en el campo `email`. La normalización es doble y redundante. No es incorrecta, pero si en el futuro se cambia el schema, podría quedar código defensivo innecesario o confuso. | Eliminar `email.toLowerCase()` en `getUserByEmail` y confiar en el schema. Alternativamente, mantenerlo y añadir un comentario explicando que es defensa extra por si el schema cambia. Documentar la decisión en el JSDoc. |
| H-122-5 | Observación | `getUserById` no filtra por `isActive`. `availability.service` lo usa para resolver nombres de usuarios en reservas históricas — incluir usuarios inactivos es correcto en ese contexto. Sin embargo, un caller futuro podría asumir que solo devuelve usuarios activos. | Añadir en el JSDoc de `getUserById` una nota: "Returns inactive users too — callers are responsible for checking isActive if needed". |
| H-122-6 | Observación | `user.repository` carece de `listAllUsers()` (todos los usuarios, activos e inactivos, para admin) y operaciones de escritura (crear usuario, editar nombre/rol, desactivar). Necesarios para el panel admin de Fase 3. | Registrar para OP-162: evaluar si añadir `listAllUsers()` y operaciones básicas de escritura antes de implementar el panel admin. |

**Resultado AC OP-122 — user.repository.ts:**
| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | `listActiveUsers` filtra correctamente por `{ isActive: true }`. `getUserById` no filtra — justificado por el uso en resolución de nombres históricos. |
| AC-2 | PASS con mejora | `getUserByEmail` normaliza con `.toLowerCase()` + schema `lowercase: true` — doble normalización redundante (ver H-122-4). |
| AC-3 | PASS | Sin lógica de negocio. |
| AC-4 | PASS con observación | `listAllUsers()` y operaciones de escritura ausentes — correctas para fase actual, deuda para Fase 3. |
| AC-5 | PASS | `.lean()` y `await connectDB()` presentes en todas las funciones. |
| AC-6 | PASS | Hallazgos registrados con severidad. |

---

### reservation.service.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-123-1 | Observación | `createReservation` no valida que `userId` y `tableId` sean ObjectId válidos antes de pasarlos al repositorio. Un string mal formado en `getUserReservationByDate` o `getTableReservationByDate` retorna `null` sin error, comportándose como "sin reserva" y permitiendo intentar el insert, que sí fallará con un CastError de Mongoose. El fallo es correctamente propagado (re-throw), pero el mensaje de error es críptico para el API layer. | Añadir validación de formato ObjectId para `userId` y `tableId` al inicio de `createReservation`. Retornar `{ ok: false, code: "validation" }` con mensaje claro. Coordinado con H-121-4. |
| H-123-2 | Observación | `getDuplicateKeyMessage` detecta el conflicto usando `message.includes("userId")` y `message.includes("tableId")`. El mensaje de error de MongoDB incluye el nombre del índice o del campo, que es fiable en versiones actuales, pero puede variar si el nombre del índice es personalizado o si el driver cambia su formato de mensaje en una versión futura. | Añadir un comentario explicando la dependencia del formato del mensaje de MongoDB. En OP-162 considerar si los índices tienen nombres explícitos que se puedan usar como alternativa más robusta. |
| H-123-3 | Observación | `cancelReservation` recibe `userRole: UserRole`, que está tipado como `"user" \| "admin"`. TypeScript garantiza que solo esos valores llegan en tiempo de compilación, pero en tiempo de ejecución (datos de sesión vía NextAuth) un rol desconocido simplemente haría que `isAdmin === false`, no causaría error. El comportamiento es seguro (falla cerrado), pero silencioso. | Sin acción urgente. Documentar en el JSDoc que un rol desconocido es tratado como no-admin. Si en fases futuras se añaden más roles, revisar esta lógica. |
| H-123-4 | Observación | `toPublic` incluye `userId` en la respuesta pública, lo que expone el ID interno del usuario que hizo la reserva a cualquier cliente que llame al endpoint. En el contexto actual (aplicación interna, usuarios autenticados) no es una vulnerabilidad grave, pero sí una filtración de datos innecesaria si el cliente no necesita ese campo para las vistas de disponibilidad. | Evaluar en OP-162 si `userId` debe omitirse de `ReservationPublic` o si hay vistas que lo necesiten. `ReservationPublic` ya tiene `userName?: string` como alternativa más user-friendly. |
| H-123-5 | Observación | Las funciones de lectura `getReservationsForDay` y `getReservationsForRange` delegan completamente en el repositorio y mapean con `toPublic`. No filtran por `status: "confirmed"` explícitamente — confían en que el repositorio ya lo hace. Esta confianza es correcta (verificado en OP-121), pero está implícita. | Añadir en el JSDoc de las funciones de lectura del servicio una nota: "Returns only confirmed reservations — filtering is performed at repository level". |

**Resultado AC OP-123:**
| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | Orden de validaciones correcto: fecha → mesa existe → isActive → tipo blocked → tipo fixed → usuario sin reserva → mesa sin reserva → insert. |
| AC-2 | PASS | E11000 capturado correctamente con `isDuplicateKeyError`. `getDuplicateKeyMessage` distingue conflicto usuario vs mesa. Ver H-123-2 para limitación de robustez. |
| AC-3 | PASS | `cancelReservation` verifica existencia → estado previo → autorización en ese orden. Correcto y seguro. |
| AC-4 | PASS | `toPublic` serializa correctamente: `_id`, `userId`, `tableId` como strings; `date` como YYYY-MM-DD via `toISOString().split("T")[0]`. |
| AC-5 | PASS con observación | `isDuplicateKeyError` robusto (type narrowing correcto sobre `unknown`). `getDuplicateKeyMessage` funcional pero con dependencia implícita del formato del mensaje de MongoDB (ver H-123-2). |
| AC-6 | PASS | El servicio no accede directamente a MongoDB. Toda interacción con la base de datos es a través de funciones de `@/lib/db`. |
| AC-7 | PASS | Hallazgos registrados con severidad. |

---

### availability.service.ts

> Pendiente — OP-124

---

### table.service.ts

> Pendiente — OP-125

---

### Documentación JSDoc

> Pendiente — OP-126

---

## Hallazgos bloqueantes

> Se completará al cierre de OP-126.

---

## Mejoras recomendadas

> Se completará al cierre de OP-126.

---

## Observaciones

> Se completará al cierre de OP-126.
