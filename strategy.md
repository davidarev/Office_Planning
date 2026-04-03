# Estrategia del Proyecto — Office Desk Booking

## Vision general

Office Desk Booking es una aplicacion web interna para reservar mesas de oficina. El objetivo es permitir a los miembros del equipo consultar la disposicion de mesas, ver disponibilidad y reservar de forma sencilla, visual y rapida.

El proyecto se construye sobre Next.js 16, TypeScript, MongoDB (Mongoose), Tailwind CSS v4 y se despliega en Vercel. La autenticacion es via magic link con NextAuth.js v5.

### Estado actual

El desarrollo se ha realizado en 4 ramas funcionales ya mergeadas en `develop`:

| Rama | Contenido |
|------|-----------|
| `01-setup-project` | Inicializacion del proyecto, estructura base, configuracion |
| `02-auth-and-sessions` | Autenticacion magic link, sesiones 90 dias, middleware, paginas auth |
| `03-data-model-and-layer-access` | Modelos Mongoose (User, Table, Reservation), repositorios, servicios de lectura, API routes de lectura |
| `04-availability-booking-concurrency` | Servicios de disponibilidad y reservas, endpoints de creacion/cancelacion, control de concurrencia |

Adicionalmente, la rama `045-testing-qa` incluyo tests unitarios, de integracion y de API (222 tests, todos en verde).

### Que esta construido

- **Autenticacion completa**: magic link, sesion persistente 90 dias, middleware de rutas
- **Modelos de datos**: User, Table, Reservation con indices unicos para concurrencia
- **Capa de repositorios**: CRUD para las 3 entidades
- **Capa de servicios**: disponibilidad, reservas (crear/cancelar), tablas
- **7 API routes**: protegidos por sesion, con validacion de entrada
- **Tests**: 222 tests (unitarios, integracion, API) todos pasando
- **UI basica**: flujo de login, header con logout, paginas placeholder para home y admin
- **Tipos de dominio**: bien definidos con separacion publica/interna

### Que falta

- **Plano visual de mesas**: no existe ningun componente de renderizado del plano
- **Interaccion de reserva en UI**: no hay flujo de usuario para reservar/cancelar desde la interfaz
- **Selector de semana/dia**: no implementado
- **Polling / actualizacion optimista**: no implementado
- **Panel de administracion**: solo existe la pagina placeholder con control de acceso
- **API de administracion**: no existen endpoints para gestionar usuarios ni mesas
- **Integracion develop → main**: develop tiene todo el trabajo, main esta en el commit inicial

---

## Estrategia de fases

La estrategia se divide en 4 fases (epicas). La Fase 1 es de consolidacion: revisar, validar y adaptar lo existente antes de construir sobre ello. Las fases 2-4 avanzan hacia el MVP completo.

---

## Fase 1 — Consolidacion y auditoria del codigo existente (OP-100)

**Objetivo**: Revisar todo el codigo ya implementado, verificar que cumple con las normas de AGENTS.md y CLAUDE.md, corregir deficiencias, y dejar una base solida y auditada para las fases siguientes. Incluye la fusion controlada a `main`.

