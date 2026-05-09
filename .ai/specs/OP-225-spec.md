# OP-225 — Tests del componente de plano

## Contexto

OP-221 a OP-224 implementan `FloorPlan`, `DeskItem`, `desk-status.ts` y el indicador
de ocupante. El entorno de test del proyecto usa Vitest con `environment: "node"`
(ver `vitest.config.ts`) — no hay jsdom ni renderizado DOM disponible, por lo que los
tests de componentes React quedan fuera de alcance sin añadir una nueva dependencia
(`@testing-library/react` + `jsdom`), lo que contradiría el principio de no introducir
dependencias sin justificación clara (CLAUDE.md §12).

La única lógica pura y testable de la historia OP-220 es `desk-status.ts` (OP-223):
un mapa estático y la función de resolución del nombre del ocupante que se extraerá
de `DeskItem` (OP-224). Ambas son funciones puras sin dependencias de DOM ni de React,
encajando perfectamente en `tests/unit/`.

Si en el futuro se incorpora jsdom o Playwright, los tests de componente se añadirán
como ampliación. Este ticket cubre lo testable hoy con el stack existente.

## Objetivo

Crear la suite de tests unitarios en `tests/unit/floor-plan.test.ts` que verifique:

1. El mapa `statusColorMap` de `desk-status.ts`: que cada `TableStatus` devuelve las
   clases correctas y que un valor inesperado devuelve el fallback gris.
2. La función de resolución del nombre del ocupante (extraída como utilidad pura en
   `desk-status.ts` durante OP-224): que aplica correctamente la prioridad
   `reservation.userName` > `assignedUser.name` > `null`.

## Restricciones

- Solo Vitest. No añadir `@testing-library/react`, `jsdom` ni ninguna dependencia nueva.
- Los tests deben ser unitarios puros: sin MongoDB, sin Next.js, sin contexto React.
- Si la función de resolución del ocupante no fue extraída como utilidad pura en
  OP-224, extraerla ahora a `desk-status.ts` para hacerla testable. La lógica no
  cambia, solo su ubicación.
- No testear clases CSS concretas de Tailwind más allá de verificar que el mapa
  contiene una entrada no vacía para cada estado — el valor exacto puede cambiar
  durante el desarrollo de UI sin que eso sea un fallo de lógica.
- Los tests deben seguir la estructura `describe` / `it` del resto de la suite
  (ver `tests/unit/week-selector.test.ts` como referencia de estilo).

## Casos límite cubiertos por los tests

- `statusColorMap` con cada uno de los cuatro valores válidos de `TableStatus`.
- `statusColorMap` con un valor no contemplado (`"unknown"` u otro string): devuelve
  el fallback gris, no lanza excepción.
- Resolución de ocupante cuando solo existe `reservation`: devuelve `reservation.userName`.
- Resolución de ocupante cuando solo existe `assignedUser`: devuelve `assignedUser.name`.
- Resolución de ocupante cuando existen ambos: devuelve `reservation.userName`
  (prioridad sobre `assignedUser`).
- Resolución de ocupante cuando ninguno existe: devuelve `null`.
- Resolución de ocupante con `userName` o `name` vacíos (`""`): devuelve `null`.

## Criterios de aceptación

- AC-1: Existe `tests/unit/floor-plan.test.ts` con al menos dos bloques `describe`:
  uno para `statusColorMap` y otro para la función de resolución del ocupante.
- AC-2: Los tests de `statusColorMap` verifican que los cuatro valores de `TableStatus`
  (`green`, `yellow`, `red`, `gray`) tienen una entrada no vacía en el mapa.
- AC-3: El test de valor inesperado en `statusColorMap` verifica que no lanza y
  devuelve el fallback definido (clases del estado `gray`).
- AC-4: Los tests de resolución del ocupante cubren los siete casos límite descritos
  arriba, cada uno en un `it` independiente.
- AC-5: `npm run test:unit` ejecuta la nueva suite y todos los tests pasan.
- AC-6: `npm run test` (suite completa) sigue en verde — los tests nuevos no rompen
  ningún test existente.

## Correcciones previas en DeskItem.tsx (añadidas en OP-225)

Antes de crear los tests se deben corregir dos errores detectados en
`src/components/floor-plan/DeskItem.tsx`:

### Error 1 — Estilos inline (`no-inline-styles`)

