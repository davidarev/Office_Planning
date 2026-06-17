# OP-111 — Revisar schema User

## Contexto
El schema Mongoose `User` está definido en `src/lib/models/user.model.ts` y se basa en la interfaz `IUser` de `src/domain/types/user.ts`. Fue implementado en la rama `03-data-model-and-layer-access`. Esta subtarea forma parte de la auditoría OP-110 y no implica cambios en el código — solo análisis y documentación de hallazgos.

## Objetivo
Verificar que el schema `UserSchema` es correcto, completo y coherente con las reglas funcionales definidas en `README.md §3` (gestión de usuarios). Identificar cualquier inconsistencia, campo faltante, validación ausente o índice inadecuado.

## Restricciones
- Solo auditar — no modificar código
- Los hallazgos se consolidan en OP-115 y se corrigen en OP-160
- No introducir cambios funcionales ni estructurales

## Puntos de revisión

### Campos del schema
- `name`: required, trim — verificar si hay validación de longitud mínima/máxima
- `email`: required, unique, lowercase, trim — verificar normalización y si falta validación de formato
- `role`: enum `["user", "admin"]`, default `"user"` — verificar coherencia con `UserRole` en tipos
- `isActive`: Boolean, default `true` — verificar si es suficiente para controlar acceso

### Índices
- Índice `unique` en `email` (implícito via schema `unique: true`) — verificar si se declara también de forma explícita para visibilidad
- Ausencia de índice en `role` o `isActive` — evaluar si los patrones de acceso lo requieren

### Timestamps
- `timestamps: true` genera `createdAt` y `updatedAt` — verificar coherencia con `IUser` que los declara explícitamente

### Coherencia con tipos
- Verificar que todos los campos de `IUser` tienen correspondencia en el schema y viceversa
- Verificar que el enum `role` del schema coincide exactamente con `UserRole = "user" | "admin"`

## Casos límite
- Email en mayúsculas que debería normalizarse a minúsculas — `lowercase: true` lo cubre, pero ¿hay test que lo valide?
- Usuario desactivado (`isActive: false`) que intenta autenticarse — ¿el schema previene esto o es responsabilidad del servicio?
- Schema sin validación explícita de formato de email — Mongoose no valida formato por defecto

## Criterios de aceptación
- AC-1: Verificar que todos los campos de `IUser` están presentes y correctamente tipados en `UserSchema`
- AC-2: Verificar que el enum `role` del schema coincide con `UserRole`
- AC-3: Verificar que el índice `unique` en `email` está correctamente configurado
- AC-4: Identificar cualquier validación ausente o campo sin restricción que debería tenerla
- AC-5: Documentar hallazgos con severidad (bloqueante / mejora / observación)

## Criterio de done
- Todos los AC en PASS
- Hallazgos registrados en la spec de OP-115
- Sin modificaciones al código fuente
