# AGENTS.md — Office Desk Booking

Contrato operativo del proyecto para agentes de IA y equipo de desarrollo.

> Este fichero adapta las directrices corporativas de Iberpixel (ver `docs/`) al contexto concreto de este proyecto. En caso de conflicto, prevalece la guía corporativa.

---

## 1. Proyecto

| Campo | Valor |
|---|---|
| **Nombre** | Office Desk Booking |
| **Descripción** | Aplicación web interna para reservar mesas en la oficina |
| **Repositorio** | GitHub — `davidarev/Office_Planning` |
| **Stack** | Next.js 16 · TypeScript · MongoDB (Mongoose) · Tailwind CSS v4 · Vercel |
| **Auth** | NextAuth.js v5 (magic link + sesión en BD, 90 días) |
| **Canvas** | `office_planning.canvas` |
| **Fuente funcional** | `README.md` |

---

## 2. Stack tecnológico

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript (modo estricto, sin `any`)
- **Base de datos**: MongoDB con Mongoose como ODM
- **Autenticación**: NextAuth.js v5 beta (email magic link, sesión en BD)
- **Estilos**: Tailwind CSS v4
- **Despliegue**: Vercel
- **Testing**: Vitest + mongodb-memory-server
- **Gestión de tareas**: Kanvas (Obsidian Canvas + `canvas-tool.py`)

---

## 3. Estructura del repositorio

```
Office_Planning/
├── README.md                    # Contexto funcional y alcance
├── AGENTS.md                    # Contrato del proyecto (este fichero)
├── CLAUDE.md                    # Config específica para Claude Code
├── .ai/
│   ├── specs/                   # Specs por ticket (SDD)
│   │   └── <KEY>-spec.md
│   ├── verify/                  # Config y scripts de verificación
│   │   └── config.yaml
│   ├── skills/                  # Skills de IA del proyecto
│   │   ├── implement-feature.md
│   │   ├── review-spec-compliance.md
│   │   └── update-execution-result.md
│   └── prompts/                 # Guías de estilo / prompts compartidos
├── .claude/
│   ├── settings.json            # Permisos, exclusiones, config del workspace
│   ├── settings.local.json      # Config local (excluido de Git)
│   └── commands/                # Comandos reutilizables (wrappers de skills)
├── office_planning.canvas       # Canvas de Kanvas (gestión visual de tareas)
├── canvas-tool.py               # Script CLI para gestión de tareas
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── app/                     # Entradas de app (Next.js App Router)
│   │   ├── (auth)/              # Rutas de autenticación
│   │   ├── (main)/              # Rutas principales protegidas
│   │   └── api/                 # API Routes
│   │       ├── auth/            # NextAuth endpoints
│   │       ├── availability/    # Endpoints de disponibilidad
│   │       ├── reservations/    # Endpoints de reservas
│   │       └── tables/          # Endpoints de mesas
│   ├── components/              # Componentes de UI
│   │   ├── booking/
│   │   ├── floor-plan/
│   │   ├── layout/
│   │   ├── providers/
│   │   └── ui/
│   ├── domain/                  # Tipos e interfaces del dominio
│   │   └── types/
│   ├── lib/                     # Utilidades e infraestructura
│   │   ├── db/                  # Repositorios (acceso a datos)
│   │   ├── models/              # Schemas Mongoose
│   │   ├── auth.ts              # Config NextAuth
│   │   ├── mongodb.ts           # Conexión MongoDB
│   │   └── dates.ts             # Utilidades de fechas
│   ├── services/                # Lógica de negocio
│   │   ├── availability.service.ts
│   │   ├── reservation.service.ts
│   │   └── table.service.ts
│   └── proxy.ts
├── tests/
│   ├── setup.ts                 # Setup global de tests
│   ├── helpers/                 # Utilidades para tests
│   ├── unit/                    # Tests unitarios
│   ├── integration/             # Tests de integración
│   └── api/                     # Tests de API
└── docs/                        # Documentación corporativa
```