| ID | Titulo | Descripcion | Dependencias |
|----|--------|-------------|--------------|
| OP-110 | Auditoria de modelos y tipos de dominio | Revisar modelos Mongoose, tipos TypeScript, indices y coherencia con README.md. Verificar que los tipos publicos/internos estan bien separados y que no hay inconsistencias. | — |
| OP-120 | Auditoria de repositorios y servicios | Revisar la capa de acceso a datos y logica de negocio. Verificar manejo de errores, validaciones, documentacion JSDoc y cumplimiento de reglas de dominio (1 reserva/usuario/dia, concurrencia, etc.). | OP-110 |
| OP-130 | Auditoria de API routes y seguridad | Revisar endpoints: validacion de entrada, autorizacion, respuestas HTTP, manejo de errores. Verificar que no se exponen datos internos. Revisar middleware/proxy.ts. | OP-120 |
| OP-140 | Auditoria de autenticacion y sesiones | Revisar config de NextAuth, callbacks, adapter, sesion de 90 dias, flujo de magic link. Verificar seguridad del flujo completo. | — |
| OP-150 | Auditoria y refuerzo de tests | Revisar cobertura de tests existentes, identificar gaps, corregir tests fragiles si los hay. Asegurar que el test suite es robusto y fiable. | OP-120, OP-130 |
| OP-160 | Correccion de deficiencias y deuda tecnica | Aplicar correcciones encontradas en las auditorias anteriores. Refactorizar lo necesario sin cambiar funcionalidad. | OP-110, OP-120, OP-130, OP-140, OP-150 |
| OP-170 | Merge develop → main y baseline | Fusionar develop a main de forma controlada. Establecer la baseline del proyecto con todo auditado y en verde. | OP-160 |

### Subtareas por historia — Fase 1

#### OP-110 — Auditoria de modelos y tipos de dominio

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-111 | Revisar schema User | Verificar campos, validaciones, indice unique en email, enum de roles y coherencia con README.md §3. |
| OP-112 | Revisar schema Table | Verificar campos (label, type, position, assignedTo, isActive), enum de tipos, indice de isActive y coherencia con README.md §6. |
| OP-113 | Revisar schema Reservation | Verificar campos, status enum, indices unicos parciales ({tableId,date} y {userId,date} con status=confirmed), y coherencia con README.md §8. |
| OP-114 | Revisar tipos de dominio | Verificar IUser, ITable, IReservation, tipos publicos (UserPublic, TableAvailability, ReservationPublic), ServiceResult y la augmentacion de next-auth.d.ts. |
| OP-115 | Documentar hallazgos OP-110 | Registrar inconsistencias, mejoras necesarias y decisiones en el informe de auditoria de la historia. |

#### OP-120 — Auditoria de repositorios y servicios

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-121 | Revisar reservation.repository | Verificar queries, filtros por status=confirmed, uso de lean(), manejo de errores E11000 y coherencia con el schema. |
| OP-122 | Revisar table.repository y user.repository | Verificar queries, filtros por isActive, ordenacion y completitud de operaciones necesarias. |
| OP-123 | Revisar reservation.service | Verificar reglas de negocio: 1 reserva/usuario/dia, 1 reserva/mesa/dia, mesa bloqueada no reservable, cancelacion por owner o admin, manejo de concurrencia. |
| OP-124 | Revisar availability.service | Verificar logica de calculo de estados (green/yellow/red/gray), prioridades, resolucion batch de nombres de usuario, eficiencia en rangos. |
| OP-125 | Revisar table.service | Verificar operaciones de lectura, filtrado de mesas activas, estructura de respuesta TablePublic. |
| OP-126 | Verificar documentacion JSDoc de servicios y repositorios | Comprobar que todas las funciones publicas tienen JSDoc completo (que hace, parametros, retorno, errores). |
| OP-127 | Documentar hallazgos OP-120 | Registrar inconsistencias, mejoras y decisiones. |

#### OP-130 — Auditoria de API routes y seguridad

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-131 | Revisar endpoints de reservas | Verificar GET/POST /api/reservations, DELETE /api/reservations/[id], GET /api/reservations/week: validacion de entrada, auth, respuestas HTTP, errores. |
| OP-132 | Revisar endpoints de disponibilidad | Verificar GET /api/availability y GET /api/availability/week: validacion de fechas, limites de rango, respuestas. |
| OP-133 | Revisar endpoint de mesas | Verificar GET /api/tables: respuesta, filtrado, estructura de datos. |
| OP-134 | Revisar proxy.ts (middleware) | Verificar reglas de redireccion: rutas publicas, rutas privadas, rutas admin, redireccion de usuarios autenticados fuera de /login. |
| OP-135 | Verificar que no se exponen datos internos en errores | Revisar todos los endpoints para asegurar que los mensajes de error no filtran detalles de infraestructura, stack traces o datos sensibles. |
| OP-136 | Documentar hallazgos OP-130 | Registrar inconsistencias, mejoras y decisiones. |

