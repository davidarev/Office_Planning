# OP-230 — Detalle de mesa y acción de reserva

## Contexto
El componente de plano (OP-220) renderiza las mesas con sus estados visuales. Al pulsar una mesa, el usuario necesita ver un detalle con información completa y poder realizar acciones (reservar si está libre, cancelar si es su reserva). Los endpoints de reserva (POST /api/reservations, DELETE /api/reservations/[id]) ya existen. Depende de OP-220.

## Objetivo
Crear el componente de detalle de mesa que se muestra al pulsar sobre una mesa del plano, con información completa (nombre, tipo, estado, ocupante) y botones de acción contextuales (reservar, cancelar reserva propia).

## Restricciones
- No incluir lógica de negocio en el componente — las reglas viven en los servicios
- Los botones de acción deben estar condicionados al estado real de la mesa y del usuario (no solo visual)
- Mensajes contextuales según README.md §7 y §8
- Depende de OP-220

## Casos límite
- Usuario pulsa mesa bloqueada — solo mostrar info, sin acción
- Usuario ya tiene reserva en otra mesa ese día — mostrar aviso, sin botón de reservar
- Mesa preferente de otro usuario, libre — mostrar aviso de preferencia + botón reservar
- Mesa fija de otro usuario — mostrar como ocupada, sin acción
- Usuario pulsa su propia mesa reservada — mostrar botón cancelar

## Criterios de aceptación
- AC-1: Panel/modal de detalle implementado — se muestra al pulsar una mesa con info completa: nombre, tipo, estado, ocupante/asociado
- AC-2: Botón "Reservar" visible cuando la mesa está disponible (verde o amarillo) y el usuario no tiene reserva ese día
- AC-3: Botón "Cancelar reserva" visible cuando la mesa está ocupada por el usuario actual
- AC-4: Mensajes informativos contextuales implementados — "Mesa preferente de [nombre]", "Ocupada por [nombre]", "Mesa bloqueada", "Ya tienes reserva en otra mesa"
- AC-5: Tests del panel de detalle implementados — verifican info correcta y botones adecuados según estado y usuario

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-231 | Panel o modal de detalle de mesa |
| OP-232 | Botón de reservar |
| OP-233 | Botón de cancelar reserva propia |
| OP-234 | Mensajes informativos por estado |
| OP-235 | Tests del panel de detalle |
