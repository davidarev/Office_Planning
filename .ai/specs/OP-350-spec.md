# OP-350 — UI de gestión de mesas

## Contexto
Los endpoints de gestión de mesas (OP-320) ya están implementados: GET, POST y PATCH /api/admin/tables. Falta la interfaz visual para gestionar mesas desde el panel admin. Depende de OP-320.

## Objetivo
Crear la interfaz de administración para listar, crear, editar y configurar mesas (tipo, posición, usuario asignado) desde el panel admin.

## Restricciones
- Accesible solo para rol admin
- Selector de usuario asignado solo visible para mesas fijas y preferentes
- Formulario de posición con campos numéricos (x, y, width, height, rotation)
- UI consistente con el resto de la aplicación
- Depende de OP-320

## Casos límite
- Cambiar tipo de mesa a fija sin seleccionar usuario — validación
- Lista de usuarios vacía en selector de asignación
- Posición con valores decimales o negativos
- Mesa con reservas activas que se desactiva — mostrar advertencia

## Criterios de aceptación
- AC-1: Página /admin/tables con listado implementada — tabla con todas las mesas: etiqueta, tipo, estado, usuario asignado, con indicadores visuales por tipo
- AC-2: Formulario de creación implementado — formulario para crear mesa: etiqueta, tipo, posición (x, y, width, height), usuario asignado si aplica
- AC-3: Formulario de edición implementado — formulario para editar mesa: todos los campos editables, datos precargados, selector de tipo con lógica de asignación
- AC-4: Selector de usuario asignado implementado — dropdown/search para seleccionar usuario en mesas fijas/preferentes, se muestra/oculta según tipo seleccionado
- AC-5: Tests de UI implementados — tests de componentes: listado, formularios, selector de usuario, validaciones

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-351 | Página /admin/tables con listado |
| OP-352 | Formulario de creación de mesa |
| OP-353 | Formulario de edición de mesa |
| OP-354 | Selector de usuario asignado |
| OP-355 | Tests de UI de gestión de mesas |
