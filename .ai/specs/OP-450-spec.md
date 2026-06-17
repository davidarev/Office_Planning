# OP-450 — Tests E2E del flujo crítico

## Contexto

El proyecto tiene tests unitarios, de integración y de API, pero no tests end-to-end. El flujo crítico (login -> ver plano -> reservar -> cancelar) necesita validación de punta a punta. Depende de OP-200 completada.

## Objetivo

Configurar un framework E2E y crear tests automatizados del flujo principal: login, visualización del plano, reserva de mesa y cancelación.

## Restricciones

- Framework recomendado: Playwright
- Base de datos de prueba separada para E2E
- Mock de email para magic link (no enviar emails reales en tests)
- Depende de OP-200

## Casos límite

- Test de login con magic link — necesita mock del envío de email y extracción del link
- Test que depende de estado de BD — setup/teardown limpio
- Timing issues con polling — esperar cambios de estado adecuadamente
- Tests que fallan en CI pero pasan en local (headless vs headed)

## Criterios de aceptación

- AC-1: Framework E2E configurado — Playwright instalado y configurado con entorno de test (BD de prueba, mock de email)
- AC-2: Test E2E de login implementado — flujo automatizado: email -> magic link -> acceso autenticado
- AC-3: Test E2E de ver plano y reservar implementado — acceder al plano, seleccionar día, pulsar mesa libre, confirmar reserva, verificar cambio de estado
- AC-4: Test E2E de cancelar reserva implementado — acceder con reserva existente, pulsar mesa propia, cancelar, verificar estado

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas

| ID | Título |
|----|--------|
| OP-451 | Configurar framework E2E |
| OP-452 | Test E2E: flujo de login |
| OP-453 | Test E2E: ver plano y reservar |
| OP-454 | Test E2E: cancelar reserva |
