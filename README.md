# Office Desk Booking

Aplicación web interna para la reserva de mesas en la oficina.

## 1. Objetivo

Esta aplicación tiene como objetivo permitir que los miembros del equipo puedan consultar la disposición de las mesas de la oficina y reservar una mesa para un día concreto de forma sencilla, visual y rápida.

La necesidad surge porque el equipo es más grande que el número de mesas disponibles, por lo que se requiere un sistema interno que facilite la organización y evite solapamientos.

La aplicación debe priorizar:

- simplicidad
- facilidad de uso
- claridad visual
- eficiencia
- mantenimiento sencillo
- seguridad suficiente para uso interno

No se busca una plataforma compleja ni sobredimensionada, sino una solución práctica y robusta para uso diario.

---

## 2. Alcance funcional

La aplicación permitirá:

- visualizar el plano de la oficina con la disposición de las mesas
- consultar el estado de cada mesa por día
- reservar una mesa para un día concreto
- cancelar una reserva propia
- visualizar quién ocupa o tiene asociada una mesa
- consultar la semana actual y la semana siguiente
- ver cambios reflejados automáticamente sin necesidad de recarga manual

La aplicación tendrá además un área de administración para gestionar usuarios y configuración de mesas.

---

## 3. Usuarios y acceso

### 3.1. Usuarios
Los usuarios no se registran libremente.

Todos los usuarios existirán previamente en la base de datos y serán creados manualmente por un administrador.

Cada usuario tendrá al menos:

- nombre
- email corporativo
- rol
- estado activo/inactivo

### 3.2. Autenticación
La autenticación se realizará mediante **magic link por email**.

Flujo esperado:

1. El usuario introduce su email corporativo.
2. El sistema valida que dicho email exista en la colección de usuarios autorizados.
3. Si el usuario está autorizado, recibe un enlace de acceso por correo.
4. El usuario accede sin contraseña.
5. La sesión debe persistir en el dispositivo para evitar que tenga que repetir este proceso continuamente.

### 3.3. Sesión
La sesión debe ser persistente y razonablemente duradera, para evitar fricción en el uso diario.

El usuario solo debería necesitar un nuevo magic link cuando:

- cierra sesión manualmente
- la sesión expira (al cabo de 90 días)
- accede desde otro navegador o dispositivo
- elimina cookies o datos del navegador

---

## 4. Roles

### 4.1. Usuario
Puede:

- iniciar sesión
- consultar disponibilidad
- visualizar el plano de mesas
- reservar una mesa libre o preferente
- cancelar su propia reserva
- ver quién ocupa una mesa o a quién está asociada

### 4.2. Administrador
Además de todo lo anterior, puede:

- crear, editar o desactivar usuarios
- crear, editar o desactivar mesas
- configurar el tipo de mesa
- asignar usuario fijo o preferente a una mesa
- bloquear mesas
- consultar y gestionar reservas
- cancelar o ajustar reservas si es necesario

---

## 5. Semanas y días reservables

La aplicación mostrará:

- **semana actual**
- **semana siguiente**

Debe mostrarse de forma clara el rango de fechas de cada semana.

La navegación debe ser sencilla, permitiendo seleccionar el día concreto dentro de cada semana.

En principio, el flujo está pensado para días laborables. Los fines de semana no forman parte del uso normal de la aplicación, salvo que más adelante se decida lo contrario.

---

## 6. Modelo funcional de las mesas

Cada mesa debe existir como entidad propia dentro del sistema.

Cada mesa tendrá información visual y funcional, incluyendo al menos:

- identificador o nombre
- posición dentro del plano
- dimensiones o representación visual
- estado base o tipo
- usuario asociado si aplica

### 6.1. Tipos funcionales de mesa

#### Mesa flexible
Mesa normal que puede ser reservada libremente si está disponible.

#### Mesa fija
Mesa asignada de forma estable a una persona. A efectos funcionales, aparece como ocupada para los días en los que aplica esa asignación.

#### Mesa preferente
Mesa asociada habitualmente a una persona, pero **no bloqueada**.  
Debe mostrarse en color amarillo cuando no tenga una reserva confirmada.