#### OP-140 — Auditoria de autenticacion y sesiones

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-141 | Revisar configuracion de NextAuth | Verificar auth.ts: adapter, provider email, session strategy=database, maxAge 90d, updateAge 24h, pages personalizadas. |
| OP-142 | Revisar callbacks signIn y session | Verificar que signIn rechaza usuarios inexistentes/inactivos y que session enriquece correctamente con id, role y name. |
| OP-143 | Revisar auth-mongodb-client y api-auth | Verificar conexion MongoDB para el adapter y la utilidad requireSession() usada en API routes. |
| OP-144 | Revisar paginas de auth (login, verify, error) | Verificar flujo de UI: formulario de email, pagina de verificacion, pagina de error, manejo de callbackUrl. |
| OP-145 | Documentar hallazgos OP-140 | Registrar inconsistencias, mejoras y decisiones. |

#### OP-150 — Auditoria y refuerzo de tests

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-151 | Revisar tests unitarios | Verificar tests de dates.ts y compute-status: cobertura de casos borde, calidad de assertions, robustez. |
| OP-152 | Revisar tests de integracion | Verificar tests de servicios y repositorios: cobertura de reglas de negocio, setup/teardown, uso de mongodb-memory-server. |
| OP-153 | Revisar tests de API | Verificar tests de endpoints: cobertura de escenarios (exito, error, auth), mocks de sesion, assertions de respuesta HTTP. |
| OP-154 | Identificar gaps de cobertura | Analizar que escenarios criticos no estan cubiertos y documentar los tests que faltan. |
| OP-155 | Corregir tests fragiles o incompletos | Arreglar tests que dependan de orden, timing o estado compartido. Reforzar assertions debiles. |
| OP-156 | Documentar hallazgos OP-150 | Registrar estado del test suite, gaps y mejoras aplicadas. |

#### OP-160 — Correccion de deficiencias y deuda tecnica

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-161 | Aplicar correcciones a modelos y tipos | Corregir las deficiencias encontradas en OP-110 sobre schemas, indices y tipos de dominio. |
| OP-162 | Aplicar correcciones a repositorios y servicios | Corregir las deficiencias encontradas en OP-120 sobre logica de negocio, manejo de errores y JSDoc. |
| OP-163 | Aplicar correcciones a API routes y middleware | Corregir las deficiencias encontradas en OP-130 sobre validacion, seguridad y respuestas HTTP. |
| OP-164 | Aplicar correcciones a autenticacion | Corregir las deficiencias encontradas en OP-140 sobre configuracion de NextAuth y flujo de auth. |
| OP-165 | Aplicar correcciones y nuevos tests | Implementar los tests faltantes y correcciones identificadas en OP-150. |
| OP-166 | Ejecutar suite completa y verificar verde | Ejecutar npm run test, npm run lint y npm run build. Asegurar que todo pasa tras las correcciones. |

#### OP-170 — Merge develop → main y baseline

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-171 | Verificacion pre-merge | Ejecutar suite completa (tests, lint, build) en develop y confirmar que todo esta en verde. |
| OP-172 | Merge develop → main | Realizar el merge de develop a main. Resolver conflictos si los hubiera. |
| OP-173 | Verificacion post-merge | Ejecutar suite completa en main tras el merge y confirmar que todo sigue en verde. |
| OP-174 | Etiquetar baseline | Crear tag de version (v0.1.0 o similar) marcando la baseline auditada del proyecto. |

---

## Fase 2 — Plano interactivo y flujo de reservas (OP-200)

**Objetivo**: Construir la interfaz principal de la aplicacion: el plano visual de la oficina con las mesas, la seleccion de dia/semana y el flujo completo de reserva y cancelacion desde la UI.

