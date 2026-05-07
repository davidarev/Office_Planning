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

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result
