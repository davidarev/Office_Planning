# OP-120 — Informe de hallazgos: repositorios y servicios

## Resumen ejecutivo

La capa de repositorios y servicios está en buen estado general. El código es correcto funcionalmente, sigue la separación de responsabilidades definida en CLAUDE.md, y cubre los casos críticos de concurrencia mediante índices únicos de MongoDB. La documentación JSDoc es amplia en la mayoría de funciones públicas, aunque hay gaps menores en helpers privados.

**No se han encontrado hallazgos bloqueantes.** Todos los defectos detectados son de severidad Mejora u Observación. Los dos hallazgos de mayor impacto son:

- **H-121-1** (Mejora): `insertReservation` no llama a `normalizeDate`, lo que puede causar fallos silenciosos en los filtros por fecha si el caller no normaliza antes.
- **H-121-2** (Mejora): `markReservationCancelled` usa `returnDocument: "after"` en lugar de `{ new: true }` de Mongoose, lo que puede devolver el documento antes de la actualización.

El resto de hallazgos son observaciones de diseño y deuda técnica gestionable en OP-162.

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

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-124-1 | Mejora | Mesa `fixed` sin `assignedTo`: `computeStatus` devuelve `"red"` (ocupada) pero `assignedUser` es `null`. El plano mostraría una mesa roja sin usuario asignado visible, lo que es semánticamente confuso para el usuario. La combinación `status=red + assignedUser=null + reservation=null` es un estado huérfano sin representación clara en la UI. | En OP-162, evaluar si una mesa `fixed` sin `assignedTo` debe devolver `"gray"` en lugar de `"red"`, o si el modelo debe garantizar que toda mesa fixed tenga `assignedTo`. Añadir validación en la capa de escritura (cuando se implemente el panel admin). |
| H-124-2 | Mejora | `getTableAvailabilityForRange` construye el key del índice con `r.date.toISOString().split("T")[0]`. Si una reserva tiene `date` almacenada sin normalizar (hora distinta de UTC midnight, ver H-121-1), el key no coincide con `dateStr` del cursor (que sí es UTC midnight), dejando esa reserva sin indexar. La mesa aparecería como `"green"` aunque tenga reserva confirmada ese día. | Depende de corregir H-121-1. Si `normalizeDate` se aplica en `insertReservation`, este riesgo desaparece. Documentar la dependencia explícitamente. |
| H-124-3 | Observación | `listActiveTables()` excluye mesas inactivas del resultado. Una mesa con reserva confirmada que se desactiva posteriormente desaparece del plano sin que la reserva se cancele. El usuario que reservó queda con una reserva activa en BD pero sin visibilidad en el plano. | Evaluar en OP-162 (o Fase 2) si desactivar una mesa debe cancelar automáticamente sus reservas futuras, o si las mesas inactivas deben aparecer en el plano con estado `"gray"` cuando tienen reservas asociadas. |
| H-124-4 | Observación | `getTableAvailabilityForRange` no impone límite al rango de fechas. Un rango de un año genera 365 iteraciones, cada una mapeando todas las mesas activas. Para N mesas y M días, el resultado en memoria es N×M objetos. No hay paginación ni límite defensivo. | Sin acción inmediata para el volumen actual. Documentar como deuda. En OP-162 o Fase 2, considerar añadir una validación de rango máximo (ej. 31 días) o paginación por semanas. |
| H-124-5 | Observación | `resolveUserName` es una función exportada (o al menos accesible en el módulo) que llama a `getUserById` individualmente. Si un caller futuro la usa en un loop en lugar de `buildUserNameMap`, introduce N+1 queries sin advertencia. | En OP-162, considerar marcarla como `private` (no exportarla fuera del módulo) o añadir un comentario JSDoc advirtiendo explícitamente: "Do not call in a loop — use buildUserNameMap instead". |

