# Informe de auditoría OP-110 — Modelos y tipos de dominio

## Resumen ejecutivo

_En construcción. Se irá completando a medida que se finalicen OP-111, OP-112, OP-113 y OP-114._

---

## Hallazgos por área

### Schema User (OP-111)

| ID | Severidad | Descripción | Acción propuesta |
|----|-----------|-------------|-----------------|
| H-111-1 | Observación | `name` no tiene validación de longitud mínima ni máxima. Mongoose no la impone por defecto. | Añadir `minlength` y `maxlength` razonables (e.g. 2–100). |
| H-111-2 | Mejora | `email` no tiene validación de formato. `lowercase: true` normaliza la caja pero no verifica que sea un email válido. Un valor como `"noesuncorreo"` sería aceptado. | Añadir `match: [/regex/, 'mensaje']` con una expresión regular de email básica. |
| H-111-3 | Observación | El índice `unique` en `email` se declara implícitamente con `unique: true` en el campo del schema, pero no se declara de forma explícita con `UserSchema.index(...)`. Para visibilidad y documentación del índice, es preferible la declaración explícita. | Añadir `UserSchema.index({ email: 1 }, { unique: true })` y mantener la declaración en el campo solo como hint. |
| H-111-4 | Observación | No hay índice en `role` ni en `isActive`. Para las consultas administrativas (listar usuarios activos, filtrar por rol), podría ser beneficioso. | Evaluar en OP-160 si los patrones de acceso lo justifican. No es urgente. |
| H-111-5 | Observación | `IUser` declara `createdAt: Date` y `updatedAt: Date` explícitamente. `timestamps: true` en el schema los genera automáticamente en el documento Mongoose, pero no están tipados en el schema. La coherencia existe, pero depende del comportamiento implícito de `timestamps`. | Ninguna acción necesaria; el comportamiento es correcto. Documentar como decisión intencional. |
| H-111-6 | Observación | `role` no tiene `required: true`. Dado que tiene `default: "user"`, Mongoose nunca lo dejará vacío, pero la ausencia de `required` es ambigua en lectura del schema. | Añadir `required: true` para dejar explícita la intención. |

**Veredicto OP-111:** El schema es funcionalmente correcto y coherente con `IUser` y `README.md §3`. No hay bugs ni inconsistencias bloqueantes. Los hallazgos son mejoras de robustez y claridad.

---

### Schema Table (OP-112)

| ID | Severidad | Descripción | Acción propuesta |
|----|-----------|-------------|-----------------|
| H-112-1 | Mejora | `assignedTo` tiene `default: null` en el schema pero `ITable` lo declara como `assignedTo?: Types.ObjectId` (puede ser `undefined`). Al leer documentos de Mongo, el campo siempre será `null` (nunca `undefined`), lo que puede provocar comparaciones incorrectas en código que distinga `null` de `undefined`. | Alinear la interfaz usando `assignedTo?: Types.ObjectId \| null` o cambiar el default del schema a `default: undefined` y eliminar el `default: null`. |
| H-112-2 | Observación | `rotation` en `PositionSchema` tiene `default: 0`, lo que significa que siempre se persistirá `rotation: 0` incluso si no se proporcionó. Sin embargo, `TablePosition` declara `rotation?: number` (opcional). El tipo TypeScript permite `undefined` pero Mongo nunca devuelve `undefined` para este campo. | Documentar como decisión intencional o alinear el tipo a `rotation: number` (no opcional) dado que siempre tiene valor en Mongo. |
| H-112-3 | Mejora | `label` no tiene restricción de unicidad ni índice. Dos mesas con el mismo nombre generan ambigüedad funcional (el README §6 identifica las mesas por nombre/identificador). | Añadir `unique: true` en el campo `label` o al menos `TableSchema.index({ label: 1 }, { unique: true })` para garantizar nombres únicos. |
| H-112-4 | Observación | No hay índice en `type`. Las queries de disponibilidad pueden filtrar por `type: "blocked"` junto con `isActive`. Sin índice compuesto `{ isActive: 1, type: 1 }`, estas queries no son óptimas. | Añadir índice compuesto `{ isActive: 1, type: 1 }` en OP-160 si los patrones de acceso lo justifican. |
| H-112-5 | Observación | No hay índice en `assignedTo`. Para consultas de "¿qué mesas tiene asignadas este usuario?" (útil en admin y en lógica de `fixed`/`preferential`), sería beneficioso. | Añadir `TableSchema.index({ assignedTo: 1 })` en OP-160 si el volumen de mesas lo justifica. |
| H-112-6 | Observación | El schema no valida que mesas de tipo `fixed` o `preferential` tengan `assignedTo` relleno. El README §6 implica que estas mesas están asociadas a un usuario, pero el schema lo permite vacío. | Añadir validación condicional en el servicio o en el schema (validator function) para impedir `fixed`/`preferential` sin `assignedTo`. |
| H-112-7 | Observación | No hay validación de rango en las coordenadas de `PositionSchema` (`x`, `y`, `width`, `height`). Valores negativos o extremos son aceptados sin error. | Evaluar si añadir `min: 0` es conveniente según el sistema de coordenadas del plano. Baja prioridad. |

