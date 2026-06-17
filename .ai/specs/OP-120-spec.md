# OP-120 — Auditoría de repositorios y servicios

## Contexto
La capa de acceso a datos (`src/lib/db/`) y la lógica de negocio (`src/services/`) fueron implementadas en las ramas `03-data-model-and-layer-access` y `04-availability-booking-concurrency`. Incluyen repositorios para User, Table y Reservation, y servicios de disponibilidad, reservas y mesas. La auditoría de modelos (OP-110) debe completarse primero para tener clara la base de datos sobre la que trabajan.

## Objetivo
Revisar la capa de repositorios y servicios para verificar manejo de errores, validaciones, documentación JSDoc, y cumplimiento de las reglas de dominio (1 reserva/usuario/día, concurrencia, mesa bloqueada no reservable, etc.).

## Restricciones
- No modificar código — solo auditar y documentar
- Los hallazgos se aplican en OP-160
- Depende de OP-110 completada

## Casos límite
- Queries que no filtran por status=confirmed cuando deberían
- Manejo de error E11000 (duplicado MongoDB) inconsistente
- Funciones sin JSDoc o con JSDoc incompleto
- Lógica de negocio filtrada a repositorios o viceversa

## Criterios de aceptación
- AC-1: reservation.repository revisado — queries, filtros por status, uso de lean(), manejo de E11000 verificados
- AC-2: table.repository y user.repository revisados — queries, filtros por isActive, ordenación verificados
- AC-3: reservation.service revisado — reglas de negocio (1 reserva/usuario/día, 1 reserva/mesa/día, mesa bloqueada, cancelación por owner/admin, concurrencia) verificadas
- AC-4: availability.service revisado — lógica de estados (green/yellow/red/gray), prioridades, resolución batch de nombres, eficiencia en rangos verificada
- AC-5: table.service revisado — operaciones de lectura, filtrado, estructura de respuesta verificados
- AC-6: Documentación JSDoc de todas las funciones públicas verificada (completitud y corrección)
- AC-7: Informe de hallazgos documentado

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-121 | Revisar reservation.repository |
| OP-122 | Revisar table.repository y user.repository |
| OP-123 | Revisar reservation.service |
| OP-124 | Revisar availability.service |
| OP-125 | Revisar table.service |
| OP-126 | Verificar documentación JSDoc |
| OP-127 | Documentar hallazgos OP-120 |
