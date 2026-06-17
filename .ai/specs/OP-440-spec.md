# OP-440 — Variables de entorno y despliegue Vercel

## Contexto

La aplicación debe desplegarse en Vercel (README.md §13). Se necesita preparar la configuración de entorno, documentar el proceso y verificar que el build funciona en producción. La configuración de email (OP-430) debe estar lista. Depende de OP-430.

## Objetivo

Preparar la aplicación para despliegue en Vercel: configurar variables de entorno, verificar build de producción y documentar el proceso completo.

## Restricciones

- No exponer secretos en repositorio — todo via variables de entorno de Vercel
- Build de producción debe pasar sin errores
- Documentar TODAS las variables necesarias en .env.example
- Depende de OP-430

## Casos límite

- Variable de entorno faltante en Vercel — la app debe fallar con mensaje claro
- Build que pasa en local pero falla en Vercel (diferencias de Node.js, memoria)
- MongoDB Atlas con IP whitelisting — documentar configuración necesaria

## Criterios de aceptación

- AC-1: .env.example completo creado — todas las variables de entorno con valores de ejemplo y descripciones
- AC-2: Proyecto configurado en Vercel — repositorio conectado, variables de producción configuradas
- AC-3: Build de producción verificado — build exitoso en Vercel, aplicación funcional en entorno de producción
- AC-4: Proceso de despliegue documentado — guía breve: pasos para configurar, desplegar y verificar

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result

## Subtareas

| ID | Título |
|----|--------|
| OP-441 | Crear .env.example completo |
| OP-442 | Configurar proyecto en Vercel |
| OP-443 | Verificar build de producción |
| OP-444 | Documentar proceso de despliegue |
