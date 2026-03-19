# CLAUDE.md

## 1. Propósito

Este archivo define cómo debe trabajar Claude Code dentro de este proyecto.

Claude debe actuar como asistente de implementación técnica del producto, respetando el alcance definido en `README.md` y manteniendo un enfoque pragmático, seguro y mantenible.

El objetivo no es sobreingenierizar la solución, sino construir una aplicación interna sencilla, robusta, clara y fácil de evolucionar.

---

## 2. Contexto del proyecto

Este proyecto consiste en una aplicación web interna para reservar mesas en la oficina.

El contexto funcional, reglas del negocio y alcance del producto están definidos en `README.md`. Claude debe tomar ese archivo como fuente principal de contexto funcional.

Antes de proponer cambios estructurales o funcionales importantes, Claude debe comprobar que estén alineados con `README.md`.

Si detecta ambigüedades, debe:

1. priorizar la solución más simple y mantenible
2. no inventar lógica de negocio no definida
3. proponer supuestos de forma explícita

---

## 3. Principios de trabajo

Claude debe trabajar siguiendo estos principios:

- simplicidad antes que complejidad
- claridad antes que brillantez
- seguridad antes que comodidad
- mantenibilidad antes que soluciones “ingeniosas”
- consistencia antes que velocidad
- validación en backend aunque exista validación en frontend
- separación clara de responsabilidades
- código preparado para ser entendido y mantenido por humanos

Claude no debe introducir dependencias, patrones o abstracciones innecesarias sin una justificación clara.

---

## 4. Prioridades técnicas

Claude debe priorizar:

1. **seguridad**
2. **correctitud funcional**
3. **mantenibilidad**
4. **claridad del código**
5. **buena experiencia de usuario**
6. **optimización**, solo cuando sea necesaria

No debe sacrificar seguridad o claridad por reducir unas pocas líneas de código.

---

## 5. Reglas de implementación

### 5.1. Stack base
Claude debe asumir como stack principal:

- Next.js
- TypeScript
- MongoDB
- despliegue en Vercel

Si propone herramientas adicionales, deben ser coherentes con este stack y aportar valor real.

### 5.2. Tipado
Claude debe usar TypeScript de forma estricta y consistente.

Debe:

- evitar `any` o `unknown` salvo causa muy justificada
- definir tipos e interfaces claras
- tipar parámetros, retornos y estructuras de datos
- modelar explícitamente entidades del dominio

### 5.3. Arquitectura
Claude debe mantener una arquitectura ordenada y comprensible.

Debe procurar:

- separar UI, lógica de negocio y acceso a datos
- evitar meter lógica compleja directamente en componentes de interfaz
- centralizar reglas importantes del dominio
- minimizar duplicación de lógica
- favorecer funciones pequeñas y reutilizables

### 5.4. Base de datos
Claude debe diseñar el acceso a datos con claridad y sin mezclar reglas de negocio con detalles de persistencia.

Debe:

- modelar entidades de forma coherente con `README.md`
- proteger la integridad de reservas
- tener en cuenta concurrencia básica
- evitar estructuras frágiles o difíciles de mantener

### 5.5. Backend
Toda operación sensible debe validarse en backend.

Especialmente:

- autenticación
- autorización
- reserva de mesas
- cancelación de reservas
- cálculo de disponibilidad
- restricciones por usuario y fecha

Claude no debe asumir que el frontend es una fuente confiable.

---

## 6. Seguridad

La seguridad es obligatoria en todo el proyecto.

Claude debe tenerla en cuenta siempre, incluso cuando no se mencione explícitamente.

### 6.1. Requisitos generales
Claude debe:

- validar entradas
- sanitizar datos cuando corresponda
- proteger rutas privadas
- proteger rutas de administrador
- verificar sesiones y permisos en servidor
- minimizar exposición de datos sensibles
- usar variables de entorno para secretos
- evitar hardcodear credenciales, tokens o claves
- aplicar principio de mínimo privilegio cuando sea posible

### 6.2. Autenticación y autorización
Claude debe tratar la autenticación y autorización como partes críticas del sistema.

Debe:

- permitir acceso solo a usuarios existentes y activos
- impedir acceso a correos no autorizados
- diferenciar claramente usuarios normales y administradores
- proteger acciones administrativas mediante comprobación de rol en servidor
- asegurar que un usuario solo pueda actuar sobre sus propias reservas, salvo rol admin

### 6.3. Reservas y concurrencia
Claude debe contemplar que varios usuarios pueden intentar reservar a la vez.

Debe:

- validar disponibilidad en backend antes de confirmar
- evitar reservas duplicadas
- garantizar que una mesa no quede asignada a más de una persona el mismo día
- garantizar que un usuario no pueda reservar más de una mesa por día

### 6.4. Gestión de errores
Claude no debe exponer información sensible en errores.

Debe:

- registrar internamente lo útil para depuración
- devolver mensajes claros pero no excesivamente reveladores al usuario
- evitar filtrar detalles internos de infraestructura o base de datos

---

## 7. Documentación del código

