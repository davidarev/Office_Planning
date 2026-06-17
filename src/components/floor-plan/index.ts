export {
  FloorPlan,
  DEFAULT_FLOOR_PLAN_WIDTH,
  DEFAULT_FLOOR_PLAN_HEIGHT,
} from "./FloorPlan";
export { DeskItem } from "./DeskItem";
export { statusColorMap, getStatusColorClasses, getOccupantName } from "./desk-status";
export { DeskDetailPanel } from "./DeskDetailPanel";
export { FloorPlanClient } from "./FloorPlanClient";
export { FloorPlanSection } from "./FloorPlanSection";
export {
  applyOverrides,
  applyRollback,
  type OptimisticOverride,
  type OptimisticOverrides,
} from "./optimistic-overrides";