| ID | Titulo | Descripcion | Dependencias |
|----|--------|-------------|--------------|
| OP-210 | Selector de semana y dia | Componente para navegar entre semana actual y siguiente, seleccionando dias laborables. Debe mostrar fechas claras y el dia seleccionado. | — |
| OP-220 | Componente de plano de mesas | Renderizar el plano de la oficina con las mesas posicionadas segun sus coordenadas. Cada mesa debe mostrar su estado visual (verde, amarillo, rojo, gris) y etiqueta. | OP-210 |
| OP-230 | Detalle de mesa y accion de reserva | Al pulsar una mesa, mostrar detalle (estado, ocupante, tipo). Permitir reservar si esta disponible o cancelar si es reserva propia. | OP-220 |
| OP-240 | Integracion con API de disponibilidad | Conectar el plano con los endpoints de disponibilidad existentes. Cargar estado de mesas al seleccionar un dia. | OP-220 |
| OP-250 | Flujo de reserva y cancelacion en UI | Implementar el flujo completo: el usuario reserva, se llama al API, se actualiza la UI de forma optimista, se maneja el error si el backend rechaza. | OP-230, OP-240 |
| OP-260 | Polling periodico y actualizacion | Implementar refresco automatico periodico de los datos del plano para reflejar cambios de otros usuarios sin recarga manual. | OP-240 |

### Subtareas por historia — Fase 2

#### OP-210 — Selector de semana y dia

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-211 | Logica de calculo de semanas | Crear utilidad que calcule semana actual y siguiente con sus dias laborables (lunes a viernes), usando las funciones de dates.ts existentes. |
| OP-212 | Componente WeekSelector | Crear componente que muestre las dos semanas con pestanas o navegacion, indicando rango de fechas de cada una. |
| OP-213 | Componente DaySelector | Crear componente que muestre los dias laborables de la semana seleccionada, con el dia activo destacado visualmente. |
| OP-214 | Estado y contexto de fecha seleccionada | Gestionar el estado del dia seleccionado (por defecto hoy si es laborable, o el proximo laborable). Exponer via estado o contexto para el resto de componentes. |
| OP-215 | Tests del selector de semana y dia | Tests unitarios para la logica de calculo de semanas y tests de componente para WeekSelector y DaySelector. |

#### OP-220 — Componente de plano de mesas

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-221 | Componente FloorPlan (contenedor) | Crear el contenedor SVG o canvas que representa el plano de la oficina con dimensiones y escala configurables. |
| OP-222 | Componente DeskItem (mesa individual) | Crear componente para cada mesa que se posicione segun coordenadas (x, y, width, height, rotation) y muestre etiqueta. |
| OP-223 | Colores por estado de mesa | Aplicar colores segun TableStatus: verde (libre), amarillo (preferente sin reserva), rojo (ocupada/fija), gris (bloqueada/inactiva). |
| OP-224 | Tooltip o indicador de ocupante | Mostrar nombre del ocupante o usuario asociado al hacer hover o como etiqueta secundaria en mesas ocupadas/preferentes. |
| OP-225 | Tests del componente de plano | Tests de renderizado: verificar que las mesas se posicionan correctamente, muestran colores adecuados y etiquetas. |

#### OP-230 — Detalle de mesa y accion de reserva

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-231 | Panel o modal de detalle de mesa | Crear componente que se muestra al pulsar una mesa, con informacion completa: nombre, tipo, estado, ocupante/asociado. |
| OP-232 | Boton de reservar | Mostrar boton "Reservar" cuando la mesa esta disponible (verde o amarillo) y el usuario no tiene reserva ese dia. |
| OP-233 | Boton de cancelar reserva propia | Mostrar boton "Cancelar reserva" cuando la mesa esta ocupada por el usuario actual. |
| OP-234 | Mensajes informativos por estado | Mostrar mensajes contextuales: "Mesa preferente de [nombre]", "Ocupada por [nombre]", "Mesa bloqueada", "Ya tienes reserva en otra mesa". |
| OP-235 | Tests del panel de detalle | Tests de renderizado: verificar que se muestra la informacion correcta y los botones adecuados segun estado y usuario. |