---

## 4. Convenciones de código

### 4.1. TypeScript
- Modo estricto obligatorio
- Sin `any` salvo causa justificada y documentada
- Tipos e interfaces explícitas para entidades del dominio
- Tipar parámetros, retornos y estructuras de datos

### 4.2. Nombres
- Ficheros de componentes: `PascalCase.tsx`
- Ficheros de servicios/utilidades: `kebab-case.ts`
- Modelos Mongoose: `nombre.model.ts`
- Repositorios: `nombre.repository.ts`
- Servicios: `nombre.service.ts`
- Tipos de dominio: `nombre.ts` dentro de `src/domain/types/`

### 4.3. Arquitectura por capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **UI / Presentación** | `src/components/`, `src/app/` | Renderizado, interacción |
| **API** | `src/app/api/` | Validación de entrada, auth, respuestas HTTP |
| **Servicios** | `src/services/` | Lógica de negocio, reglas del dominio |
| **Repositorios** | `src/lib/db/` | Acceso a datos, queries MongoDB |
| **Modelos** | `src/lib/models/` | Schemas Mongoose, índices |
| **Dominio** | `src/domain/types/` | Tipos, interfaces, enums |

**Regla fundamental**: la lógica de negocio vive en `services/`, nunca en componentes de UI ni en API routes.

### 4.4. Documentación de código
- Formato JSDoc para funciones públicas, servicios y utilidades críticas
- Documentar: qué hace, parámetros, retorno, errores/casos especiales
- No documentar línea por línea ni añadir ruido innecesario

---

## 5. Convenciones de Git

### 5.1. Ramas
- Una rama por historia, no por subtarea
- Formato: `feature/<KEY>-descripcion-corta` o `<NNN>-descripcion-corta`
- Ejemplo: `feature/ODP-100-auth-magic-link`
- Todas las subtareas de esa historia se implementan en la misma rama

### 5.2. Commits
- Formato obligatorio: `<tipo>(<KEY>): descripción en minúsculas`
- Tipos permitidos: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`
- KEY = ID de la subtarea activa en canvas (estado Doing, naranja)
- No hacer commit si la subtarea no está en estado Doing en el canvas
- Commits atómicos y descriptivos
- Código IA-asistido: prefijo `[ai-assisted]` o sección explícita en la PR

### 5.3. Pull Requests
- Siempre desde rama de historia hacia `main`
- Título: `[KEY] Descripción corta`
- Descripción obligatoria:
  - Lista de subtareas cubiertas con estado
  - Specs relacionadas (`.ai/specs/`)
  - Resultado de `verify`
  - Sección "Código IA-asistido" si aplica
  - Confirmación de que `## Execution Result` está al día

---

## 6. Comandos del proyecto

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build de producción
npm run start            # Iniciar servidor de producción

# Calidad
npm run lint             # ESLint
npm run test             # Ejecutar todos los tests
npm run test:unit        # Solo tests unitarios
npm run test:integration # Solo tests de integración
npm run test:api         # Solo tests de API
npm run test:coverage    # Tests con cobertura
npm run test:watch       # Tests en modo watch

