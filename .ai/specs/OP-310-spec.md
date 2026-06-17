# OP-310 — API de gestión de usuarios (admin)

## Contexto
El modelo User ya existe con campos name, email, role (user/admin) e isActive. El repositorio user.repository tiene operaciones CRUD básicas. No existen endpoints administrativos para gestionar usuarios. El middleware de protección de rutas admin ya funciona. Sin dependencias internas en Fase 3.

## Objetivo
Crear endpoints API protegidos por rol admin para listar, crear, editar y activar/desactivar usuarios. Incluir validaciones de negocio (email único, no desactivar último admin).

## Restricciones
- Todos los endpoints protegidos por sesión + rol admin (401/403)
- Validar en backend: campos obligatorios, email único, coherencia de roles
- No exponer datos internos en respuestas de error
- No desactivar al último usuario admin del sistema
- Sin dependencias internas

## Casos límite
- Crear usuario con email ya existente — error 409
- Desactivar último admin — error con mensaje explicativo
- Editar usuario inexistente — error 404
- Admin intenta desactivarse a sí mismo siendo el último admin
- Campos opcionales vs obligatorios en PATCH (edición parcial)

## Criterios de aceptación
- AC-1: Helper requireAdmin creado — verifica sesión + rol admin, devuelve 401 (sin sesión) o 403 (sin rol admin)
- AC-2: GET /api/admin/users implementado — lista todos los usuarios (activos e inactivos) con paginación básica, protegido por admin
- AC-3: POST /api/admin/users implementado — crea usuario con validación de campos obligatorios (name, email, role), verifica email único
- AC-4: PATCH /api/admin/users/[id] implementado — edita name, role, isActive; valida que no se desactive al último admin
- AC-5: Tests de API implementados — creación, edición, activación/desactivación, protección por rol, validaciones

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-311 | Utilidad requireAdmin |
| OP-312 | Endpoint GET /api/admin/users |
| OP-313 | Endpoint POST /api/admin/users |
| OP-314 | Endpoint PATCH /api/admin/users/[id] |
| OP-315 | Tests de API de gestión de usuarios |
