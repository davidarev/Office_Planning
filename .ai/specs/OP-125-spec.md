# OP-125 — Revisar table.service

## Contexto
`src/services/table.service.ts` implementa la capa de servicio para la entidad `Table`. En la fase actual, expone únicamente operaciones de lectura (sin cálculo de disponibilidad). Define `TablePublic` como tipo público propio del servicio. Fue creado en la rama `03-data-model-and-layer-access`. Esta subtarea forma parte de la auditoría OP-120 y no implica cambios en el código.

## Objetivo
Verificar que el servicio funciona correctamente, que `TablePublic` es coherente con las necesidades de la API, que la separación de responsabilidades es adecuada, y evaluar si la estructura actual es suficiente para las fases siguientes del proyecto.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-127 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Interfaz `TablePublic`
- Campos: `_id: string`, `label: string`, `type: TableType`, `position: TablePosition`, `assignedTo: string | null`, `isActive: boolean`
- Verificar coherencia con `ITable` del dominio
- Verificar que `_id` y `assignedTo` están correctamente serializados como string (no ObjectId)
- Comparar con `TableAvailability` de `availability.service` — ¿hay solapamiento o duplicidad de tipos?

### `toPublic(table)`
- Conversión de `_id` a string con `.toString()`
- Conversión de `assignedTo` con `?.toString() ?? null`
- Verificar que todos los campos de `TablePublic` están cubiertos

### `getTablesWithBasicInfo()`
- Delega a `listActiveTables()` del repositorio — correcto
- Mapea con `toPublic` — correcto
- **Sin cálculo de disponibilidad** — documentado en el JSDoc del servicio
- Verificar coherencia con el endpoint `GET /api/tables` que lo usa

### Aspectos estructurales
- `TablePublic` está definida en el servicio, no en `src/domain/types/` — evaluar si debería moverse al dominio
- El servicio es el único lugar donde se define `TablePublic` — verificar que no hay duplicación en API routes
- Separación clara con `availability.service` que tiene su propio `TableAvailability`

### Completitud para el alcance
- En Fase 2, el plano necesitará `TableAvailability` (de `availability.service`), no `TablePublic`
- En Fase 3 (admin), se necesitarán operaciones de escritura: crear, editar, desactivar mesas
- Evaluar si `table.service` es el lugar correcto para esas operaciones futuras o si se crearán en rutas admin separadas

## Casos límite
- `isActive: false` en `TablePublic` — el servicio llama a `listActiveTables()` que solo devuelve activas, por lo que `isActive` siempre será `true` en la respuesta — ¿tiene sentido incluir el campo?
- `TablePublic` incluye `assignedTo` (ID del usuario asignado) pero no el nombre — el cliente necesitaría una segunda llamada para resolver el nombre
- `position` se incluye tal cual desde el schema — verificar que `TablePosition` es serializable correctamente (no contiene ObjectIds ni Dates)

## Criterios de aceptación
- AC-1: Verificar que `TablePublic` cubre los campos necesarios para el endpoint `GET /api/tables`
- AC-2: Verificar que la conversión de `_id` y `assignedTo` a string es correcta en `toPublic`
- AC-3: Evaluar si `TablePublic` debería vivir en `src/domain/types/` en lugar del servicio
- AC-4: Evaluar si `isActive` tiene sentido en `TablePublic` dado que solo se devuelven tablas activas
- AC-5: Evaluar completitud del servicio para las necesidades de Fases 2 y 3
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-127
- Sin modificaciones al código fuente
