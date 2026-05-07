# OP-140 — Auditoría de autenticación y sesiones

## Contexto
La autenticación fue implementada en la rama `02-auth-and-sessions` usando NextAuth.js v5 con magic link, sesión persistente de 90 días almacenada en BD, y middleware de protección de rutas. Esta historia no tiene dependencias — se puede auditar en paralelo con OP-110.

## Objetivo
Revisar la configuración completa de NextAuth, callbacks, adapter MongoDB, flujo de magic link, sesión de 90 días, y páginas de autenticación para verificar seguridad y corrección del flujo completo.

## Restricciones
- No modificar código — solo auditar y documentar
- Los hallazgos se aplican en OP-160
- Sin dependencias de otras historias

## Casos límite
- Usuario existente pero inactivo que intenta hacer login
- Email no registrado en la BD que solicita magic link
- Sesión expirada que intenta acceder a ruta protegida
- Callback de session que no enriquece correctamente con id, role, name
- callbackUrl malformado o apuntando a ruta externa

## Criterios de aceptación
- AC-1: Configuración de NextAuth revisada — adapter, provider email, session strategy=database, maxAge 90d, updateAge 24h, pages personalizadas verificados
- AC-2: Callbacks signIn y session revisados — signIn rechaza usuarios inexistentes/inactivos, session enriquece con id, role y name verificados
- AC-3: auth-mongodb-client y api-auth revisados — conexión MongoDB para adapter y utilidad requireSession() verificados
- AC-4: Páginas de auth revisadas — login, verify, error: flujo de UI, formulario, manejo de callbackUrl verificados
- AC-5: Informe de hallazgos documentado

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-141 | Revisar configuración de NextAuth |
| OP-142 | Revisar callbacks signIn y session |
| OP-143 | Revisar auth-mongodb-client y api-auth |
| OP-144 | Revisar páginas de auth |
| OP-145 | Documentar hallazgos OP-140 |

## Execution Result

- Fecha de implementación: 2026-05-06 (CET)
- Rama: feature/OP-140-implementar-mejoras-seguridad-autenticacion
- Commits: a253fab · f510558 · 4c7020f · cc9de3c · 8055f37
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — Configuración de NextAuth verificada en OP-141. Adapter, provider, session strategy=database, maxAge 90d, updateAge 24h y páginas personalizadas correctos.
  - AC-2: PASS — Callbacks auditados en OP-142. `signIn` rechaza usuarios inexistentes/inactivos con mensaje genérico. `session` enriquece correctamente con `id`, `role` y `name`. Hallazgo H-140-1 (isActive no verificado en session).
  - AC-3: PASS — `auth-mongodb-client` y `api-auth` auditados en OP-143. Singleton MongoClient correcto, `requireSession()` funcional. Hallazgo H-140-3 (sin try/catch en auth()).
  - AC-4: PASS — Páginas de auth auditadas en OP-144. Flujo correcto de extremo a extremo. Sin reflected XSS. Hallazgo H-140-5 (callbackUrl delegado al framework).
  - AC-5: PASS — Informe consolidado producido en OP-145. 7 hallazgos documentados (0 bloqueantes, 3 mejoras, 4 observaciones). 5 candidatos descartados con justificación.
- Ficheros auditados (sin modificaciones de código):
  - `src/lib/auth.ts`
  - `src/lib/auth-mongodb-client.ts`
  - `src/lib/mongodb.ts`
  - `src/lib/api-auth.ts`
  - `src/lib/models/user.model.ts`
  - `src/domain/types/next-auth.d.ts`
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/login/verify/page.tsx`
  - `src/app/(auth)/login/error/page.tsx`
  - `src/app/(auth)/layout.tsx`
  - `src/app/api/auth/[...nextauth]/route.ts`
- Ficheros de documentación creados o modificados:
  - `.ai/reports/OP-140-findings.md`
  - `.ai/specs/OP-141-spec.md` (Execution Result)
  - `.ai/specs/OP-142-spec.md` (Execution Result)
  - `.ai/specs/OP-143-spec.md` (Execution Result)
  - `.ai/specs/OP-144-spec.md` (Execution Result)
  - `.ai/specs/OP-145-spec.md` (Execution Result)
  - `.ai/verify/config.yaml` (suites OP-141 a OP-145)
- verify:
  - Resultado: PASS — auditoría estática completa, todos los AC verificados manualmente
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: lectura y análisis de todos los ficheros de autenticación, redacción de informes de hallazgos por subtarea, consolidación en informe final y Execution Results
- Decisiones técnicas:
  - Ningún hallazgo se clasificó como Bloqueante: la capa de autenticación es funcionalmente correcta y segura para el caso feliz.
  - Las 3 Mejoras (H-140-1, H-140-2, H-140-3) deben priorizarse en OP-160 antes de producción.
  - H-140-1 (isActive en session) es el hallazgo de mayor impacto: un usuario desactivado puede mantener acceso hasta 90 días sin él.

## Informe de hallazgos OP-140

> Informe consolidado producido por OP-145. Fuente de trabajo para OP-160.
> Detalle completo en `.ai/reports/OP-140-findings.md`.

| ID | Severidad | Origen | Fichero | Descripción |
|---|---|---|---|---|
| H-140-1 | Mejora | OP-142 | `src/lib/auth.ts` | `session` callback no verifica `isActive` — usuario desactivado mantiene sesión hasta expiración (máx. 90 días) |
| H-140-2 | Mejora | OP-141 | `src/lib/auth.ts` | Variables de entorno de email sin validación en arranque — fallo silencioso si no están definidas |
| H-140-3 | Mejora | OP-143 | `src/lib/api-auth.ts` | `requireSession()` sin `try/catch` alrededor de `auth()` — excepción de BD genera 500 no controlado |
| H-140-4 | Observación | OP-142 | `src/lib/auth.ts`, `next-auth.d.ts` | Inconsistencia tipo/runtime: `id`, `role`, `name` declarados no opcionales pero pueden ser `undefined` si el enriquecimiento falla |
| H-140-5 | Observación | OP-144 | `src/app/(auth)/login/page.tsx` | `callbackUrl` sin validación propia — protección de open redirect delegada al framework |
| H-140-6 | Observación | OP-142 | `src/lib/auth.ts` | `dbUser` null en `session` deja sesión sin enriquecimiento; cubierto parcialmente por H-140-1 |
| H-140-7 | Observación | OP-144 | `src/app/(auth)/layout.tsx` | `<Suspense>` sin `fallback` — posible flash de pantalla vacía, sin impacto funcional |
