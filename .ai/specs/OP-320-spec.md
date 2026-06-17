# OP-320 — API de gestión de mesas (admin)

## Contexto
El modelo Table ya existe con campos label, type (flexible/fija/preferente/bloqueada), position (x, y, width, height, rotation), assignedTo e isActive. El repositorio table.repository tiene operaciones básicas. No existen endpoints administrativos para gestionar mesas. Sin dependencias internas en Fase 3.

## Objetivo
Crear endpoints API protegidos por rol admin para listar, crear, editar y configurar mesas. Incluir validaciones de coherencia tipo-asignación (fija/preferente requieren assignedTo, flexible/bloqueada no).

## Restricciones
- Todos los endpoints protegidos por sesión + rol admin
- Validar coherencia tipo-asignación en backend
- No permitir crear mesas con labels duplicados
- Reutilizar helper requireAdmin de OP-310 si ya existe
- Sin dependencias internas

## Casos límite
- Crear mesa fija sin assignedTo — error de validación
- Cambiar tipo de mesa fija a flexible — limpiar assignedTo automáticamente
- Crear mesa con label duplicado — error 409
- Editar posición de mesa con valores negativos o fuera de rango
- Desactivar mesa con reservas futuras confirmadas — ¿qué pasa con las reservas?

## Criterios de aceptación
- AC-1: GET /api/admin/tables implementado — lista todas las mesas (activas e inactivas) con datos completos incluyendo usuario asignado, protegido por admin
- AC-2: POST /api/admin/tables implementado — crea mesa con validación de campos (label, type, position), asigna usuario si aplica
- AC-3: PATCH /api/admin/tables/[id] implementado — edita todos los campos, valida coherencia tipo-asignación
- AC-4: Lógica de validación tipo-asignación implementada — fija/preferente requieren assignedTo, flexible/bloqueada no lo tienen (o se limpia)
- AC-5: Tests de API implementados — creación, edición, validación de coherencia, protección por rol

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-321 | Endpoint GET /api/admin/tables |
| OP-322 | Endpoint POST /api/admin/tables |
| OP-323 | Endpoint PATCH /api/admin/tables/[id] |
| OP-324 | Lógica de validación tipo-asignación |
| OP-325 | Tests de API de gestión de mesas |
