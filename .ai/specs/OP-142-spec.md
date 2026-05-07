# OP-142 — Revisar callbacks signIn y session

## Contexto
Los callbacks `signIn` y `session` están definidos en `src/lib/auth.ts` como parte de la configuración de NextAuth v5. Son las dos piezas más críticas del sistema de autenticación y autorización:

- `signIn`: puerta de entrada — decide si un usuario puede iniciar sesión
- `session`: enriquece el objeto de sesión con `id`, `role` y `name` desde la BD

El tipado del objeto `Session` está extendido en `src/domain/types/next-auth.d.ts`. El modelo `User` está en `src/lib/models/user.model.ts`.

Esta subtarea forma parte de la auditoría OP-140 y no implica cambios en el código.

## Objetivo
Verificar que ambos callbacks implementan correctamente la lógica de autorización, el acceso a datos, el manejo de errores y la coherencia de tipos — asegurando que ningún usuario inactivo o no registrado pueda acceder y que la sesión refleja siempre el estado real del usuario en BD.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Callback `signIn`
- ¿Se comprueba `user.email` antes de consultar la BD? ¿Qué devuelve si es `null` o `undefined`?
- ¿La búsqueda en BD filtra por `email.toLowerCase()` e `isActive: true` simultáneamente?
- ¿La redirección a `/login/error?error=AccessDenied` en lugar de devolver `false` es la práctica correcta en NextAuth v5 para garantizar la redirección?
- ¿El mensaje de error es genérico (no revela si el email existe o no)?
- ¿El bloque `catch` también redirige a error en lugar de dejar pasar la excepción?
- ¿El callback usa `connectDB()` (Mongoose) y no el cliente nativo del adapter — y esto es correcto aquí?
- ¿Hay algún caso en el que un usuario inactivo pueda pasar el callback (race condition entre `signIn` y el enriquecimiento de sesión)?

### Callback `session`
- ¿Se comprueba `user?.email` antes de consultar la BD? ¿Qué ocurre si es falsy?
- ¿La búsqueda en BD es por `email.toLowerCase()` — coherente con el modelo que ya aplica `lowercase: true`?
- ¿Se consulta la BD **sin** filtrar por `isActive`? ¿Es esto un problema? (un usuario desactivado después de iniciar sesión seguiría enriqueciendo su sesión)
- ¿`session.user.id`, `session.user.role` y `session.user.name` se asignan correctamente y coinciden con la declaración de tipos en `next-auth.d.ts`?
- ¿`dbUser.role as UserRole` requiere un cast explícito? ¿Podría ser `undefined` si el campo no está en BD?
- ¿Qué ocurre si `dbUser` es `null` (usuario no encontrado)? ¿La sesión sigue siendo válida pero sin enriquecimiento?
- ¿El `catch` silencia el error — es esto correcto o debería invalidar la sesión?
- ¿La sesión devuelta siempre tiene los campos `id`, `role` y `name` tipados como no opcionales aunque el enriquecimiento falle?

### Coherencia entre callbacks
- ¿`signIn` rechaza usuarios inactivos pero `session` no verifica `isActive`? — ¿podría un usuario desactivado mantener una sesión existente?
- ¿Los dos callbacks usan `connectDB()` de forma independiente — hay algún riesgo de doble conexión innecesaria?
- ¿El flujo completo (magic link → `signIn` → sesión persistida → `session`) es coherente y sin huecos de autorización?

### Tipado
- ¿`Session` extendida en `next-auth.d.ts` declara `id`, `role` y `name` como obligatorios?
- ¿La declaración omite el campo `image` como opcional — es correcto?
- ¿Hay inconsistencia entre los campos que `session` callback asigna y los que `next-auth.d.ts` declara?

## Casos límite
- Usuario existente y activo en el momento del `signIn`, pero desactivado antes de que expire la sesión — ¿la sesión sigue activa?
- `user.email` presente en el objeto NextAuth pero no encontrado en BD — ¿`signIn` rechaza, `session` devuelve sesión sin enriquecimiento?
- `connectDB()` lanza excepción en `session` callback — ¿la sesión sigue siendo válida (sin campos extra) o se destruye?
- `dbUser.role` no definido en un documento legacy — ¿`as UserRole` enmascara un valor `undefined`?

## Criterios de aceptación
- AC-1: Verificar que `signIn` rechaza usuarios inexistentes e inactivos con mensaje genérico, sin revelar si el email existe
- AC-2: Verificar que `signIn` usa `email.toLowerCase()` e `isActive: true` en la query, y que el bloque `catch` redirige a error en lugar de devolver `true`
- AC-3: Verificar que `session` enriquece correctamente con `id`, `role` y `name` desde la BD en cada refresco
- AC-4: Identificar si `session` debería verificar `isActive` y documentar el riesgo de sesiones de usuarios desactivados
- AC-5: Verificar coherencia entre los campos asignados en `session` callback y la declaración de tipos en `next-auth.d.ts`
- AC-6: Documentar hallazgos con severidad (bloqueante / mejora / observación) para consolidar en OP-145

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados para su consolidación en OP-145
- Sin modificaciones al código fuente

## Execution Result

- Fecha de implementación: 2026-05-06 (CET)
- Rama: feature/OP-140-implementar-mejoras-seguridad-autenticacion
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — `signIn` comprueba `user.email`, filtra por `{ email: toLowerCase(), isActive: true }`, mensaje genérico `AccessDenied` sin revelar existencia del email.
  - AC-2: PASS — `toLowerCase()` e `isActive: true` presentes en la query. Bloque `catch` redirige a error, no devuelve `true`. Uso de `connectDB()` correcto para el modelo `User` del dominio.
  - AC-3: PASS con observación — `session` enriquece correctamente `id`, `role`, `name`. Si `dbUser` es null (usuario eliminado con sesión activa), los campos quedan sin asignar pero la sesión sigue válida.
  - AC-4: PASS — Hallazgo H-142-1 documentado: `session` no verifica `isActive`, un usuario desactivado mantiene sesión activa hasta expiración (máx. 90 días). Severidad: Mejora.
  - AC-5: PASS con observación — Coherencia entre callback y `next-auth.d.ts` correcta en el caso feliz. Si el `catch` se activa, los campos no opcionales declarados pueden ser `undefined` en runtime. Hallazgo H-142-2 documentado.
  - AC-6: PASS — Hallazgos H-142-1, H-142-2, H-142-3 registrados en `.ai/reports/OP-140-findings.md`.
- Ficheros auditados (sin modificaciones):
  - `src/lib/auth.ts`
  - `src/domain/types/next-auth.d.ts`
  - `src/lib/models/user.model.ts`
- Ficheros modificados:
  - `.ai/reports/OP-140-findings.md` (sección OP-142 añadida)
- verify:
  - Comando ejecutado: auditoría estática (tarea de solo lectura, sin cambios de código)
  - Resultado: PASS — todos los AC verificados manualmente contra el código fuente
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: lectura y análisis de ficheros, redacción del informe de hallazgos y Execution Result
- Decisiones técnicas:
  - H-142-1 se clasifica como "Mejora" y no "Bloqueante" porque en una app interna con pocos usuarios la probabilidad de que un usuario desactivado explote activamente la sesión vigente es baja, pero es un gap real que debe corregirse en OP-160.
  - H-142-2 se clasifica como "Observación" porque el `catch` silenciante es una decisión deliberada documentada en el código: la sesión sigue siendo válida aunque el enriquecimiento falle.