# Kanvas (gestión de tareas)
python3 canvas-tool.py office_planning.canvas list         # Listar tareas
python3 canvas-tool.py office_planning.canvas status <KEY> # Estado de tarea
python3 canvas-tool.py office_planning.canvas start <KEY>  # Iniciar tarea
python3 canvas-tool.py office_planning.canvas finish <KEY> # Completar tarea
python3 canvas-tool.py office_planning.canvas block <KEY>  # Bloquear tarea
python3 canvas-tool.py office_planning.canvas add-dep <KEY> <DEP> # Añadir dependencia
```

---

## 7. Flujo de trabajo: Spec → Código → Execution Result → Verify → PR

### 7.1. Flujo estándar

1. **Ticket / tarea en canvas**: historia con subtareas en `office_planning.canvas`
2. **Spec técnica**: crear en `.ai/specs/<KEY>-spec.md` con plantilla oficial
3. **Rama Git**: `feature/<KEY>-descripcion-corta` desde `main`
4. **Configurar sesión**: AGENTS.md + spec del ticket como contexto
5. **Implementación guiada por spec**: seguir AC, trazar contra criterios concretos
6. **Actualizar spec con Execution Result**: sección obligatoria al final de la spec
7. **Verificación**: ejecutar `npm run test` + checks relevantes
8. **PR**: con referencias a ticket, spec, verify y código IA-asistido

### 7.2. Spec válida (contenido mínimo)

```markdown
# <KEY> — Título descriptivo

## Contexto
Dónde estamos, qué existe, qué límites hay.

## Objetivo
Qué comportamiento nuevo o cambio concreto se quiere.

## Restricciones
Qué NO puede ocurrir. Patrones prohibidos, dependencias no aceptadas.

## Casos límite
Inputs extraños, estados intermedios, errores esperables.

## Criterios de aceptación
- AC-1: ...
- AC-2: ...

## Criterio de done
- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result
```

### 7.3. Execution Result (obligatorio)

Tras implementar, añadir al final de la spec:

```markdown
## Execution Result

- Fecha de implementación: YYYY-MM-DD HH:MM (CET)
- Rama: <rama-git>
- Commit: <hash>
- Herramienta IA: Claude Code claude-opus-4-6
- Estado de AC:
  - AC-1: PASS | FAIL – nota breve
  - AC-2: PASS | FAIL – nota breve
- Ficheros creados o modificados:
  - `ruta/archivo1.ext`
- verify:
  - Comando ejecutado: `npm run test`
  - Resultado: PASS | FAIL – descripción breve
- AI-assisted:
  - Herramienta(s): Claude Code
  - Alcance: qué partes del trabajo se hicieron con IA
- Decisiones técnicas:
  - Cualquier decisión no obvia tomada durante la implementación
```

---

## 8. Reglas de Kanvas para el Agente

1. Antes de comenzar cualquier tarea, ejecutar:
   `python3 canvas-tool.py office_planning.canvas start KEY`

2. Solo trabajar tareas que puedan hacer `start` exitosamente.
   Si devuelve error de dependencias bloqueantes, esperar.

3. Después de implementar y hacer commit, ejecutar:
   `python3 canvas-tool.py office_planning.canvas finish KEY`

4. No modificar el fichero `.canvas` manualmente.
   Usar siempre `canvas-tool.py` para cambios de estado.

5. Si una tarea no tiene spec en `.ai/specs/KEY-*.md`,
   preguntar al humano antes de continuar.

### Mapa de estados del canvas

| Color | Estado | Significado | Quién |
|---|---|---|---|
| **Morado** | To Design | Pendiente de spec | Humano |
| **Rojo** | Blocked | Bloqueada por dependencias | Sistema/Humano |
| **Naranja** | Doing | En implementación activa | Agente (`start`) |
| **Cyan** | Review | Implementada, pendiente de revisión | Agente (`finish`) |
| **Verde** | Done | Completada y aprobada | Humano tras revisar |

---

## 9. Checklist de cierre de tarea

Antes de mover cualquier tarea a Review (`finish`), el agente DEBE completar:

### Paso 1 — Execution Result en la spec
Fichero: `.ai/specs/<KEY>-spec.md`
Contenido: ver sección 7.3

### Paso 2 — Suite de verificación
Añadir/actualizar suite en `.ai/verify/config.yaml`

### Paso 3 — Commit de documentación
```
docs(<KEY>): añadir execution result y suite de verify

Per AGENTS.md § 9:
- Sección ## Execution Result añadida al spec de <KEY>
- Suite <nombre> añadida a .ai/verify/config.yaml

