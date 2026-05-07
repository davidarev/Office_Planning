# OP-260 — Polling periódico y actualización

## Contexto
La integración con API (OP-240) carga datos de disponibilidad y el flujo de reserva (OP-250) permite cambios optimistas. Falta implementar refresco automático para que los cambios de otros usuarios se reflejen sin recarga manual. README.md §10 establece polling + actualización optimista como enfoque. Depende de OP-240.

## Objetivo
Implementar polling periódico configurable que refresque los datos de disponibilidad automáticamente, con pausa en inactividad y reconciliación con cambios optimistas pendientes.

## Restricciones
- Sin WebSockets — solo polling periódico (README.md §10)
- Intervalo configurable, por defecto 30 segundos
- Pausar cuando el tab no está visible (Page Visibility API)
- No perder cambios optimistas pendientes al recibir datos nuevos
- Depende de OP-240

## Casos límite
- Tab en background durante mucho tiempo — al volver, refrescar inmediatamente
- Cambio optimista pendiente cuando llega polling — no sobrescribir el cambio local
- Polling durante cambio de día — cancelar polling del día anterior
- Múltiples polls simultáneos por timing — evitar duplicados

## Criterios de aceptación
- AC-1: Polling con intervalo configurable implementado — refresco automático cada N segundos (default 30s)
- AC-2: Pausa en inactividad implementada — polling se detiene cuando tab no visible (Page Visibility API) o usuario inactivo
- AC-3: Reconciliación de datos implementada — datos nuevos del servidor actualizan el plano sin perder cambios optimistas pendientes de confirmación
- AC-4: Tests del polling implementados — verifican intervalo, pausa en inactividad y reconciliación

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-261 | Polling con intervalo configurable |
| OP-262 | Pausar polling en inactividad |
| OP-263 | Reconciliar datos de polling con estado local |
| OP-264 | Tests del polling |
