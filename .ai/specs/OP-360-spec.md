# OP-360 — UI de gestión de reservas (admin)

## Contexto
Los endpoints de gestión de reservas (OP-330) ya están implementados: GET /api/admin/reservations con filtros y cancelación administrativa vía DELETE. Falta la interfaz visual para que el admin consulte y gestione reservas. Depende de OP-330.

## Objetivo
Crear la interfaz de administración para consultar reservas con filtros (fecha, usuario, mesa) y permitir cancelación administrativa con confirmación.

## Restricciones
- Accesible solo para rol admin
- Filtros funcionales (fecha, usuario, mesa) que llaman al endpoint con los parámetros adecuados
- Confirmación obligatoria antes de cancelar reserva
- UI consistente con el resto de la aplicación
- Depende de OP-330

## Casos límite
- Sin reservas para los filtros seleccionados — mostrar estado vacío
- Cancelar reserva ya cancelada — manejar error del backend
- Filtro por rango de fechas inválido (fecha inicio > fecha fin)
- Gran cantidad de reservas — paginación o scroll

## Criterios de aceptación
- AC-1: Página /admin/reservations con listado implementada — tabla de reservas con: fecha, mesa, usuario, estado; filtros por fecha y estado
- AC-2: Filtros de búsqueda implementados — filtros por rango de fechas, por usuario y por mesa funcionales
- AC-3: Acción de cancelar reserva implementada — botón para cancelar cualquier reserva activa con confirmación y feedback visual
- AC-4: Tests de UI implementados — tests de componentes: listado, filtros, acción de cancelación

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-361 | Página /admin/reservations con listado |
| OP-362 | Filtros de búsqueda |
| OP-363 | Acción de cancelar reserva (admin) |
| OP-364 | Tests de UI de gestión de reservas |
