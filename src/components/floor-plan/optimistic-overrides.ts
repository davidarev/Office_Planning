import type { TableAvailability, TableStatus } from "@/domain/types";

/**
 * Override optimista que se mezcla sobre los datos del servidor antes de
 * renderizar. Solo afecta a `status` y `reservation` — el resto de campos
 * de la mesa se mantienen intactos.
 *
 * Al reservar: `{ status: "red", reservation: { ...isOwner: true } }`.
 * Al cancelar: `{ status: "green" | "yellow", reservation: null }`.
 */
export type OptimisticOverride = {
  status: TableStatus;
  reservation: TableAvailability["reservation"] | null;
};

/** Mapa de overrides optimistas indexado por `tableId`. */
export type OptimisticOverrides = Map<string, OptimisticOverride>;

/**
 * Mezcla los overrides optimistas sobre el array de mesas del servidor.
 *
 * Función pura: no muta el array original ni los overrides. Para cada mesa,
 * si existe un override para su `tableId`, se aplican sus campos sobre la mesa;
 * en caso contrario se devuelve la mesa original sin cambios.
 *
 * @param tables - Mesas con los datos reales del servidor.
 * @param overrides - Overrides optimistas pendientes de confirmación.
 * @returns Un nuevo array con los overrides aplicados.
 */
export function applyOverrides(
  tables: TableAvailability[],
  overrides: OptimisticOverrides,
): TableAvailability[] {
  if (overrides.size === 0) return tables;
  return tables.map((t) => {
    const override = overrides.get(t.tableId);
    return override ? { ...t, ...override } : t;
  });
}

/**
 * Devuelve un nuevo mapa de overrides sin el override de la mesa indicada.
 *
 * Se usa para revertir un cambio optimista cuando el backend rechaza la
 * operación (OP-254): al eliminar el override, el siguiente render usa los
 * datos del servidor, recuperando el estado original de la mesa.
 *
 * Función pura: no muta el mapa recibido.
 *
 * @param overrides - Mapa actual de overrides.
 * @param tableId - Mesa cuyo override se quiere revertir.
 * @returns Un nuevo mapa sin el override de `tableId`.
 */
export function applyRollback(
  overrides: OptimisticOverrides,
  tableId: string,
): OptimisticOverrides {
  if (!overrides.has(tableId)) return overrides;
  const next = new Map(overrides);
  next.delete(tableId);
  return next;
}
