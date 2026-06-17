# OP-231 — Panel o modal de detalle de mesa

## Contexto

El plano de mesas (OP-220) ya renderiza `DeskItem` con colores por estado y propaga `onDeskClick` cuando el usuario pulsa una mesa. Hasta ahora ese handler no desencadena ninguna acción visible. Esta subtarea crea la estructura base del panel de detalle: el componente `DeskDetailPanel` que se muestra cuando hay una mesa seleccionada, con su información completa, y un mecanismo de cierre. Las acciones (reservar, cancelar) y los mensajes contextuales se añaden en OP-232, OP-233 y OP-234.

El componente debe ser un panel lateral (drawer) o modal ligero que no interrumpa innecesariamente el flujo visual. Dado que la aplicación ya usa Tailwind v4 y no tiene una librería de componentes de dialogs, se implementa como panel lateral deslizante (`aside`) posicionado sobre el lienzo del plano.

## Objetivo

Implementar el componente `DeskDetailPanel` que:

1. Recibe una `TableAvailability` (o `null`) como prop.
2. Se muestra cuando la prop no es `null`, se oculta cuando es `null`.
3. Muestra la información completa de la mesa: nombre (`label`), tipo, estado y ocupante/asociado.
4. Expone una prop `onClose` que permite al padre limpiar la mesa seleccionada.
5. Se integra en el árbol de componentes del plano (en la página o en `FloorPlan`) de forma que `onDeskClick` en `FloorPlan` actualice el estado del padre y lo pase al panel.

## Restricciones

- Sin lógica de negocio en el componente: solo recibe props y renderiza.
- No realizar fetching de datos: toda la información necesaria ya está en `TableAvailability`.
- No incluir botones de acción (reservar / cancelar) en esta subtarea — son OP-232 y OP-233.
- No incluir mensajes contextuales elaborados — son OP-234.
- Usar solo Tailwind CSS v4 para estilos, sin librerías de UI externas nuevas.
- El componente debe ser accesible: foco gestionado al abrirse, cierre con Escape, `role="dialog"` o implementación semántica equivalente.
- No depender de estado global ni contexto: la mesa seleccionada la gestiona el padre con `useState`.

## Información a mostrar

| Campo | Fuente en `TableAvailability` | Formato visible |
|---|---|---|
| Nombre | `label` | Título del panel |
| Tipo | `type` | Badge/etiqueta: "Flexible", "Fija", "Preferente", "Bloqueada" |
| Estado | `status` | Badge con color: verde/amarillo/rojo/gris |
| Ocupante / asociado | `reservation.userName` o `assignedUser.name` | Nombre en texto, `null` → no mostrar |

### Mapeo de etiquetas de tipo

| `type` | Texto visible |
|---|---|
| `flexible` | Flexible |
| `fixed` | Fija |
| `preferential` | Preferente |
| `blocked` | Bloqueada |

### Mapeo de etiquetas de estado

| `status` | Texto visible | Color de badge |
|---|---|---|
| `green` | Libre | verde |
| `yellow` | Preferente libre | amarillo |
| `red` | Ocupada | rojo |
| `gray` | Bloqueada | gris |

## Casos límite

- Mesa sin reserva ni usuario asignado (`reservation: null`, `assignedUser: null`) — no mostrar sección de ocupante.
- Mesa bloqueada (`status: gray`) — mostrar info, sin ocupante ni acciones (las acciones son de futuras subtareas).
- Panel abierto → usuario pulsa otra mesa → panel actualiza sin cerrar y volver a abrir (transición suave).
- Cierre con tecla Escape — debe cerrar el panel limpiamente.
- El panel no debe cubrir por completo el plano en escritorio; en móvil puede ocupar más pantalla.

## Criterios de aceptación

- AC-1: El componente `DeskDetailPanel` está implementado en `src/components/floor-plan/DeskDetailPanel.tsx` y se exporta desde `src/components/floor-plan/index.ts`.
- AC-2: Recibe `table: TableAvailability | null` y `onClose: () => void` como props tipadas. Cuando `table` es `null`, no renderiza nada (o renderiza `null`).
- AC-3: Cuando `table` no es `null`, muestra el nombre (`label`), tipo (con etiqueta), estado (con etiqueta y color) y ocupante/asociado si existe.
- AC-4: El panel se cierra al pulsar el botón de cierre (llama a `onClose`) y al presionar Escape.
- AC-5: Está integrado en la página principal del plano: `onDeskClick` en `FloorPlan` actualiza `selectedTable` en el estado del padre y lo pasa a `DeskDetailPanel`.
- AC-6: El componente tiene atributos de accesibilidad mínimos: `role="dialog"`, `aria-modal="true"`, `aria-label` con el nombre de la mesa.

## Criterio de done

- Todos los AC en PASS
- verify en verde
- Spec actualizada con ## Execution Result