#### OP-240 — Integracion con API de disponibilidad

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-241 | Hook useAvailability | Crear custom hook que llame a GET /api/availability con la fecha seleccionada y devuelva los datos de disponibilidad. |
| OP-242 | Carga de datos al cambiar dia | Conectar el selector de dia con el hook para que al cambiar de dia se recargue la disponibilidad del plano. |
| OP-243 | Precarga de semana completa | Usar GET /api/availability/week para cargar la disponibilidad de toda la semana de una vez, reduciendo llamadas individuales. |
| OP-244 | Manejo de estados de carga y error | Mostrar indicador de carga mientras se obtienen datos y mensaje de error si la llamada falla. |
| OP-245 | Tests de integracion del hook | Tests del hook useAvailability: verificar llamadas al API, manejo de respuesta y estados de carga/error. |

#### OP-250 — Flujo de reserva y cancelacion en UI

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-251 | Hook useReservation | Crear custom hook para llamar a POST /api/reservations (reservar) y DELETE /api/reservations/[id] (cancelar). |
| OP-252 | Actualizacion optimista al reservar | Al confirmar reserva, actualizar el estado local inmediatamente (mesa pasa a rojo) antes de recibir respuesta del servidor. |
| OP-253 | Actualizacion optimista al cancelar | Al confirmar cancelacion, actualizar el estado local inmediatamente (mesa vuelve a verde/amarillo) antes de recibir respuesta. |
| OP-254 | Rollback en caso de error | Si el backend rechaza la operacion (conflicto, mesa ocupada, etc.), revertir el cambio optimista y mostrar mensaje de error al usuario. |
| OP-255 | Tests del flujo de reserva/cancelacion | Tests del hook y del flujo optimista: verificar actualizacion inmediata, rollback en error, y coherencia de estado. |

#### OP-260 — Polling periodico y actualizacion

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-261 | Implementar polling con intervalo configurable | Configurar refresco automatico de datos de disponibilidad cada N segundos (por defecto 30s). |
| OP-262 | Pausar polling en inactividad | Detener el polling cuando el tab no esta visible (Page Visibility API) o el usuario esta inactivo, para ahorrar recursos. |
| OP-263 | Reconciliar datos de polling con estado local | Cuando llegan datos nuevos del servidor, actualizar el plano sin perder cambios optimistas pendientes de confirmacion. |
| OP-264 | Tests del polling | Tests del mecanismo de polling: verificar intervalo, pausa en inactividad y reconciliacion de datos. |

---

## Fase 3 — Panel de administracion (OP-300)

**Objetivo**: Construir el panel de administracion para gestionar usuarios y mesas sin depender del codigo o la base de datos directamente.

| ID | Titulo | Descripcion | Dependencias |
|----|--------|-------------|--------------|
| OP-310 | API de gestion de usuarios (admin) | Endpoints para crear, editar, activar/desactivar usuarios. Protegidos por rol admin. | — |
| OP-320 | API de gestion de mesas (admin) | Endpoints para crear, editar, activar/desactivar mesas, asignar tipo, asignar usuario fijo/preferente, bloquear. Protegidos por rol admin. | — |
| OP-330 | API de gestion de reservas (admin) | Endpoints para que el admin pueda consultar y cancelar cualquier reserva. Ampliar la funcionalidad existente si es necesario. | — |
| OP-340 | UI de gestion de usuarios | Interfaz para listar, crear, editar y desactivar usuarios desde el panel admin. | OP-310 |
| OP-350 | UI de gestion de mesas | Interfaz para listar, crear, editar, configurar tipo y asignar usuarios a mesas desde el panel admin. | OP-320 |
| OP-360 | UI de gestion de reservas (admin) | Interfaz para que el admin consulte reservas por dia/rango y pueda cancelar si es necesario. | OP-330 |

