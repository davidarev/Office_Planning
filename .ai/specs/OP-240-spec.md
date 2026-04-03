# OP-240 — Integración con API de disponibilidad

## Contexto
Los endpoints de disponibilidad ya existen: GET /api/availability (día individual) y GET /api/availability/week (semana completa). El componente de plano (OP-220) renderiza mesas pero aún no está conectado a datos reales de disponibilidad. Depende de OP-220.

## Objetivo
Conectar el plano de mesas con los endpoints de disponibilidad existentes. Crear hooks para cargar datos al seleccionar un día y precargar la semana completa para reducir llamadas individuales.

## Restricciones
- Usar los endpoints existentes sin modificarlos
- No introducir librerías de data fetching (SWR, React Query) — hooks nativos con fetch/axios
- Mostrar estados de carga y error en la UI
- Depende de OP-220

## Casos límite
- API no disponible o timeout — mostrar error, permitir reintentar
- Respuesta vacía (no hay mesas) — mostrar estado vacío
- Cambio rápido de día antes de que la respuesta anterior llegue (race condition)
- Datos de disponibilidad inconsistentes con mesas cargadas (mesa eliminada entre cargas)

## Criterios de aceptación
- AC-1: Hook useAvailability creado — llama a GET /api/availability con fecha seleccionada, devuelve datos de disponibilidad
- AC-2: Carga de datos al cambiar día funcional — al seleccionar nuevo día se recarga la disponibilidad del plano
- AC-3: Precarga de semana completa implementada — usa GET /api/availability/week para cargar toda la semana de una vez
- AC-4: Estados de carga y error manejados — indicador de carga mientras se obtienen datos, mensaje de error si falla con opción de reintentar
- AC-5: Tests del hook implementados — verifican llamadas al API, manejo de respuesta y estados de carga/error

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas
| ID | Título |
|----|--------|
| OP-241 | Hook useAvailability |
| OP-242 | Carga de datos al cambiar día |
| OP-243 | Precarga de semana completa |
| OP-244 | Manejo de estados de carga y error |
| OP-245 | Tests de integración del hook |
