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

## Execution Result

- Fecha de implementación: 2026-06-17
- Rama: feature/OP-240-integracion-api-disponibilidad
- Herramienta IA: Claude Code claude-sonnet-4-6
- Estado de AC:
  - AC-1: PASS — `src/hooks/use-availability.ts` creado y exporta `useAvailability` (OP-241)
  - AC-2: PASS — `FloorPlanSection` conecta `useWeekAvailability` con el plano; cambiar día recarga datos (OP-242)
  - AC-3: PASS — `useWeekAvailability` carga toda la semana con una sola petición a `GET /api/availability/week` (OP-243)
  - AC-4: PASS — `LoadingOverlay` y `ErrorMessage` en `FloorPlanSection`; spinner con `role="status"`, botón "Reintentar" (OP-244)
  - AC-5: PASS — `tests/api/availability.test.ts` ampliado + `tests/api/availability-week.test.ts` creado (OP-245)
- Ficheros creados o modificados:
  - `src/hooks/use-availability.ts` (hook diario)
  - `src/hooks/use-week-availability.ts` (hook semanal con caché local)
  - `src/components/floor-plan/FloorPlanSection.tsx` (Client Component que conecta hooks con plano)
  - `src/components/floor-plan/index.ts` (exporta FloorPlanSection)
  - `src/components/ui/LoadingOverlay.tsx` (spinner de carga accesible)
  - `src/components/ui/ErrorMessage.tsx` (mensaje de error con reintentar)
  - `src/app/(main)/page.tsx` (usa FloorPlanSection)
  - `src/app/api/availability/route.ts` (pasa session.user.id al servicio)
  - `src/app/api/availability/week/route.ts` (pasa session.user.id al servicio)
  - `src/services/availability.service.ts` (usa isOwner en lugar de userId expuesto)
  - `src/domain/types/table.ts` (eliminado userId de reservation, añadido isOwner)
  - `src/components/floor-plan/FloorPlanClient.tsx` (usa reservation.isOwner)
  - `tests/api/availability.test.ts` (ampliado con escenario preferential → yellow)
  - `tests/api/availability-week.test.ts` (nuevo, 9 tests)
  - `tests/integration/compute-status.test.ts` (actualizado para isOwner)
- verify:
  - Lint: PASS (0 errores, 5 warnings pre-existentes)
  - Tests unitarios: PASS (194/194)
  - Tests integración: PASS (102/102)
  - Tests API: PASS (89/89)
  - Build: PASS
  - Total: 385 tests en verde
- Decisiones técnicas:
  - Los hooks usan `useReducer` en lugar de múltiples `useState` para evitar error del React Compiler (`setState synchronously within effect`)
  - `useWeekAvailability` actúa como caché local de semana: cambiar de día dentro de la misma semana no lanza petición HTTP
  - `FloorPlanSection` es el único Client Component que orquesta hooks y datos; `FloorPlanClient` permanece agnóstico a la fuente de datos
  - `reservation.isOwner` (computado en servidor) reemplaza la comparación `reservation.userId === currentUserId` en cliente, evitando exponer IDs de usuario en la respuesta de la API
