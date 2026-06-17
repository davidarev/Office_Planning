# OP-330 — API de gestión de reservas (admin)

## Contexto
Los endpoints de reservas ya existen para usuarios normales (GET, POST, DELETE). El servicio reservation.service ya contempla cancelación por admin. Faltan endpoints específicos de consulta administrativa con filtros avanzados. Sin dependencias internas en Fase 3.

## Objetivo
Crear endpoint administrativo para consultar reservas con filtros (fecha, usuario, mesa) y verificar/ampliar que el endpoint de cancelación existente permite cancelación por admin.

## Restricciones
- Endpoint de consulta protegido por rol admin
- Reutilizar lógica de cancelación existente si ya soporta admin
- Incluir datos enriquecidos en consultas (nombre usuario, etiqueta mesa)
- Sin dependencias internas

## Casos límite
- Consulta sin filtros — devolver todas las reservas (con paginación)
- Filtro por rango de fechas muy amplio — limitar rango máximo
- Admin cancela reserva de usuario — verificar que el servicio lo soporta
- Reserva ya cancelada — manejar doble cancelación

## Criterios de aceptación
- AC-1: GET /api/admin/reservations implementado — lista reservas con filtros por fecha, usuario o mesa, datos enriquecidos (nombre usuario, etiqueta mesa), protegido por admin
- AC-2: DELETE /api/reservations/[id] verificado/ampliado para admin — el endpoint existente permite cancelación por admin (verificar y ajustar si necesario)
- AC-3: Tests de API implementados — consulta con filtros, cancelación administrativa, protección por rol

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-331 | Endpoint GET /api/admin/reservations |
| OP-332 | Ampliar DELETE /api/reservations/[id] para admin |
| OP-333 | Tests de API de gestión de reservas |
