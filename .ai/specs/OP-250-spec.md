# OP-250 — Flujo de reserva y cancelación en UI

## Contexto
El detalle de mesa (OP-230) tiene botones de reservar y cancelar, y la integración con API (OP-240) carga datos de disponibilidad. Falta conectar las acciones del usuario con los endpoints de reserva (POST /api/reservations y DELETE /api/reservations/[id]) y actualizar la UI de forma optimista. Depende de OP-230 y OP-240.

## Objetivo
Implementar el flujo completo de reserva y cancelación desde la UI: el usuario confirma, se actualiza la UI inmediatamente (optimista), se llama al API, y si falla se revierte el cambio mostrando error.

## Restricciones
- Actualización optimista obligatoria — el cambio visual debe ser inmediato
- Rollback si el backend rechaza — la UI debe volver al estado anterior
- No duplicar lógica de validación del backend en el frontend
- Depende de OP-230 y OP-240

## Casos límite
- Dos usuarios reservan la misma mesa casi simultáneamente — uno recibirá error del backend, debe hacer rollback
- Usuario pierde conexión durante la reserva — rollback + mensaje de error
- Usuario cancela y re-reserva rápidamente — manejar estados intermedios
- Backend rechaza por "ya tienes reserva hoy" — rollback + mensaje explicativo

## Criterios de aceptación
- AC-1: Hook useReservation creado — llama a POST /api/reservations (reservar) y DELETE /api/reservations/[id] (cancelar)
- AC-2: Actualización optimista al reservar — mesa pasa a rojo inmediatamente antes de respuesta del servidor
- AC-3: Actualización optimista al cancelar — mesa vuelve a verde/amarillo inmediatamente antes de respuesta
- AC-4: Rollback en caso de error — si el backend rechaza, se revierte el cambio optimista y se muestra mensaje de error al usuario
- AC-5: Tests del flujo implementados — verifican actualización inmediata, rollback en error, y coherencia de estado

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-251 | Hook useReservation |
| OP-252 | Actualización optimista al reservar |
| OP-253 | Actualización optimista al cancelar |
| OP-254 | Rollback en caso de error |
| OP-255 | Tests del flujo de reserva/cancelación |
