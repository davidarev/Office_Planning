# OP-141 — Revisar configuración de NextAuth

## Contexto
La configuración de NextAuth se centraliza en `src/lib/auth.ts`. Fue implementada como parte de la rama `02-auth-and-sessions` usando NextAuth.js v5 (beta) con:
- Proveedor `EmailProvider` (magic link)
- Adapter `MongoDBAdapter` con conexión propia (`auth-mongodb-client`)
- Estrategia de sesión `database` con persistencia de 90 días
- Páginas personalizadas en `/login`, `/login/verify` y `/login/error`

Esta subtarea forma parte de la auditoría OP-140 y no implica cambios en el código.

## Objetivo
Verificar que la configuración base de NextAuth — adapter, provider, session strategy, maxAge, updateAge y páginas personalizadas — es correcta, segura y coherente con los requisitos del sistema.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se aplican en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Adapter y conexión MongoDB
- `MongoDBAdapter(getMongoClient())` — ¿usa una conexión nativa separada (no Mongoose) tal como exige el adapter?
- ¿`getMongoClient()` devuelve una `Promise<MongoClient>` compatible con la firma esperada por `@auth/mongodb-adapter`?
- ¿La conexión del adapter es independiente de `connectDB()` (Mongoose)? Verificar que no comparten el mismo cliente y que no hay conflictos de cierre.

### Provider EmailProvider
- ¿Las variables de entorno `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` están todas referenciadas y no hardcodeadas?
- ¿`EMAIL_SERVER_PORT` se convierte a `Number(...)` antes de pasarse al proveedor?
- ¿Hay riesgo de que el proveedor se registre con valores `undefined` si las variables no están definidas en el entorno?

### Session strategy
- ¿`strategy: "database"` es coherente con el uso de `MongoDBAdapter`?
- ¿`maxAge: 90 * 24 * 60 * 60` equivale a 90 días?
- ¿`updateAge: 24 * 60 * 60` equivale a 24 horas y es un valor razonable?
- ¿La combinación de adapter + `strategy: "database"` garantiza que la sesión se almacena en MongoDB y no en JWT?

### Páginas personalizadas
- ¿Las rutas `/login`, `/login/verify` y `/login/error` existen en el proyecto?
- ¿Los nombres `signIn`, `verifyRequest` y `error` son los keys correctos para NextAuth v5?
- ¿El flujo de páginas es coherente con el flujo de magic link (solicitud → verificación → error)?

### Aspectos transversales
- ¿`auth.ts` exporta correctamente `handlers`, `signIn`, `signOut`, `auth` — todas las entidades que NextAuth v5 espera exportar?
- ¿Hay algún secreto o credencial hardcodeada en el fichero?
- ¿El fichero está documentado con JSDoc de forma suficiente para entender las decisiones clave?

## Casos límite
- Variables de entorno de email no definidas en producción — ¿qué ocurre si el proveedor recibe `undefined`?
- Caída de MongoDB durante la renovación de sesión (`updateAge`) — ¿la sesión sigue siendo accesible o se destruye?
- Dos instancias simultáneas del adaptador intentando conectar — ¿hay gestión de singleton en `getMongoClient()`?

## Criterios de aceptación
- AC-1: Verificar que el adapter usa `MongoDBAdapter` con una conexión nativa independiente de Mongoose y compatible con la firma de `@auth/mongodb-adapter`
- AC-2: Verificar que el `EmailProvider` referencia todas las variables de entorno sin hardcoding y que el puerto se convierte a `Number`
- AC-3: Verificar que `strategy: "database"` con `maxAge` de 90 días y `updateAge` de 24 horas es correcto y coherente con MongoDB adapter
- AC-4: Verificar que las páginas personalizadas existen en el proyecto y los keys de configuración son los correctos para NextAuth v5
- AC-5: Verificar que las exportaciones (`handlers`, `signIn`, `signOut`, `auth`) son las esperadas por NextAuth v5 y no hay credenciales hardcodeadas
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
  - AC-1: PASS — `MongoDBAdapter(getMongoClient())` usa `Promise<MongoClient>` nativo, independiente de Mongoose. Singleton correcto con `global.mongoClientCache`.
  - AC-2: PASS — Todas las variables de entorno referenciadas sin hardcoding. `Number(EMAIL_SERVER_PORT)` correcto. Observación: sin validación defensiva para `NaN` si la variable no está definida.
  - AC-3: PASS — `strategy: "database"` + MongoDBAdapter garantiza sesión en MongoDB. `maxAge` = 90 días y `updateAge` = 24h son correctos.
  - AC-4: PASS — `/login`, `/login/verify` y `/login/error` existen en `src/app/(auth)/`. Keys `signIn`, `verifyRequest`, `error` son los correctos para NextAuth v5.
  - AC-5: PASS — Exportaciones `handlers`, `signIn`, `signOut`, `auth` correctas. Sin credenciales hardcodeadas. JSDoc adecuado.
  - AC-6: PASS — Hallazgo H-141-1 registrado en `.ai/reports/OP-140-findings.md` con severidad "Mejora".
- Ficheros auditados (sin modificaciones):
  - `src/lib/auth.ts`
  - `src/lib/auth-mongodb-client.ts`
  - `src/lib/mongodb.ts`
  - `src/app/(auth)/login/`
  - `src/app/(auth)/login/verify/`
  - `src/app/(auth)/login/error/`
- Ficheros creados:
  - `.ai/reports/OP-140-findings.md` (hallazgo H-141-1)
- verify:
  - Comando ejecutado: auditoría estática (tarea de solo lectura, sin cambios de código)
  - Resultado: PASS — todos los AC verificados manualmente contra el código fuente
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: lectura y análisis de ficheros, redacción del informe de hallazgos y Execution Result
- Decisiones técnicas:
  - El riesgo de `NaN` en `EMAIL_SERVER_PORT` se clasifica como "Mejora" (no bloqueante) porque el fallo ocurriría en el primer envío de email, no en arranque, y es detectado en QA si el entorno de staging está configurado.