### Subtareas por historia — Fase 3

#### OP-310 — API de gestion de usuarios (admin)

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-311 | Utilidad requireAdmin | Crear helper reutilizable que verifique sesion activa + rol admin, devolviendo 401/403 segun corresponda. |
| OP-312 | Endpoint GET /api/admin/users | Listar todos los usuarios (activos e inactivos) con paginacion basica. Protegido por admin. |
| OP-313 | Endpoint POST /api/admin/users | Crear usuario nuevo con validacion de campos obligatorios (name, email, role). Verificar email unico. |
| OP-314 | Endpoint PATCH /api/admin/users/[id] | Editar usuario: name, role, isActive. Validar que no se desactive al ultimo admin. |
| OP-315 | Tests de API de gestion de usuarios | Tests de los endpoints: creacion, edicion, activacion/desactivacion, proteccion por rol, validaciones. |

#### OP-320 — API de gestion de mesas (admin)

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-321 | Endpoint GET /api/admin/tables | Listar todas las mesas (activas e inactivas) con datos completos incluyendo usuario asignado. Protegido por admin. |
| OP-322 | Endpoint POST /api/admin/tables | Crear mesa nueva con validacion de campos (label, type, position). Asignar usuario si aplica (fija/preferente). |
| OP-323 | Endpoint PATCH /api/admin/tables/[id] | Editar mesa: label, type, position, assignedTo, isActive. Validar coherencia tipo-asignacion. |
| OP-324 | Logica de validacion tipo-asignacion | Verificar que mesas fijas/preferentes tienen assignedTo, y que flexibles/bloqueadas no lo tienen (o lo limpian). |
| OP-325 | Tests de API de gestion de mesas | Tests de los endpoints: creacion, edicion, asignacion de tipo, validacion de coherencia, proteccion por rol. |

#### OP-330 — API de gestion de reservas (admin)

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-331 | Endpoint GET /api/admin/reservations | Listar reservas con filtros por fecha, usuario o mesa. Incluir datos enriquecidos (nombre usuario, etiqueta mesa). Protegido por admin. |
| OP-332 | Ampliar DELETE /api/reservations/[id] para admin | Verificar que el endpoint existente ya permite cancelacion por admin. Si no, ajustar la logica de autorizacion. |
| OP-333 | Tests de API de gestion de reservas | Tests de consulta con filtros y cancelacion administrativa. Verificar proteccion por rol. |

#### OP-340 — UI de gestion de usuarios

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-341 | Pagina /admin/users con listado | Crear pagina que muestre tabla con todos los usuarios: nombre, email, rol, estado. Con indicadores visuales de activo/inactivo. |
| OP-342 | Formulario de creacion de usuario | Modal o pagina con formulario para crear usuario nuevo: nombre, email corporativo, rol. Con validacion de campos. |
| OP-343 | Formulario de edicion de usuario | Modal o pagina para editar usuario existente: nombre, rol, estado activo/inactivo. Mostrar datos actuales precargados. |
| OP-344 | Accion de activar/desactivar usuario | Boton o toggle para cambiar estado de un usuario con confirmacion antes de desactivar. |
| OP-345 | Tests de UI de gestion de usuarios | Tests de componentes: listado, formularios, validaciones y acciones. |

#### OP-350 — UI de gestion de mesas

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-351 | Pagina /admin/tables con listado | Crear pagina que muestre tabla con todas las mesas: etiqueta, tipo, estado, usuario asignado. Con indicadores visuales por tipo. |
| OP-352 | Formulario de creacion de mesa | Modal o pagina con formulario para crear mesa: etiqueta, tipo, posicion (x, y, width, height), usuario asignado si aplica. |
| OP-353 | Formulario de edicion de mesa | Modal o pagina para editar mesa existente: todos los campos editables, con datos precargados. Selector de tipo con logica de asignacion. |
| OP-354 | Selector de usuario asignado | Componente dropdown/search para seleccionar usuario asignado en mesas fijas y preferentes. Se muestra/oculta segun tipo seleccionado. |
| OP-355 | Tests de UI de gestion de mesas | Tests de componentes: listado, formularios, selector de usuario, validaciones. |

