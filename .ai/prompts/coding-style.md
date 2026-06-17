# Guía de estilo de código — Office Desk Booking

## Principios generales
- Simplicidad antes que complejidad
- Claridad antes que brillantez
- Seguridad antes que comodidad
- Código preparado para ser entendido por humanos

## TypeScript
- Modo estricto, sin `any`
- Interfaces para entidades de dominio, types para uniones/utilidades
- Tipar siempre parámetros y retornos de funciones públicas
- Usar enums o union types para estados y tipos (no strings mágicos)

## Estructura de ficheros
- Un export principal por fichero cuando sea posible
- Imports ordenados: 1) externos, 2) internos absolutos (@/), 3) relativos
- Barrel exports (`index.ts`) solo en carpetas de dominio y repositorios

## Funciones
- Funciones pequeñas y con responsabilidad única
- Evitar anidamientos de más de 2 niveles
- Early return para validaciones
- Documentar con JSDoc funciones públicas y servicios

## Servicios
- Toda lógica de negocio en `src/services/`
- Nunca lógica de negocio en componentes de UI ni en API routes
- Los servicios reciben datos ya validados
- Los servicios lanzan errores tipados que la capa API traduce a HTTP

## Repositorios
- Solo acceso a datos, sin lógica de negocio
- Un repositorio por entidad
- Métodos claros: `findById`, `findByDate`, `create`, `delete`, etc.

## Componentes React
- Componentes funcionales con hooks
- Props tipadas con interfaces
- Separar lógica de presentación
- Evitar useEffect para lógica que puede resolverse con Server Components

## API Routes
- Validar entrada (params, body, query)
- Verificar autenticación y autorización
- Delegar a servicios
- Devolver respuestas HTTP consistentes
- No exponer detalles internos en errores