**Veredicto OP-112:** El schema es funcionalmente correcto y coherente con `README.md §6`. El hallazgo más relevante es H-112-1 (`assignedTo: null` vs `undefined`) que puede generar bugs silenciosos en código que distinga ambos valores. H-112-3 (`label` sin unicidad) es una mejora de robustez importante. El resto son observaciones de índices y validaciones adicionales.

---

### Schema Reservation (OP-113)

| ID | Severidad | Descripción | Acción propuesta |
|----|-----------|-------------|-----------------|
| H-113-1 | Mejora | La normalización de fechas a UTC midnight no se garantiza en el schema (sin `set`), sino que depende de que el servicio/repositorio llame a `normalizeDate()`. Si alguien llama a `insertReservation()` con una fecha no normalizada, el índice único no funcionará correctamente (dos fechas del mismo día con distinta hora serían distintas para MongoDB). | Añadir `set: normalizeDate` en el campo `date` del schema como última línea de defensa, o documentar explícitamente el contrato de que el repositorio solo acepta fechas ya normalizadas. |
| H-113-2 | Observación | No hay índice simple en `{ userId: 1 }`. El índice compuesto `{ userId: 1, date: 1 }` cubre queries con filtro de fecha, pero una query de "todas las reservas de un usuario" (sin filtro de fecha) no puede aprovechar ese índice de forma óptima. El patrón existe en la API (`/api/reservations/week`). | Evaluar si añadir `ReservationSchema.index({ userId: 1 })` mejora el rendimiento según el volumen esperado. |
| H-113-3 | Observación | No hay índice simple en `{ tableId: 1 }`. Para queries de historial de una mesa (admin), no hay índice de soporte. El índice compuesto `{ tableId: 1, date: 1 }` cubre el caso con filtro de fecha pero no el historial completo. | Evaluar necesidad según patrones de acceso administrativo. Baja prioridad en esta fase. |
| H-113-4 | Observación | `status` no tiene `required: true`. Dado que tiene `default: "confirmed"`, nunca quedará vacío, pero la ausencia de `required` es ambigua en lectura del schema (mismo patrón detectado en OP-111 para `role`). | Añadir `required: true` para hacer explícita la intención, coherente con H-111-6. |

**Veredicto OP-113:** El schema es sólido y el diseño de índices únicos parciales es correcto para la garantía de concurrencia. El hallazgo más relevante es H-113-1: la ausencia de normalización de fecha en el schema crea una dependencia implícita en capas superiores. En la práctica actual está cubierta, pero es un punto de fragilidad. El resto son observaciones de índices y consistencia.

---

### Tipos de dominio (OP-114)

_Pendiente — OP-114 no iniciada._

---

## Priorización para OP-160

_Se completará cuando todas las subtareas estén finalizadas._

---

## Decisiones propuestas

- **H-111-5**: `timestamps: true` + campos explícitos en `IUser` es un patrón válido y consistente. Se propone mantenerlo tal cual y documentarlo en CLAUDE.md o en el propio tipo.
- **H-111-3**: La declaración explícita de índices mejora la visibilidad del schema pero no cambia el comportamiento. Se propone añadirla en OP-160 como mejora de mantenibilidad.
- **H-112-1**: La discrepancia `null` vs `undefined` en `assignedTo` es la más prioritaria del schema Table. Se propone unificar el contrato: o bien `ITable.assignedTo?: Types.ObjectId | null` o bien `default: undefined` en el schema. La primera opción es más explícita y honesta con lo que devuelve Mongo.
- **H-112-3**: `label` único es una restricción que el README implica pero no exige explícitamente. Se propone añadirla en OP-160 como unicidad a nivel de base de datos.
- **H-112-6**: La validación de `assignedTo` requerido para `fixed`/`preferential` se recomienda en la capa de servicio, no en el schema, para mantener la separación de responsabilidades.
- **H-113-1**: Se propone añadir `set: normalizeDate` en el campo `date` del schema como defensa en profundidad. La normalización ya ocurre en el servicio, pero el schema es la última barrera antes de la base de datos. Alternativa: documentar explícitamente el contrato del repositorio.
- **H-113-4**: Consistente con H-111-6 — campos con `default` deberían declarar también `required: true` para claridad.