**Resultado AC OP-124:**
| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | `computeStatus` aplica las prioridades en el orden correcto según README.md §6: inactiva → bloqueada → reserva → fixed → preferential → libre. |
| AC-2 | PASS | `buildUserNameMap` recopila todos los userIds en un Set y ejecuta un único `Promise.all` paralelo. Sin N+1. |
| AC-3 | PASS con mejora | El key `tableId:date` es consistente entre el índice y el cursor cuando las fechas están normalizadas. Dependencia de H-121-1 (ver H-124-2). |
| AC-4 | PASS | `cursor.setUTCDate(cursor.getUTCDate() + 1)` avanza correctamente en UTC. Sin bugs de DST. El loop termina en `cursor <= normalizedEnd` correctamente. Rango de un solo día produce el mismo resultado que `getTableAvailabilityForDate`. |
| AC-5 | PASS | Casos límite identificados: mesa fixed sin assignedTo (H-124-1), dependencia de normalización de fechas (H-124-2), mesa desactivada con reserva activa (H-124-3), rango sin límite (H-124-4), resolveUserName sin protección contra N+1 (H-124-5). |
| AC-6 | PASS | Hallazgos registrados con severidad. |

---

### table.service.ts

| ID | Severidad | Descripción | Acción sugerida |
|----|-----------|-------------|-----------------|
| H-125-1 | Observación | `TablePublic` está definida en `table.service.ts`, no en `src/domain/types/`. El dominio ya define `TableAvailability` y `TableWithStatus` en `src/domain/types/table.ts`. `TablePublic` es un tipo de contrato público de la API que, por coherencia, debería vivir junto a los demás tipos de dominio. | En OP-162, mover `TablePublic` a `src/domain/types/table.ts` y exportarla desde `src/domain/types/index.ts`. Actualizar import en `table.service.ts`. |
| H-125-2 | Observación | `TablePublic` incluye `isActive: boolean`, pero `getTablesWithBasicInfo()` delega en `listActiveTables()` que solo devuelve mesas activas. Por tanto, `isActive` siempre será `true` en cualquier respuesta del endpoint `GET /api/tables`. El campo es redundante en este contexto y puede ser confuso para consumidores de la API. | En OP-162, evaluar si omitir `isActive` de `TablePublic` o añadir un comentario JSDoc que explique explícitamente: "Always true in this context — listActiveTables filters inactive tables". Alternativamente, si en Fase 3 el endpoint admin necesita listar mesas inactivas, el campo tendrá utilidad futura. |
| H-125-3 | Observación | `TablePublic` incluye `assignedTo: string \| null` (ID del usuario asignado) pero no su nombre. El cliente que necesite mostrar el nombre del usuario asignado requeriría una segunda llamada. `TableAvailability` en `availability.service` resuelve este problema incluyendo `assignedUser: { _id, name }`. En Fase 2, el plano usará `TableAvailability` en lugar de `TablePublic`, lo que hace que `GET /api/tables` sea un endpoint transitorio cuya utilidad final es limitada. | Sin acción inmediata. Documentar en el JSDoc del endpoint que en Fase 2 el plano usará `TableAvailability`. Evaluar si `GET /api/tables` sigue siendo necesario en Fase 2 o puede eliminarse. |
| H-125-4 | Observación | `TablePublic` y `TableAvailability` comparten campos base (`label`, `type`, `position`) pero tienen estructuras distintas. No hay solapamiento problemático: `TablePublic` es una vista simplificada sin estado de disponibilidad, `TableAvailability` es la vista completa con estado. La separación es semánticamente correcta. No requiere acción. | Sin acción. Documentar en el JSDoc de `TablePublic` la diferencia con `TableAvailability` para claridad futura. |
| H-125-5 | Observación | `getTablesWithBasicInfo()` no incluye ordenación explícita en el servicio. El JSDoc dice "sorted by label" pero `listActiveTables()` del repositorio no aplica ningún `.sort()`. El orden real de los resultados depende del orden de inserción en MongoDB, que no está garantizado. | En OP-162, añadir `.sort({ label: 1 })` en `listActiveTables()` del repositorio, o aplicarlo en `getTablesWithBasicInfo()` antes de retornar. Corregir el JSDoc para reflejar la situación real hasta que se implemente el sort. |