#### OP-360 — UI de gestion de reservas (admin)

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-361 | Pagina /admin/reservations con listado | Crear pagina que muestre reservas con filtros por fecha y estado. Mostrar: fecha, mesa, usuario, estado. |
| OP-362 | Filtros de busqueda | Implementar filtros por rango de fechas, por usuario y por mesa para facilitar la consulta administrativa. |
| OP-363 | Accion de cancelar reserva (admin) | Boton para que el admin cancele cualquier reserva activa, con confirmacion y feedback visual. |
| OP-364 | Tests de UI de gestion de reservas | Tests de componentes: listado, filtros, accion de cancelacion. |

---

## Fase 4 — Pulido, UX y preparacion para produccion (OP-400)

**Objetivo**: Pulir la experiencia de usuario, mejorar responsive, manejar estados de carga y error, y preparar la aplicacion para despliegue en produccion.

| ID | Titulo | Descripcion | Dependencias |
|----|--------|-------------|--------------|
| OP-410 | Estados de carga, error y vacios | Implementar skeletons/spinners de carga, mensajes de error amigables y estados vacios (sin mesas, sin reservas) en toda la UI. | OP-200, OP-300 |
| OP-420 | Responsive y adaptacion movil | Asegurar que el plano de mesas, selector de semana y panel admin funcionan correctamente en pantallas pequenas. | OP-200, OP-300 |
| OP-430 | Configuracion de email para produccion | Configurar y verificar el envio de magic links con un proveedor de email real. Documentar variables de entorno necesarias. | — |
| OP-440 | Variables de entorno y despliegue Vercel | Preparar configuracion de entorno para Vercel, documentar el proceso de despliegue, verificar que el build funciona en produccion. | OP-430 |
| OP-450 | Tests E2E del flujo critico | Anadir tests end-to-end del flujo principal: login → ver plano → reservar → cancelar. Verificar que el MVP funciona de punta a punta. | OP-200 |
| OP-460 | Revision final de seguridad | Auditoria final de seguridad: rate limiting en endpoints sensibles, headers de seguridad, revision de permisos, datos expuestos en respuestas. | OP-200, OP-300 |

### Subtareas por historia — Fase 4

#### OP-410 — Estados de carga, error y vacios

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-411 | Componente Skeleton para plano de mesas | Crear skeleton/placeholder visual que se muestre mientras se cargan los datos del plano. |
| OP-412 | Componente Skeleton para tablas admin | Crear skeletons para las tablas de listado del panel de administracion. |
| OP-413 | Componente de error global | Crear componente reutilizable para mostrar errores con mensaje amigable y opcion de reintentar. |
| OP-414 | Estados vacios | Crear componentes para estados sin datos: "No hay mesas configuradas", "No hay reservas para este dia", "No hay usuarios". |
| OP-415 | Integrar estados en todas las vistas | Conectar skeletons, errores y estados vacios en el plano, selectores y panel admin. |

#### OP-420 — Responsive y adaptacion movil

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-421 | Responsive del plano de mesas | Adaptar el plano de mesas para pantallas pequenas: zoom, scroll horizontal o vista simplificada. |
| OP-422 | Responsive del selector de semana/dia | Asegurar que la navegacion de semanas y dias se adapta bien a movil (compact layout). |
| OP-423 | Responsive del panel admin | Adaptar tablas de listado, formularios y acciones del admin para pantallas moviles. |
| OP-424 | Tests visuales responsive | Verificar manualmente o con tests que las vistas principales funcionan en breakpoints clave (mobile, tablet, desktop). |

