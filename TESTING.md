# Testing

## Ejecutar tests

```bash
# Todos los tests
npm test

# Tests en modo watch (re-ejecuta al guardar)
npm run test:watch

# Con cobertura de código
npm run test:coverage

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Solo tests de API
npm run test:api
```

## Stack de testing

- **Vitest** — framework de testing compatible con el ecosistema Vite/TypeScript
- **mongodb-memory-server** — instancia MongoDB in-memory para tests de integración
- **vi.mock / vi.spyOn** — mocking nativo de Vitest para auth y dependencias

## Estructura

```
tests/
├── unit/                          # Tests unitarios (sin DB)
│   ├── dates.test.ts              # Utilidades de fecha
│   └── compute-status.test.ts     # Lógica de status de disponibilidad
├── integration/                   # Tests con MongoDB in-memory
│   ├── reservation-repository.test.ts   # CRUD + índices únicos
│   ├── table-user-repository.test.ts    # Queries de mesa y usuario
│   ├── availability-service.test.ts     # Servicio de disponibilidad
│   ├── reservation-service.test.ts      # Crear/cancelar reservas
│   └── concurrency.test.ts             # Reservas simultáneas
├── api/                           # Tests de endpoints HTTP
│   ├── tables.test.ts             # GET /api/tables
│   ├── reservations-read.test.ts  # GET reservaciones
│   ├── reservations-create.test.ts# POST /api/reservations
│   ├── reservations-cancel.test.ts# DELETE /api/reservations/:id
│   ├── availability.test.ts       # GET disponibilidad
│   └── auth-security.test.ts      # Auth, permisos, edge cases
├── helpers/                       # Utilidades de test
│   ├── factories.ts               # Factories para User, Table, Reservation
│   ├── auth-mock.ts               # Mocks de sesión y autenticación
│   └── index.ts                   # Re-exports
└── setup.ts                       # Setup global (MongoDB in-memory)
```

## Tipos de tests

### Unitarios (`tests/unit/`)
Tests de lógica pura sin dependencias externas. Cubren:
- Normalización de fechas, comparación, validación, rangos semanales
- Reglas de status de disponibilidad (gray, red, yellow, green)

### Integración (`tests/integration/`)
Tests contra MongoDB in-memory real. Cubren:
- Operaciones CRUD del repositorio
- Índices únicos parciales (`partialFilterExpression`)
- Que reservas canceladas no bloquean nuevas reservas
- Servicios de disponibilidad y reservas con datos reales
- Concurrencia: reservas simultáneas verifican que solo una gana

### API (`tests/api/`)
Tests de los route handlers de Next.js. Cubren:
- Autenticación (401 sin sesión en todos los endpoints)
- Validación de parámetros (400 en inputs inválidos)
- Autorización (403 al cancelar reserva ajena)
- Códigos de respuesta correctos (201, 404, 409, etc.)
- Inputs maliciosos (SQL injection, XSS, IDs inválidos)
- Que los errores no filtran información interna

## Requisitos

- Node.js 20+
- Las dependencias de test se instalan con `npm install`
- No requiere MongoDB externo — se usa `mongodb-memory-server`
- No requiere variables de entorno — el setup las configura automáticamente

## Decisiones técnicas

1. **mongodb-memory-server** en lugar de mocks de Mongoose: permite verificar índices únicos, queries reales y comportamiento de concurrencia
2. **vi.mock para api-auth**: aísla la capa HTTP de la autenticación real (NextAuth)
3. **Pool de forks con un solo fork**: evita conflictos de conexión MongoDB entre tests
4. **Limpieza entre tests**: cada test empieza con colecciones vacías para aislamiento total
5. **Factories con defaults sensatos**: reducen boilerplate sin esconder datos relevantes