Claude debe documentar el código de forma consistente, útil y no excesiva.

### 7.1. Estilo de documentación
Claude debe usar preferentemente uno de estos enfoques:

- formato tipo **JSDoc / JavaDoc**
- bloques de documentación consistentes sobre funciones, servicios, utilidades y módulos

No debe documentar línea por línea ni añadir ruido innecesario.

### 7.2. Qué debe documentarse
Claude debe documentar especialmente:

- funciones públicas o reutilizables
- servicios de dominio
- utilidades críticas
- reglas de negocio no triviales
- decisiones importantes de arquitectura
- módulos con comportamiento sensible

### 7.3. Qué debe explicar la documentación
Cuando documente una función o módulo, debe dejar claro:

- qué hace
- qué parámetros recibe
- qué devuelve
- qué errores o casos especiales contempla

---

## 8. Calidad de código

Claude debe generar código limpio y profesional.

Debe procurar:

- nombres claros y consistentes
- funciones pequeñas
- evitar anidamientos innecesarios
- evitar comentarios redundantes
- evitar duplicación
- evitar lógica mágica o implícita
- seguir convenciones homogéneas en todo el proyecto

Cuando detecte deuda técnica, puede señalarla, pero sin bloquear el avance

---

## 9. Testing y validación

Claude debe diseñar el código pensando en que pueda probarse con facilidad.

Aunque no todo requiera tests desde el primer momento, debe:

- escribir funciones desacopladas cuando tenga sentido
- facilitar pruebas de reglas de negocio
- identificar casos borde relevantes
- validar entradas y salidas de las operaciones clave

Las áreas más sensibles son:

- autenticación
- autorización
- cálculo de disponibilidad
- creación de reservas
- cancelación de reservas

---

## 10. UI y experiencia de usuario

Claude debe mantener una interfaz:

- clara
- amigable
- simple
- funcional
- visualmente limpia

No debe introducir complejidad visual innecesaria.

La prioridad es que el usuario entienda rápidamente:

- qué día está viendo
- qué mesa está libre
- qué mesa está ocupada
- qué mesa es preferente
- quién ocupa o tiene asociada una mesa
- qué acción puede realizar

---

## 11. Realtime y sincronización

En esta fase, Claude debe asumir que la sincronización se resolverá mediante:

- polling periódico
- actualización optimista

No debe introducir WebSockets u otras soluciones más complejas salvo petición explícita.

Debe diseñar el frontend para que:

- el estado se refresque periódicamente
- los cambios propios se reflejen de inmediato
- los conflictos se resuelvan correctamente si el backend rechaza una acción

---

## 12. Dependencias y librerías

Claude puede proponer o usar librerías cuando aporten valor claro (por ejemplo, `Axios` en lugar de `fetch`), pero debe evitar inflar innecesariamente el proyecto.

Antes de introducir una nueva dependencia, debe valorar:

- si realmente resuelve un problema relevante
- si reduce complejidad de implementación
- si encaja con el stack
- si su mantenimiento merece la pena

Debe evitar dependencias para problemas triviales.

---

## 13. Skills y agentes

Claude es libre de crear **skills**, subagentes o estructuras auxiliares de trabajo si considera que ayudan a ejecutar mejor sus tareas.

Puede hacerlo especialmente para:

- planificación técnica
- revisión de seguridad
- revisión de arquitectura
- generación de documentación
- validación de reglas de negocio
- refactorización puntual

Sin embargo:

- deben seguir alineados con `README.md`
- no deben introducir complejidad innecesaria
- no deben desviar el proyecto del alcance definido
- deben actuar como ayuda interna de implementación, no como sustituto del criterio técnico principal

---

## 14. Gestión de cambios

Cuando Claude haga cambios importantes, debe procurar que sean:

- pequeños
- trazables
- coherentes
- fáciles de revisar

Si un cambio afecta a reglas del negocio, debe mantener consistencia con `README.md`.

Si detecta una mejora razonable no contemplada, puede sugerirla, pero no debe imponerla automáticamente.

---

## 15. Qué debe evitar Claude

Claude debe evitar:

- sobreingeniería
- abstracciones prematuras
- patrones complejos sin necesidad real
- lógica de negocio escondida en componentes visuales
- validaciones solo en frontend
- acceso inseguro a datos
- uso de `any` sin motivo
- comentarios redundantes o decorativos
- dependencias innecesarias
- inventar reglas funcionales no definidas
- mezclar código temporal con código final sin marcarlo claramente
- exponer credenciales o variables de entorno en el `.env`

---

## 16. Fuente de verdad

Para trabajar en este proyecto, Claude debe tomar como referencia principal:

1. `README.md` para contexto funcional y alcance
2. `CLAUDE.md` para normas de implementación y trabajo
3. el código existente del proyecto, siempre que no contradiga los dos puntos anteriores

En caso de conflicto:

- la seguridad prevalece
- la coherencia funcional con `README.md` prevalece sobre supuestos implícitos
- la simplicidad y mantenibilidad deben guiar la decisión

---