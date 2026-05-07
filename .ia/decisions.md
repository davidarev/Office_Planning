# Decisiones técnicas

## Supuestos razonables tomados

### Arquitectura
- **Next.js 14+ con App Router**: estándar actual de Next.js, compatible con Vercel, soporta React Server Components.
- **Tailwind CSS v4**: viene integrado con create-next-app, productivo para UI sin dependencias extra de componentes.
- **Alias `@/*` → `./src/*`**: configurado automáticamente por create-next-app con `--src-dir`.

### Autenticación
- **NextAuth.js v5 (beta)**: librería estándar para auth en Next.js. Soporta email provider (magic link) y MongoDB adapter.
- **Sesión en base de datos** (no JWT): permite sesiones de 90 días invalidables desde servidor, logout real, y revocación.
- **Nodemailer**: transporte SMTP para envío de magic links. Requiere configuración de servidor de correo.

### Base de datos
- **Mongoose como ODM**: tipado, schemas con validación, soporte para índices. Evita queries raw y aporta estructura.
- **Índices compuestos únicos en Reservation**: `{tableId, date}` y `{userId, date}` como barrera de concurrencia a nivel de base de datos. Incluso si dos requests llegan simultáneamente, MongoDB rechazará el segundo insert.
- **MongoClient separado para NextAuth adapter**: el adapter requiere el driver nativo de MongoDB, no Mongoose. Se cachea igual que la conexión de Mongoose.

### Dominio
- **`date` en Reservation siempre en UTC a las 00:00**: normaliza las fechas para evitar problemas de timezone al comparar días.
- **`TablePosition` con coordenadas abstractas**: el frontend las mapea a su sistema de coordenadas. Permite reconfigurar el plano sin cambiar código.
- **`TableType` como enum en schema**: flexible, fixed, preferential, blocked. Mapeo directo del README.

### Seguridad
- **Middleware de NextAuth**: protege automáticamente todas las rutas excepto login y auth endpoints.
- **Validación de usuario activo en signIn callback**: un email no registrado o un usuario desactivado no puede acceder.
- **Variables de entorno para todos los secretos**: AUTH_SECRET, credenciales SMTP, URI de MongoDB.
