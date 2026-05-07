# OP-460 — Revisión final de seguridad

## Contexto

La aplicación está funcionalmente completa tras las fases 2 y 3. Antes de producción se necesita una revisión de seguridad final: rate limiting, headers de seguridad, permisos y datos expuestos. Depende de OP-200 y OP-300.

## Objetivo

Realizar una auditoría final de seguridad e implementar medidas pendientes: rate limiting en endpoints sensibles, headers HTTP de seguridad, revisión de permisos y documentación del modelo de seguridad.

## Restricciones

- Rate limiting debe funcionar en Vercel (serverless) — considerar limitaciones
- Headers de seguridad via next.config.ts
- No romper funcionalidad existente con las medidas de seguridad
- Depende de OP-200 y OP-300

## Casos límite

- Rate limiting en serverless — cold starts pueden resetear contadores in-memory
- CSP que bloquea recursos legítimos (inline styles de Tailwind, scripts)
- Headers demasiado restrictivos que rompen funcionalidad en ciertos navegadores

## Criterios de aceptación

- AC-1: Rate limiting implementado — en endpoints sensibles: login (magic link), creación de reservas
- AC-2: Headers de seguridad configurados — CSP, X-Frame-Options, X-Content-Type-Options, etc. en next.config.ts
- AC-3: Permisos y datos expuestos revisados — auditoría de todos los endpoints: no devuelven campos internos (_id innecesario, datos de otros usuarios no autorizados)
- AC-4: Modelo de seguridad documentado — resumen del modelo implementado: autenticación, autorización, protección de datos, rate limiting

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas

| ID | Título |
|----|--------|
| OP-461 | Implementar rate limiting |
| OP-462 | Configurar headers de seguridad |
| OP-463 | Revisión de permisos y datos expuestos |
| OP-464 | Documentar modelo de seguridad |
