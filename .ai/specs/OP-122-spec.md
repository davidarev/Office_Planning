# OP-122 — Revisar table.repository y user.repository

## Contexto
`src/lib/db/table.repository.ts` y `src/lib/db/user.repository.ts` implementan el acceso a datos de las entidades `Table` y `User` respectivamente. Fueron creados en la rama `03-data-model-and-layer-access`. Esta subtarea forma parte de la auditoría OP-120 y no implica cambios en el código.

## Objetivo
Verificar que ambos repositorios son correctos, completos y coherentes con las necesidades actuales del sistema. Identificar operaciones que puedan faltar, verificar filtros por `isActive`, ordenación y ausencia de lógica de negocio.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-127 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### table.repository
- `listActiveTables()` — filtro `{ isActive: true }`, ordenación `{ label: 1 }`, `.lean()`
- `getTableById(id)` — sin filtro de `isActive` (devuelve también inactivas) — verificar si es correcto
- **Operaciones posiblemente faltantes**: `getTablesByType(type)`, `getTablesByAssignedUser(userId)`, operaciones de escritura para admin (aún no existe panel admin, pero evaluar si ya debería contemplarse)

### user.repository
- `getUserByEmail(email)` — `email.toLowerCase()` para normalización — verificar coherencia con el schema que ya tiene `lowercase: true`
- `getUserById(id)` — sin filtro de `isActive` — verificar si es correcto para todos los callers
- `listActiveUsers()` — filtro `{ isActive: true }`, ordenación `{ name: 1 }`, `.lean()`
- **Operaciones posiblemente faltantes**: `listAllUsers()` (para admin), operaciones de escritura (crear, editar usuario)

### Aspectos transversales
- Uso consistente de `await connectDB()` en todas las funciones
- Uso de `.lean()` para mejorar rendimiento
- Ausencia de lógica de negocio
- Tipado correcto de retornos (`ITable`, `IUser`, arrays)

### Completitud para el alcance del proyecto
- Evaluar si las operaciones actuales cubren todas las necesidades de los servicios que los usan
- Evaluar si faltan operaciones que serán necesarias en fases posteriores (admin panel, Fase 3)

## Casos límite
- `getUserByEmail` normaliza a minúsculas antes de buscar, pero el schema ya tiene `lowercase: true` — normalización doble (redundante pero segura)
- `getUserById` devuelve usuarios inactivos — ¿`availability.service` podría resolver nombres de usuarios inactivos? ¿Es un problema?
- `getTableById` devuelve mesas inactivas — `reservation.service` usa este método para validar; ¿verifica explícitamente `isActive`?
- Ausencia de cualquier operación de escritura (insert/update) en ambos repositorios — correcto para la fase actual pero limitante para fases futuras

## Criterios de aceptación
- AC-1: Verificar que los filtros por `isActive` son correctos en las funciones de listado
- AC-2: Verificar la coherencia de `getUserByEmail` con la normalización ya aplicada por el schema
- AC-3: Verificar que los repositorios no contienen lógica de negocio
- AC-4: Identificar operaciones que podrían faltar para cubrir el alcance completo del proyecto (Fases 2-3)
- AC-5: Verificar uso consistente de `.lean()` y `await connectDB()`
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-127
- Sin modificaciones al código fuente
