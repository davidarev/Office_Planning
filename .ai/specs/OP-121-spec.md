# OP-121 — Revisar reservation.repository

## Contexto
`src/lib/db/reservation.repository.ts` implementa el acceso a datos de la entidad `Reservation`. Fue creado en las ramas `03-data-model-and-layer-access` y `04-availability-booking-concurrency`. Esta subtarea forma parte de la auditoría OP-120 y no implica cambios en el código.

## Objetivo
Verificar que las funciones del repositorio son correctas, completas, usan `.lean()` de forma consistente, filtran siempre por `status: "confirmed"` donde corresponde, manejan adecuadamente el error `E11000` y no contienen lógica de negocio.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-127 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Funciones a revisar
- `getReservationsByDate(date)` — filtro `status: "confirmed"`, normalización de fecha, `.lean()`
- `getReservationsByDateRange(start, end)` — filtro confirmed, rango `$gte/$lte`, `.sort({ date: 1 })`, `.lean()`
- `getUserReservationByDate(userId, date)` — filtro confirmed, `.lean()`
- `getTableReservationByDate(tableId, date)` — filtro confirmed, `.lean()`
- `getReservationById(id)` — recupera cualquier estado (no filtra confirmed) — verificar si es correcto
- `insertReservation(userId, tableId, date)` — crea con `status: "confirmed"`, normalización de fecha, devuelve con `.toObject()`
- `markReservationCancelled(id)` — usa `findByIdAndUpdate` con `{ returnDocument: "after" }`, `.lean()`

### Aspectos transversales
- Uso consistente de `await connectDB()` en todas las funciones
- Uso de `.lean()` para mejorar rendimiento (devuelve POJOs en vez de documentos Mongoose)
- Ausencia de lógica de negocio en el repositorio
- Tipado correcto de retornos (`IReservation`, `IReservation | null`, `IReservation[]`)
- Importaciones correctas desde `@/lib/models` y `@/domain/types`

### Manejo de errores E11000
- `insertReservation` no captura el error — lo deja propagar para que el servicio lo maneje
- Verificar que este diseño es explícito e intencional (documentado en JSDoc)

## Casos límite
- `getReservationById` no filtra por `status: "confirmed"` — ¿es correcto para la cancelación?
- `insertReservation` recibe `date: Date` ya normalizada, pero no valida que sea un `Date` válido
- `markReservationCancelled` acepta `string | Types.ObjectId` — verificar coherencia con los callers
- `returnDocument: "after"` vs `new: true` (diferencia entre drivers) — verificar que funciona correctamente con Mongoose

## Criterios de aceptación
- AC-1: Verificar que todas las funciones de lectura filtran por `status: "confirmed"` donde corresponde y documentar las excepciones justificadas
- AC-2: Verificar uso consistente de `.lean()` en todas las queries de lectura
- AC-3: Verificar que `await connectDB()` está presente en todas las funciones
- AC-4: Verificar que el repositorio no contiene lógica de negocio (validaciones de dominio, reglas de reserva)
- AC-5: Verificar que el tipado de retornos es correcto y coherente con `IReservation`
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-127
- Sin modificaciones al código fuente
