# OP-145 — Documentar hallazgos OP-140

## Contexto
Esta subtarea cierra la auditoría OP-140 consolidando los hallazgos de las cuatro revisiones anteriores:

| Subtarea | Alcance |
|----------|---------|
| OP-141 | Configuración base de NextAuth (`auth.ts`) — adapter, provider, session, páginas |
| OP-142 | Callbacks `signIn` y `session` — autorización, enriquecimiento, tipado |
| OP-143 | `auth-mongodb-client.ts` y `api-auth.ts` — singleton MongoClient, `requireSession` |
| OP-144 | Páginas de auth — login, verify, error, layout, handler NextAuth |

El informe resultante es la fuente directa de trabajo para OP-160 (corrección de deficiencias). Debe ser suficientemente preciso para que OP-160 pueda priorizar y ejecutar sin necesidad de releer los ficheros auditados.

Esta subtarea no implica cambios en el código — solo produce documentación.

## Objetivo
Producir un informe consolidado de hallazgos de la auditoría OP-140, clasificados por severidad, con referencia al fichero y línea afectados, descripción del problema, riesgo real y propuesta de corrección orientativa para OP-160.

## Restricciones
- Solo documentar — no modificar código
- Los hallazgos deben referenciarse con ID únicos (`H-140-N`) para que OP-160 pueda trazarlos
- La severidad debe seguir la escala: **Bloqueante** / **Mejora** / **Observación**
- El informe vive como sección `## Hallazgos` al final de la spec de OP-145 (este fichero) y como sección `## Informe de hallazgos OP-140` en la spec de OP-140

## Escala de severidad

| Nivel | Criterio |
|-------|----------|
| **Bloqueante** | Vulnerabilidad de seguridad activa, comportamiento incorrecto o dato corrupto. Debe corregirse antes de producción. |
| **Mejora** | Comportamiento subóptimo, deuda técnica o riesgo bajo en condiciones normales. Recomendado corregir. |
| **Observación** | Inconsistencia menor, duplicación o código mejorable sin impacto funcional. Opcional. |

## Puntos de revisión

### Consolidación por subtarea
- Recoger todos los puntos identificados en OP-141 a OP-144 que requieren atención
- Descartar los puntos que resultaron correctos tras revisión
- Agrupar hallazgos relacionados si afectan al mismo problema raíz

### Estructura de cada hallazgo
Cada hallazgo debe incluir:
- **ID**: `H-140-N` (N incremental)
- **Severidad**: Bloqueante / Mejora / Observación
- **Subtarea origen**: OP-141 / OP-142 / OP-143 / OP-144
- **Fichero(s) afectado(s)**: ruta relativa
- **Descripción**: qué está mal o qué falta
- **Riesgo**: consecuencia real si no se corrige
- **Propuesta**: corrección orientativa para OP-160

### Candidatos a hallazgo identificados durante el diseño de specs

Los siguientes puntos fueron identificados durante la elaboración de OP-141 a OP-144 como potenciales hallazgos. Deben confirmarse o descartarse al ejecutar la auditoría:

**De OP-141 (configuración NextAuth):**
- Variables de entorno de email sin validación en tiempo de módulo — si `EMAIL_SERVER_*` no están definidas, el proveedor se registra con `undefined` silenciosamente
- `MONGODB_URI` sí se valida en `auth-mongodb-client.ts`, pero no hay validación equivalente para las variables de email en `auth.ts`

**De OP-142 (callbacks):**
- `session` callback no verifica `isActive` — un usuario desactivado después del login mantiene sesión activa hasta que expire (90 días)
- `session` callback silencia errores de BD con `catch {}` vacío — si falla el enriquecimiento, la sesión devuelve `id`, `role` y `name` sin asignar, pero el tipo los declara como obligatorios (inconsistencia tipo/runtime)
- `dbUser.role as UserRole` — cast explícito que enmascara un posible `undefined` si el campo no está en el documento

**De OP-143 (auth-mongodb-client y api-auth):**
- `getMongoClient()` tiene una race condition teórica: si dos llamadas concurrentes llegan antes de que `cached.promise` se asigne, podrían crear dos `MongoClient` (ventana muy corta, baja probabilidad)
- `requireSession()` no envuelve `auth()` en try/catch — una excepción de BD propaga un 500 no controlado al handler en lugar de un 401 o 503 limpio
- `MONGODB_URI` con valor vacío `""` pasa el `if (!MONGODB_URI)` — el cliente se construiría con URI vacía

**De OP-144 (páginas de auth):**
- `callbackUrl` tomado de `useSearchParams()` sin validación — NextAuth v5 aplica su propia sanitización, pero debe confirmarse si permite URLs externas (open redirect)
- `login/error/page.tsx` no lee `?error=` de la URL — correcto desde el punto de vista de seguridad, pero debe confirmarse que el comportamiento es intencional

## Casos límite
- Dos hallazgos relacionados con el mismo fichero — agruparlos bajo un único ID con subapartados
- Hallazgo que ya tiene workaround implícito en el código — documentar el workaround y valorar si es suficiente
- Punto identificado como candidato que resulta correcto tras revisión — documentar explícitamente como "revisado — sin hallazgo" para dejar trazabilidad

## Criterios de aceptación
- AC-1: Todos los puntos candidatos de OP-141 a OP-144 están revisados y resueltos (confirmados como hallazgo o descartados con justificación)
- AC-2: Cada hallazgo confirmado tiene ID `H-140-N`, severidad, fichero, descripción, riesgo y propuesta de corrección
- AC-3: Los hallazgos bloqueantes están claramente diferenciados de mejoras y observaciones
- AC-4: El informe es suficientemente preciso para que OP-160 pueda ejecutar las correcciones sin releer los ficheros auditados
- AC-5: La sección `## Informe de hallazgos OP-140` se añade también a la spec de OP-140 como referencia cruzada
- AC-6: La spec de OP-145 se actualiza con `## Execution Result` al completar la tarea

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result
