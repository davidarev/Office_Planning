# OP-161 — Aplicar correcciones a modelos y tipos

## Contexto

La auditoría OP-110 identificó 23 hallazgos en modelos Mongoose y tipos de dominio TypeScript. Esta subtarea aplica las correcciones priorizadas (prioridades 1–12 del informe `.ai/reports/OP-110-findings.md`) sin cambiar funcionalidad ni comportamiento observable. Depende de que OP-110 esté completada.

Ficheros afectados:
- `src/lib/models/user.model.ts` — schema UserSchema
- `src/lib/models/table.model.ts` — schema TableSchema
- `src/lib/models/reservation.model.ts` — schema ReservationSchema
- `src/domain/types/table.ts` — interfaces ITable, TablePosition, TableAvailability, TableWithStatus
- `src/domain/types/next-auth.d.ts` — extensión de tipos NextAuth

## Objetivo

Aplicar los hallazgos de severidad Mejora de OP-110, más las observaciones de alto impacto priorizadas, de forma que:

- Los tipos TypeScript sean más honestos respecto a lo que MongoDB devuelve realmente
- Los schemas tengan validaciones y restricciones que reflejen las reglas del dominio
- La extensión de NextAuth cubra todos los callbacks de auth (no solo `Session`)
- `TableAvailability.reservation` no exponga `userId` innecesariamente
- `TableWithStatus` sea eliminado si se confirma que no tiene uso activo fuera de las exportaciones de tipos

## Restricciones

- No cambiar comportamiento funcional observable — solo corregir tipos, validaciones y declaraciones de schema
- No introducir nuevas dependencias
- Todos los cambios deben estar trazados a hallazgos del informe OP-110
- Los tests existentes deben seguir pasando tras las correcciones

## Correcciones a aplicar

### UserSchema (`src/lib/models/user.model.ts`)
- **H-111-2**: Añadir validación de formato email con `match: [/regex/, mensaje]`
- **H-111-3**: Declarar índice `email` explícitamente con `UserSchema.index({ email: 1 }, { unique: true })` (mantener `unique: true` en el campo como hint)
- **H-111-6**: Añadir `required: true` en el campo `role` (ya tiene `default: "user"`, añadir `required` lo hace explícito)

### TableSchema (`src/lib/models/table.model.ts`)
- **H-112-1**: Cambiar `assignedTo: null` vs `undefined` — opción elegida: mantener `default: null` en schema y actualizar `ITable.assignedTo` a `assignedTo?: Types.ObjectId | null` para reflejar lo que devuelve Mongo
- **H-112-2**: Alinear `TablePosition.rotation` a `rotation: number` (no opcional) dado que el schema siempre persiste `0` — elimina ambigüedad
- **H-112-3**: Añadir `unique: true` en el campo `label` de TableSchema para garantizar nombres únicos
- **H-112-6**: No se añade en schema (pertenece a la capa de servicio) — se documenta como decisión

### ReservationSchema (`src/lib/models/reservation.model.ts`)
- **H-113-1**: Añadir `set: (v: Date) => normalizeDate(v)` en el campo `date` del schema como defensa en profundidad; importar `normalizeDate` de `@/lib/dates`
- **H-113-4**: Añadir `required: true` en el campo `status`

### Tipos de dominio (`src/domain/types/`)
- **H-114-1**: Eliminar `userId: string` de `TableAvailability.reservation` — solo se expone `_id` (de la reserva) y `userName`
- **H-114-2**: Extender también `interface User` en `next-auth.d.ts` para tipar correctamente los callbacks `jwt` y `session`
- **H-114-6**: Eliminar `TableWithStatus` de `src/domain/types/table.ts` y su reexportación en `src/domain/types/index.ts` — la búsqueda en el código confirma que solo existe en las exportaciones, no tiene uso activo

## Casos límite

