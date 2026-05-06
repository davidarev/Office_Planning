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