**Resultado AC OP-125:**
| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS | `TablePublic` cubre los campos necesarios para `GET /api/tables`: `_id`, `label`, `type`, `position`, `assignedTo`, `isActive`. El endpoint no necesita estado de disponibilidad en esta fase. |
| AC-2 | PASS | `toPublic` serializa correctamente: `_id` con `.toString()`, `assignedTo` con `?.toString() ?? null`. Todos los campos de `TablePublic` están cubiertos. |
| AC-3 | PASS con observación | `TablePublic` debería moverse a `src/domain/types/` para consistencia con el resto de tipos de dominio (ver H-125-1). No es bloqueante. |
| AC-4 | PASS con observación | `isActive` siempre es `true` en la respuesta actual dado que `listActiveTables()` filtra. El campo es redundante pero no incorrecto (ver H-125-2). |
| AC-5 | PASS con observación | En Fase 2, el plano usará `TableAvailability`. `GET /api/tables` con `TablePublic` es un endpoint transitorio. En Fase 3 se necesitarán operaciones de escritura — el lugar más coherente sería rutas admin separadas que deleguen en `table.repository` directamente o un nuevo `table.admin.service`. |
| AC-6 | PASS | Hallazgos registrados con severidad. |

---

### Documentación JSDoc

| ID | Severidad | Fichero | Descripción | Acción sugerida |
|----|-----------|---------|-------------|-----------------|
| H-126-1 | Mejora | `table.repository.ts` | `getTableById` no documenta que devuelve tablas inactivas (sin filtro `isActive`). Comportamiento diferencial respecto a `listActiveTables` no está explicado. | Añadir nota en JSDoc: "Returns the table regardless of its `isActive` state — callers are responsible for checking isActive if needed". |
| H-126-2 | Observación | `user.repository.ts` | `getUserById` no menciona que devuelve usuarios independientemente de `isActive`. Paralelo a H-126-1. | Añadir nota en JSDoc: "Returns the user regardless of their `isActive` state". |
| H-126-3 | Mejora | `reservation.service.ts` | `isDuplicateKeyError` carece de `@param err` y `@returns boolean`. La descripción es suficiente pero el JSDoc está incompleto. | Añadir `@param err - The unknown error to inspect` y `@returns True if the error is a MongoDB duplicate key error (code 11000)`. |
| H-126-4 | Mejora | `reservation.service.ts` | `getDuplicateKeyMessage` carece de `@param err` y `@returns string`. | Añadir `@param err - The duplicate key error from MongoDB` y `@returns User-friendly conflict message in Spanish`. |
| H-126-5 | Mejora | `reservation.service.ts` | `createReservation` re-lanza errores inesperados con `throw err` pero no tiene `@throws` documentado. Un caller no sabe que puede propagarse una excepción. | Añadir `@throws Re-throws unexpected errors from the database layer`. |
| H-126-6 | Mejora | `availability.service.ts` | `resolveUserName` carece de `@param userId` y `@returns string`. | Añadir `@param userId - The user's ObjectId as a string` y `@returns The user's display name, or "Usuario desconocido" if not found`. |
| H-126-7 | Mejora | `availability.service.ts` | `buildUserNameMap` carece de `@returns`. La descripción explica el propósito anti-N+1 pero no el tipo retornado. | Añadir `@returns Map from userId string to display name`. |

**Resultado AC OP-126:**
| AC | Resultado | Nota |
|----|-----------|------|
| AC-1 | PASS con mejoras | Todas las funciones públicas tienen JSDoc. Helpers privados con gaps menores en `@param`/`@returns` (H-126-3, H-126-4, H-126-6, H-126-7). |
| AC-2 | PASS con mejora | `insertReservation` tiene `@throws` E11000. `createReservation` re-lanza sin `@throws` (H-126-5). |
| AC-3 | PASS | Todas las funciones que devuelven `null` lo indican en `@returns`. |
| AC-4 | PASS | Los 6 módulos tienen bloque `@module` coherente con su contenido. |
| AC-5 | PASS | No se detectó JSDoc que describa comportamiento incorrecto. Todo el JSDoc existente es correcto. |
| AC-6 | PASS | 7 gaps documentados con severidad. |