- `normalizeDate` importada en el modelo — verificar que no introduce circularidad de importación (el modelo no debe importar servicios; `normalizeDate` está en `@/lib/dates`, aceptable)
- `H-112-1` — cambiar la interfaz `ITable.assignedTo` puede romper código que compara `assignedTo` con `undefined`. Buscar y ajustar comparaciones afectadas
- `H-114-1` — eliminar `userId` de `TableAvailability.reservation` puede romper código que lee ese campo. Buscar y ajustar usos en servicios y componentes
- `H-114-6` — `TableWithStatus` se reexporta en `index.ts`. Verificar que ningún fichero externo lo importa antes de eliminar

## Criterios de aceptación

- AC-1: `UserSchema` incluye validación de formato email con `match`, `role` con `required: true`, e índice `email` declarado explícitamente
- AC-2: `TableSchema` tiene `label` con `unique: true`, `assignedTo` con semántica `null` consistente con el tipo actualizado `ITable.assignedTo?: Types.ObjectId | null`
- AC-3: `ReservationSchema` incluye `set: normalizeDate` en el campo `date` y `status` con `required: true`
- AC-4: `TableAvailability.reservation` no expone `userId` — solo `_id` (de la reserva) y `userName`
- AC-5: `next-auth.d.ts` extiende también `interface User` con `id`, `role` e `image`
- AC-6: `TableWithStatus` eliminado de tipos y reexportaciones
- AC-7: `TablePosition.rotation` tipado como `rotation: number` (no opcional)
- AC-8: Suite de tests pasa sin regresiones: `npm run test`

## Criterio de done

- Todos los AC en PASS
- verify en verde (`npm run test && npm run lint`)
- Spec actualizada con `## Execution Result`

## Execution Result

- Fecha de implementación: 2026-05-07 19:17 (CET)
- Rama: feature/OP-160-correccion-deuda-tecnica
- Commit: 9816f6d55c7f1062078a5b16ed920f9198b76fa8
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS – UserSchema con `match` email, `role: required:true`, `UserSchema.index({email:1},{unique:true})` explícito
  - AC-2: PASS – TableSchema `label: unique:true`; `ITable.assignedTo?: Types.ObjectId | null`
  - AC-3: PASS – ReservationSchema `date` con `set: normalizeDate`; `status: required:true`
  - AC-4: PASS – `TableAvailability.reservation` solo expone `_id` y `userName`; `userId` eliminado
  - AC-5: PASS – `next-auth.d.ts` extiende `interface User` con `id`, `role`, `image`
  - AC-6: PASS – `TableWithStatus` eliminado de `table.ts` e `index.ts`
  - AC-7: PASS – `TablePosition.rotation: number` (no opcional)
  - AC-8: PASS – 242/242 tests pasan; tests que esperaban `userId` actualizados para reflejar nuevo contrato
- Ficheros creados o modificados:
  - `src/lib/models/user.model.ts`
  - `src/lib/models/table.model.ts`
  - `src/lib/models/reservation.model.ts`
  - `src/domain/types/table.ts`
  - `src/domain/types/index.ts`
  - `src/domain/types/next-auth.d.ts`
  - `src/services/availability.service.ts`
  - `tests/api/availability.test.ts`
  - `tests/integration/compute-status.test.ts`
- verify:
  - Comando ejecutado: `npm run test`
  - Resultado: PASS – 242/242 tests, 13/13 suites
  - Lint: errores solo en `.obsidian/plugins/` (pre-existentes, fuera del proyecto)
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: implementación completa guiada por spec
- Decisiones técnicas:
  - H-111-3: se eliminó `unique:true` del campo `email` para evitar índice duplicado con `UserSchema.index` — Mongoose advertía de duplicado; el índice explícito es suficiente
  - H-112-1: `ITable.assignedTo?: Types.ObjectId | null` — la `?` mantiene compatibilidad con código existente que usa optional chaining `table.assignedTo?.toString()`
  - H-114-1: los dos tests que verificaban `userId` en `reservation` se actualizaron para reflejar el nuevo contrato del tipo; no es regresión sino alineación con AC-4
