# OP-430 — Configuración de email para producción

## Contexto

La autenticación usa magic link via email (NextAuth.js v5). En desarrollo se usa un proveedor de prueba o consola. Para producción se necesita un proveedor de email real que envíe los magic links. Sin dependencias internas.

## Objetivo

Seleccionar, configurar y verificar un proveedor de email real para el envío de magic links en producción. Personalizar la plantilla del email y documentar la configuración.

## Restricciones

- El proveedor debe ser compatible con NextAuth.js v5
- Variables de entorno para credenciales (nunca hardcodeadas)
- Email debe funcionar en Vercel (serverless)
- Sin dependencias internas

## Casos límite

- Proveedor de email con rate limiting — manejar errores de throttling
- Email que cae en spam — considerar configuración de SPF/DKIM
- Timeout del proveedor — NextAuth debe manejar el error gracefully
- Dominio de email que requiere verificación previa

## Criterios de aceptación

- AC-1: Proveedor de email seleccionado y configurado — credenciales en variables de entorno, compatible con NextAuth.js v5 y Vercel
- AC-2: Plantilla de magic link personalizada — branding básico, instrucciones claras, aspecto profesional
- AC-3: Envío verificado en staging — flujo completo probado con proveedor real en entorno de pre-producción
- AC-4: Configuración documentada — variables de entorno necesarias (EMAIL_SERVER_*, EMAIL_FROM) y pasos de configuración documentados

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas

| ID | Título |
|----|--------|
| OP-431 | Seleccionar y configurar proveedor de email |
| OP-432 | Personalizar plantilla de magic link |
| OP-433 | Verificar envío en staging |
| OP-434 | Documentar configuración de email |
