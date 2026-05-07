# Roadmap de implementación

## Fase 1: Setup base [EN CURSO]
- [x] Definición funcional (README.md)
- [x] Reglas de trabajo (CLAUDE.md)
- [x] Inicialización del proyecto (Next.js + TypeScript + Tailwind)
- [x] Estructura de carpetas
- [x] Conexión MongoDB
- [x] Modelos de dominio (User, Table, Reservation)
- [x] Schemas Mongoose con índices de concurrencia
- [x] Configuración base NextAuth.js (magic link)
- [x] Middleware de protección de rutas
- [x] Variables de entorno (.env.example)
- [x] .gitignore completo
- [x] Layout base y páginas placeholder
- [ ] Verificación de build

## Fase 2: Autenticación y sesiones
- [ ] Página de login funcional
- [ ] Envío de magic link por email
- [ ] Callback de verificación
- [ ] Sesión persistente (90 días)
- [ ] Protección de rutas por sesión
- [ ] Protección de rutas admin por rol

## Fase 3: Plano y visualización de mesas
- [ ] API de mesas (GET)
- [ ] Componente de plano de oficina
- [ ] Renderizado de mesas por posición/dimensión
- [ ] Estados visuales (verde, amarillo, rojo, gris)
- [ ] Tooltip/detalle al pulsar mesa

## Fase 4: Lógica de disponibilidad
- [ ] Servicio de cálculo de estado por mesa y día
- [ ] API de disponibilidad por fecha
- [ ] Integración con tipos de mesa (flexible, fija, preferente, bloqueada)

## Fase 5: Reserva y cancelación
- [ ] API de reserva (POST) con validación y concurrencia
- [ ] API de cancelación (DELETE)
- [ ] Actualización optimista en UI
- [ ] Feedback visual al usuario

## Fase 6: Vista por semanas
- [ ] Selector de semana actual / siguiente
- [ ] Selector de día dentro de la semana
- [ ] Solo días laborables

## Fase 7: Polling y sincronización
- [ ] Polling automático (intervalo corto)
- [ ] Reconciliación de estado
- [ ] Manejo de conflictos

## Fase 8: Panel de administración
- [ ] CRUD de usuarios
- [ ] CRUD de mesas
- [ ] Configuración de tipos de mesa
- [ ] Gestión de reservas

## Fase 9: Pulido y estabilidad
- [ ] Validaciones completas frontend + backend
- [ ] Manejo de errores
- [ ] Responsive
- [ ] Testing de áreas críticas
- [ ] Revisión de seguridad