---

## Hallazgos bloqueantes

Ninguno. La auditoría no ha detectado defectos bloqueantes en la capa de repositorios y servicios.

---

## Mejoras recomendadas

Ordenadas por impacto estimado:

1. **H-121-1** — `insertReservation` sin `normalizeDate`: puede causar fallos silenciosos en filtros por fecha.
2. **H-121-2** — `markReservationCancelled` con `returnDocument: "after"` en lugar de `{ new: true }`: puede devolver el documento sin actualizar.
3. **H-122-4** — `getUserByEmail` con doble normalización (`toLowerCase` + schema `lowercase`): redundancia confusa.
4. **H-125-5** — `getTablesWithBasicInfo` sin `sort`: el JSDoc dice "sorted by label" pero el sort no se aplica actualmente (verificado — `listActiveTables` sí aplica `.sort({ label: 1 })`; hallazgo desactualizado, JSDoc es correcto).
5. **H-126-1** — `getTableById` sin nota sobre tablas inactivas.
6. **H-126-3, H-126-4** — Helpers `isDuplicateKeyError` y `getDuplicateKeyMessage` sin `@param`/`@returns`.
7. **H-126-5** — `createReservation` sin `@throws` para errores inesperados re-lanzados.
8. **H-126-6, H-126-7** — Helpers `resolveUserName` y `buildUserNameMap` sin `@param`/`@returns` completos.

---

## Observaciones

Aspectos de diseño a considerar en fases futuras sin requerir acción inmediata:

- **H-121-3** — `getReservationById` sin nota explícita sobre "any status" (justificado por flujo de cancelación).
- **H-121-4 / H-123-1** — Sin validación de formato ObjectId en repositorios ni en `createReservation`; un string malformado produce `null` silencioso.
- **H-121-5** — Cast `as IReservation` en `insertReservation` puede ocultar divergencias con `__v`.
- **H-122-2 / H-122-3** — Ausencia de operaciones de escritura y queries específicas en `table.repository` (deuda para Fase 3).
- **H-122-5 / H-126-2** — `getUserById` sin nota sobre usuarios inactivos.
- **H-122-6** — Ausencia de `listAllUsers()` y operaciones de escritura en `user.repository` (deuda para Fase 3).
- **H-123-2** — `getDuplicateKeyMessage` con dependencia implícita del formato del mensaje de MongoDB.
- **H-123-3** — `cancelReservation` trata rol desconocido como no-admin silenciosamente (comportamiento seguro pero implícito).
- **H-123-4** — `userId` expuesto en `ReservationPublic`; evaluar si es necesario para las vistas de disponibilidad.
- **H-123-5** — Filtro `status: "confirmed"` implícito en las funciones de lectura del servicio (confía en el repositorio).
- **H-124-1** — Mesa `fixed` sin `assignedTo` produce estado huérfano `red` sin usuario visible.
- **H-124-2** — Dependencia de H-121-1: sin `normalizeDate` en `insertReservation`, el índice de `getTableAvailabilityForRange` puede fallar.
- **H-124-3** — Mesa desactivada con reserva activa queda invisible en el plano sin cancelación automática.
- **H-124-4** — `getTableAvailabilityForRange` sin límite de rango; deuda para Fase 2.
- **H-124-5** — `resolveUserName` sin protección contra N+1 si se usa fuera de `buildUserNameMap`.
- **H-125-1** — `TablePublic` debería moverse a `src/domain/types/` para consistencia.
- **H-125-2** — `isActive` siempre `true` en respuestas de `GET /api/tables`; redundante en contexto actual.
- **H-125-3** — `GET /api/tables` con `TablePublic` es un endpoint transitorio; en Fase 2 el plano usará `TableAvailability`.
- **H-125-4** — `TablePublic` y `TableAvailability` con campos base compartidos: separación semánticamente correcta, sin acción requerida.
