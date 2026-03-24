Ejecutar verificaciones del proyecto.

Ejecutar todas las verificaciones en orden:

1. **Lint**: `npm run lint`
2. **Tests unitarios**: `npm run test:unit`
3. **Tests de integración**: `npm run test:integration`
4. **Tests de API**: `npm run test:api`
5. **Build**: `npm run build`

Mostrar resumen con estado de cada verificación (PASS/FAIL).

Si se pasa un KEY como argumento ($ARGUMENTS), ejecutar solo las verificaciones
relacionadas con ese ticket según `.ai/verify/config.yaml`.
