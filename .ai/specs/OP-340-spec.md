# OP-340 — UI de gestión de usuarios

## Contexto
Los endpoints de gestión de usuarios (OP-310) ya están implementados: GET, POST y PATCH /api/admin/users. Existe una página placeholder de admin con control de acceso. Falta la interfaz visual para gestionar usuarios. Depende de OP-310.

## Objetivo
Crear la interfaz de administración para listar, crear, editar y activar/desactivar usuarios desde el panel admin.

## Restricciones
- Accesible solo para rol admin (protección ya existe en middleware)
- Formularios con validación en frontend (complementaria a la del backend)
- Confirmación antes de desactivar usuario
- UI consistente con el resto de la aplicación (Tailwind CSS v4)
- Depende de OP-310

## Casos límite
- Lista vacía de usuarios (improbable pero posible en test)
- Error de red al crear/editar — mostrar mensaje, no perder datos del formulario
- Admin intenta desactivar al último admin — mostrar error del backend
- Email con formato inválido en formulario de creación

## Criterios de aceptación
- AC-1: Página /admin/users con listado implementada — tabla con todos los usuarios: nombre, email, rol, estado, con indicadores visuales de activo/inactivo
- AC-2: Formulario de creación implementado — modal o formulario para crear usuario: nombre, email, rol, con validación de campos
- AC-3: Formulario de edición implementado — modal o formulario para editar usuario existente: nombre, rol, estado, datos precargados
- AC-4: Acción de activar/desactivar implementada — botón o toggle con confirmación antes de desactivar
- AC-5: Tests de UI implementados — tests de componentes: listado, formularios, validaciones, acciones

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-341 | Página /admin/users con listado |
| OP-342 | Formulario de creación de usuario |
| OP-343 | Formulario de edición de usuario |
| OP-344 | Acción de activar/desactivar usuario |
| OP-345 | Tests de UI de gestión de usuarios |