Cualquier usuario puede reservarla, pero la interfaz debe mostrar claramente que se trata de una mesa con preferencia o asociación habitual.

#### Mesa bloqueada / no disponible
Mesa no utilizable temporal o permanentemente. No debe poder reservarse.

---

## 7. Estados visuales

La interfaz usará colores para reflejar el estado de cada mesa por día.

### Verde
Mesa libre y reservable.

### Amarillo
Mesa preferente o asociada habitualmente a una persona, pero que sigue siendo reservable.  
Debe mostrarse además el aviso o nombre de la persona asociada.

### Rojo
Mesa ocupada para ese día.  
Puede deberse a:

- reserva confirmada
- asignación fija
- otra condición que la haga no disponible para reserva en ese día

### Gris (opcional)
Mesa no disponible o bloqueada.

> Importante: el color final de la mesa debe calcularse en backend a partir de su configuración base y de las reservas reales de cada día.

---

## 8. Reglas de reserva

Las reglas funcionales mínimas son:

- un usuario no puede reservar más de una mesa en el mismo día
- una mesa no puede ser reservada por más de una persona en el mismo día
- si dos usuarios intentan reservar la misma mesa casi al mismo tiempo, el sistema debe impedir duplicidades
- una reserva confirmada convierte la mesa en roja para ese día
- una mesa preferente sin reserva confirmada se muestra amarilla
- una mesa flexible sin reserva se muestra verde
- una mesa bloqueada no puede reservarse

---

## 9. Visualización del plano

La aplicación debe representar visualmente la oficina mediante un plano sencillo e interactivo.

No se busca un plano arquitectónico exacto, sino una representación clara y útil.

Cada mesa debe renderizarse a partir de una configuración estructurada, por ejemplo mediante coordenadas y dimensiones, para evitar una interfaz rígida y difícil de mantener.

El usuario debe poder:

- identificar visualmente cada mesa
- ver su estado
- pulsar sobre ella para obtener detalle
- reservar o cancelar según corresponda

La interfaz debe ser amigable y clara, con especial atención a la facilidad de uso.

---

## 10. Actualización de datos

La aplicación no utilizará realtime complejo con WebSockets en esta fase.

Se utilizará un enfoque de:

- **polling automático corto**
- **actualización optimista**

Esto implica que:

- la interfaz refresca periódicamente los datos
- al reservar o cancelar, el cambio se refleja de forma inmediata en la propia interfaz
- los demás usuarios verán los cambios en pocos segundos sin necesidad de recargar manualmente

Este enfoque se considera suficiente para la primera versión interna del producto.

---

## 11. Panel de administración

La aplicación debe contar con una interfaz administrativa separada o protegida por rol.

Funcionalidades mínimas esperadas:

- gestión de usuarios
- gestión de mesas
- configuración de mesas fijas, preferentes o bloqueadas
- activación y desactivación de usuarios
- revisión básica de reservas
- intervención manual en caso necesario

El objetivo del panel es evitar depender del código para el mantenimiento cotidiano de la aplicación.

---

## 12. Requisitos no funcionales

La aplicación debe cumplir los siguientes criterios:

- interfaz simple, reactiva y clara
- diseño profesional agradable y utilizable
- comportamiento responsive razonable
- buen rendimiento
- código mantenible
- seguridad adecuada para entorno interno
- validaciones en frontend y backend
- control de concurrencia en reservas
- estructura fácilmente desplegable en Vercel

---

## 13. Stack previsto

Tecnologías inicialmente previstas:

- **Next.js**
- **TypeScript**
- **MongoDB**
- **Vercel**

La prioridad no es usar tecnologías complejas, sino un stack sencillo, estándar y fácil de mantener.

---

## 14. Criterio de éxito del MVP

La primera versión será válida si permite:

- acceso seguro por magic link
- sesión persistente
- usuarios predefinidos
- visualización del plano de mesas
- consulta de semana actual y siguiente
- reserva por día
- cancelación de reserva propia
- visualización del ocupante o usuario asociado
- actualización automática periódica
- control de conflictos de reserva

---