`buildRectStyle` devuelve un objeto `CSSProperties` con `left`, `top`, `width`,
`height` y `transform` aplicados como `style={}` inline. Los valores son dinámicos
(vienen de `table.position`) por lo que no pueden moverse a una clase CSS estática.
La solución es expresarlos mediante **CSS custom properties** (`--desk-x`, `--desk-y`,
etc.) en el atributo `style` y consumirlas desde una clase Tailwind con `[var(...)]`,
o bien usar un objeto `style` con solo las variables y una clase CSS que las aplique.

Solución adoptada: usar `style` únicamente para pasar variables CSS
(`--desk-x`, `--desk-y`, `--desk-w`, `--desk-h`, `--desk-rotate`) y definir en
`src/components/floor-plan/desk-item.css` (o en el `className`) las reglas que
consumen esas variables. De este modo el atributo `style` no contiene propiedades
de presentación directas.

### Error 2 — Rol ARIA inválido (`axe/aria`)

`<div role="button">` no es un elemento interactivo semántico válido: carece de
comportamiento nativo de teclado y el linter lo rechaza. La solución es cambiar el
elemento raíz de `DeskItem` de `<div>` a `<button>` cuando la mesa es interactiva,
y a `<div>` (sin role) cuando no lo es. El elemento `<button>` ya tiene
`role="button"` implícito y gestión de teclado nativa (`Enter`/`Space`).

- Criterio de aceptación extra (AC-8): `DeskItem` no usa `role="button"` en ningún
  `<div>`; cuando `onClick` está definido, el elemento raíz es un `<button>`.
- Criterio de aceptación extra (AC-9): `DeskItem` no aplica propiedades de
  presentación directas en `style={}`; solo pasa variables CSS (`--desk-*`).

## Criterio de done

- Todos los AC en PASS (incluyendo AC-8 y AC-9)
- verify en verde
- Spec actualizada con ## Execution Result

## Execution Result

**Fecha:** 2026-05-09
**Estado:** DONE

### Archivos creados / modificados

- `src/components/floor-plan/desk-item.css` — nuevo, define `.desk-item` consumiendo variables CSS `--desk-x/y/w/h/rotate`
- `src/components/floor-plan/desk-status.ts` — añadida `getOccupantName` (extraída de `DeskItem` para ser testable) y exportada
- `src/components/floor-plan/DeskItem.tsx` — `buildRectStyle` → `buildRectVars` (solo pasa CSS custom properties); `<div role="button">` → `<button>` cuando interactivo; importa `desk-item.css`
- `src/components/floor-plan/index.ts` — exporta `getOccupantName`
- `tests/unit/floor-plan.test.ts` — nuevo, 14 tests unitarios puros

### Correcciones de errores (AC-8, AC-9)

- AC-8 ✅ `DeskItem` usa `<button>` cuando `onClick` está definido — no hay `<div role="button">`
- AC-9 ✅ `style={}` solo contiene variables CSS (`--desk-*`), no propiedades de presentación directas

### Criterios de aceptación originales

- AC-1 ✅ `tests/unit/floor-plan.test.ts` con dos bloques `describe`: `statusColorMap` y `getOccupantName`
- AC-2 ✅ Tests verifican que los cuatro `TableStatus` tienen entrada no vacía en el mapa
- AC-3 ✅ Test de valor inesperado: no lanza, devuelve fallback gris
- AC-4 ✅ 7 casos límite de resolución de ocupante, cada uno en un `it` independiente
- AC-5 ✅ `npm run test:unit` pasa (109/109)
- AC-6 ✅ Suite completa en verde, ningún test existente roto

### Nota sobre el error `no-local` del IDE

El error `no-local` en el import de `desk-status` es del linter de Microsoft Edge Tools (extensión del IDE), no de ESLint del proyecto. La extensión `.ts` explícita rompe el build de TypeScript (`allowImportingTsExtensions` no habilitado). El `npm run lint` del proyecto no reporta ningún error — se mantiene la convención del proyecto sin extensión explícita.

### Verificaciones

| Check | Resultado |
|---|---|
| Lint | PASS (0 errores, 4 warnings preexistentes) |
| Tests unitarios | PASS (109/109, +14 nuevos) |
| Tests integración | PASS (102/102) |
| Tests API | PASS (85/85) |
| Build | PASS |