Ref: .ai/specs/<KEY>-spec.md
```

**No negociable**: Ninguna tarea pasa a Review sin estos tres pasos completados.

---

## 10. TDD "a lo agents"

### Ciclo
1. **Red**: AC definidos en la spec, verificaciones configuradas para fallar
2. **Green**: implementación mínima para cumplir AC, avanzar AC por AC
3. **Refactor + verify**: limpiar código manteniendo AC en verde

### Tests obligatorios (áreas críticas)
- Autenticación y autorización
- Cálculo de disponibilidad de mesas
- Creación de reservas (incluida concurrencia)
- Cancelación de reservas
- Reglas de negocio (1 reserva/usuario/día, 1 reserva/mesa/día)

### Framework de testing
- **Vitest** para unit + integration
- **mongodb-memory-server** para tests de repositorio/servicio
- Tests unitarios en `tests/unit/`
- Tests de integración en `tests/integration/`
- Tests de API en `tests/api/`

---

## 11. Skills disponibles

| Skill | Fichero | Uso |
|---|---|---|
| Implementar feature | `.ai/skills/implement-feature.md` | Implementar una subtarea siguiendo su spec |
| Review spec compliance | `.ai/skills/review-spec-compliance.md` | Verificar código vs AC de la spec |
| Update execution result | `.ai/skills/update-execution-result.md` | Actualizar spec con resultado de ejecución |

---

## 12. Seguridad

### Obligatorio
- Validar TODAS las entradas en backend
- Proteger rutas privadas y admin con verificación de sesión/rol en servidor
- Un usuario solo actúa sobre sus propias reservas (salvo admin)
- Variables de entorno para secretos (nunca hardcodeados)
- No exponer detalles internos en mensajes de error al usuario

### Concurrencia
- Índices únicos compuestos en MongoDB: `{tableId, date}` y `{userId, date}`
- Validar disponibilidad en backend antes de confirmar reserva
- Evitar duplicidades aunque dos requests lleguen simultáneamente

### Nunca exponer a la IA
- Credenciales de producción
- Datos reales de usuarios
- Ficheros `.env`, `.env.local`, `.env.*`

---

## 13. Reglas de dominio (resumen de README.md)

### Tipos de mesa
- **Flexible**: reservable libremente (verde)
- **Fija**: asignada a una persona, ocupada para días que aplique (rojo)
- **Preferente**: asociada habitualmente a alguien, pero reservable (amarillo)
- **Bloqueada**: no utilizable (gris)

### Reglas de reserva
- 1 usuario → máximo 1 mesa por día
- 1 mesa → máximo 1 reserva por día
- Mesa bloqueada → no reservable
- Reserva confirmada → mesa roja
- Preferente sin reserva → mesa amarilla
- Flexible sin reserva → mesa verde

### Semanas
- Semana actual + semana siguiente
- Solo días laborables

### Actualización
- Polling periódico (sin WebSockets)
- Actualización optimista en UI

---

## 14. Trazabilidad IA-asistida

Toda PR debe:
- Referenciar el ticket/tarea del canvas
- Referenciar la spec correspondiente (`.ai/specs/<KEY>-spec.md`)
- Indicar qué partes han sido IA-asistidas
- Confirmar que `## Execution Result` está completo y coherente
- Incluir resultado de `verify`

**Regla de oro**: una PR sin spec previa, sin relación clara con su spec, o con la spec desactualizada respecto al código y verify, es rechazable.

---

## 15. Fuente de verdad

Orden de prioridad:
1. Guía corporativa (`docs/`)
2. `README.md` para contexto funcional y alcance
3. `AGENTS.md` (este fichero) para normas operativas
4. `CLAUDE.md` para config específica de Claude Code
5. Código existente (si no contradice lo anterior)

En caso de conflicto: seguridad prevalece, luego coherencia funcional con README.md, luego simplicidad.
