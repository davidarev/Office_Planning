# OP-134 — Revisar proxy.ts (middleware)

## Contexto
El middleware de autenticación y autorización está implementado en `src/proxy.ts`. Intercepta todas las peticiones de la aplicación (excepto assets estáticos y rutas de API) y aplica las reglas de acceso definidas en el proyecto. Esta subtarea forma parte de la auditoría OP-130 y no implica cambios en el código.

## Objetivo
Verificar que el middleware cubre correctamente todos los escenarios de acceso: rutas públicas, rutas privadas, rutas de administrador y redirección de usuarios ya autenticados; sin posibilidad de bypass.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Reglas de redirección
- Usuario autenticado en `/login` → redirige a `/` (evita que usuarios con sesión vean el login)
- Ruta `/admin/*` sin sesión → redirige a `/login?callbackUrl=<pathname>`
- Ruta `/admin/*` con sesión pero sin rol `admin` → redirige a `/`
- Ruta privada sin sesión → redirige a `/login?callbackUrl=<pathname>`
- Ruta pública con sesión → pasa sin redirección

### Configuración del matcher (`config.matcher`)
- El patrón actual excluye `api/`, `_next/static`, `_next/image` y `favicon.ico`
- Verificar que las rutas `/api/*` quedan fuera del matcher — la autenticación de API se gestiona por `requireSession()` en cada handler, no por el middleware
- Verificar que no quedan rutas privadas de página sin cubrir por el matcher
- Verificar si `/api/auth/*` necesita estar explícitamente en el matcher o si su exclusión es correcta

### Detección de rol admin
- `session.user.role !== "admin"` — verificar que el campo `role` proviene de la sesión del servidor, no de la petición del cliente
- Verificar que no existe forma de que un usuario manipule su `role` en la sesión

### Aspectos transversales
- El middleware usa `auth` de `@/lib/auth` (NextAuth v5) — verificar que es la importación correcta
- `NextResponse.redirect` con URLs absolutas construidas desde `nextUrl` — verificar que no hay open redirect
- Orden de evaluación de condiciones — si un usuario admin accede a `/login`, ¿qué rama se ejecuta primero?

## Casos límite
- Ruta `/admin` exacta (sin slash final) — ¿queda cubierta por `pathname.startsWith("/admin")`?
- Rutas anidadas bajo `/admin/algo/subruta` — deben quedar protegidas
- `callbackUrl` con valor malicioso (open redirect) — ¿se sanitiza antes de usarse en la redirección?
- Usuario con sesión expirada — ¿`!!session` evalúa correctamente a `false`?
- Rutas que no son ni `/login` ni `/admin` ni API — flujo por defecto de la rama final

## Criterios de aceptación
- AC-1: Verificar que el matcher excluye correctamente las rutas de API y assets estáticos
- AC-2: Verificar que `/admin/*` requiere sesión activa y rol `admin` verificado desde la sesión del servidor
- AC-3: Verificar que todas las rutas privadas (no `/login`, no API) redirigen a `/login` sin sesión
- AC-4: Verificar que no existe riesgo de open redirect en la construcción de `callbackUrl`
- AC-5: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-136
- Sin modificaciones al código fuente

## Execution Result

**Fecha**: 2026-05-06
**Estado**: DONE

### Resultados por AC

| AC | Estado | Notas |
|----|--------|-------|
| AC-1 | PASS | Matcher excluye correctamente `api/`, `_next/static`, `_next/image`, `favicon.ico`. `/api/auth/*` también excluido — correcto, NextAuth gestiona sus propias rutas. |
| AC-2 | PASS | `/admin/*` requiere sesión y `role === "admin"` verificado desde el callback de sesión en `auth.ts` (consulta BD en cada refresco). Si el callback falla, `role` queda `undefined` → redirect a `/`. Seguro por defecto. |
| AC-3 | PASS | Rutas privadas sin sesión redirigen a `/login?callbackUrl=<pathname>`. Orden de condiciones correcto. `/login/verify` y `/login/error` correctamente tratadas como `isAuthPage`. |
| AC-4 | PASS | Sin riesgo de open redirect: `callbackUrl` se construye desde `nextUrl.pathname` (siempre ruta relativa). NextAuth v5 valida internamente same-origin. |
| AC-5 | PASS | 7 hallazgos documentados en `.ai/reports/OP-130-findings.md`: 0 bloqueantes, 0 mejoras, 7 observaciones. |

### Hallazgos destacados
- **H-134-06** (Observación): `startsWith("/admin")` capturaría rutas como `/administrator` — sin impacto actual pero frágil a futuro.
- El middleware es el componente más robusto de los auditados en OP-130: 0 bloqueantes, 0 mejoras.

### Suite de verificación
| Check | Estado |
|-------|--------|
| OP-134-STRUCT-1: src/proxy.ts existe | PASS |
| OP-134-STRUCT-2: src/lib/auth.ts existe | PASS |
| OP-134-STRUCT-3: .ai/reports/OP-130-findings.md existe | PASS |