#### OP-430 — Configuracion de email para produccion

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-431 | Seleccionar y configurar proveedor de email | Elegir proveedor (Resend, SendGrid, AWS SES u otro) y configurar credenciales en variables de entorno. |
| OP-432 | Personalizar plantilla de magic link | Crear o personalizar el email que recibe el usuario con el magic link: branding basico, instrucciones claras. |
| OP-433 | Verificar envio en entorno de staging | Probar el flujo completo de magic link con el proveedor real en un entorno de pre-produccion. |
| OP-434 | Documentar configuracion de email | Documentar variables de entorno necesarias (EMAIL_SERVER_*, EMAIL_FROM) y pasos de configuracion. |

#### OP-440 — Variables de entorno y despliegue Vercel

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-441 | Crear .env.example completo | Documentar todas las variables de entorno necesarias con valores de ejemplo y descripciones. |
| OP-442 | Configurar proyecto en Vercel | Crear proyecto en Vercel, conectar repositorio, configurar variables de entorno de produccion. |
| OP-443 | Verificar build de produccion | Ejecutar build en Vercel y verificar que la aplicacion funciona correctamente en el entorno de produccion. |
| OP-444 | Documentar proceso de despliegue | Crear guia breve de despliegue: pasos para configurar, desplegar y verificar. |

#### OP-450 — Tests E2E del flujo critico

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-451 | Configurar framework E2E | Instalar y configurar Playwright (o similar) con entorno de test (base de datos de prueba, mock de email). |
| OP-452 | Test E2E: flujo de login | Test automatizado del flujo de magic link: introducir email, verificar redireccion, acceso autenticado. |
| OP-453 | Test E2E: ver plano y reservar | Test automatizado: acceder al plano, seleccionar dia, pulsar mesa libre, confirmar reserva, verificar cambio de estado. |
| OP-454 | Test E2E: cancelar reserva | Test automatizado: acceder con reserva existente, pulsar mesa propia, cancelar reserva, verificar que vuelve a libre. |

#### OP-460 — Revision final de seguridad

| ID | Titulo | Descripcion |
|----|--------|-------------|
| OP-461 | Implementar rate limiting | Anadir rate limiting en endpoints sensibles: login (envio de magic link), creacion de reservas. |
| OP-462 | Configurar headers de seguridad | Configurar headers HTTP de seguridad en next.config.ts: CSP, X-Frame-Options, X-Content-Type-Options, etc. |
| OP-463 | Revision de permisos y datos expuestos | Auditar todos los endpoints para verificar que no devuelven campos internos (_id de MongoDB, datos de otros usuarios no autorizados). |
| OP-464 | Documentar modelo de seguridad | Crear resumen del modelo de seguridad implementado: autenticacion, autorizacion, proteccion de datos, rate limiting. |

---

## Resumen de fases y dependencias entre epicas

```
OP-100 (Consolidacion)
   └──> OP-200 (Plano y reservas)
            └──> OP-300 (Admin)
                     └──> OP-400 (Pulido y produccion)
```

Las fases son secuenciales a nivel de epica: cada fase depende de que la anterior este completada. Dentro de cada fase, las historias tienen sus propias dependencias internas indicadas en las tablas. Las subtareas dentro de una misma historia no tienen dependencias entre si.

---

## Notas sobre la metodologia

- Cada historia generara su spec en `.ai/specs/<ID>-spec.md` antes de implementarse.
- Se usara el canvas (`office_planning.canvas`) para gestionar estados de tareas.
- Se seguira el flujo de AGENTS.md: Spec → Codigo → Execution Result → Verify → PR.
- Los commits seguiran el formato `<tipo>(<ID>): descripcion`.
- Las ramas seguiran el formato `feature/<ID>-descripcion-corta` (una rama por historia).
- Cada historia se cerrara con un PR hacia `main` (o `develop` segun el flujo que decidamos).
