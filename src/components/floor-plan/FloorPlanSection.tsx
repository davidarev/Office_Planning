"use client";

import { useCallback, useState } from "react";
import type { TableAvailability, TableStatus } from "@/domain/types";
import { useDateSelection } from "@/context/date-selection.context";
import { useAvailability } from "@/hooks/use-availability";
import { usePolling, POLLING_INTERVAL_MS } from "@/hooks/use-polling";
import { useReservation } from "@/hooks/use-reservation";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { FloorPlanClient } from "./FloorPlanClient";
import {
  applyOverrides,
  applyRollback,
  type OptimisticOverride,
  type OptimisticOverrides,
} from "./optimistic-overrides";

interface FloorPlanSectionProps {
  currentUserId: string;
}

const USER_FACING_ERROR =
  "No se pudo cargar la disponibilidad. Inténtalo de nuevo.";

/**
 * Calcula el estado al que vuelve una mesa tras cancelar su reserva.
 *
 * Las mesas preferentes vuelven a amarillo; cualquier otro tipo vuelve a
 * verde (fallback seguro para tipos que no deberían cancelarse desde la UI).
 *
 * @param type - Tipo de la mesa.
 * @returns El status sin reserva correspondiente.
 */
function statusAfterCancel(type: TableAvailability["type"]): TableStatus {
  return type === "preferential" ? "yellow" : "green";
}

/**
 * Client Component that wires date selection to availability fetching and
 * passes real desk data (with optimistic overrides applied) to FloorPlanClient.
 *
 * Manages the optimistic update layer for both reserve and cancel:
 * - Reserve: status flips to "red" immediately (before the server responds).
 * - Cancel: status flips back to "green"/"yellow" and `reservation` becomes
 *   null immediately.
 *
 * On success the override stays until the next refetch; on failure it is
 * rolled back via {@link applyRollback} and the error is re-thrown so the
 * panel can show it (OP-254).
 *
 * Overrides are cleared whenever `selectedDay` changes (AC-3 / AC-4).
 *
 * @param currentUserId - ID of the authenticated user.
 */
export function FloorPlanSection({ currentUserId }: FloorPlanSectionProps) {
  const { selectedDay } = useDateSelection();
  const { data, loading, error, refetch } = useAvailability(
    selectedDay.dateString,
  );
  const { reserve, cancelReservation, isReserving, isCancelling } =
    useReservation();

  // Pause polling while a mutation is in-flight to avoid a refetch racing
  // with the optimistic override (AC-3, OP-260).
  const isOperationInProgress = isReserving || isCancelling;
  usePolling(refetch, POLLING_INTERVAL_MS, !isOperationInProgress);

  // Track overrides together with the day they belong to.
  // When selectedDay changes, the stored day won't match so we treat the
  // overrides as empty — no effect, no cascading renders (AC-3 / AC-4).
  const [overrideDay, setOverrideDay] = useState(selectedDay.dateString);
  const [optimisticOverrides, setOptimisticOverrides] =
    useState<OptimisticOverrides>(new Map());

  const activeOverrides =
    overrideDay === selectedDay.dateString
      ? optimisticOverrides
      : new Map<string, OptimisticOverride>();

  const handleReserve = useCallback(
    async (tableId: string, date: string): Promise<void> => {
      // Apply optimistic update immediately (AC-1, AC-2).
      setOverrideDay(date);
      setOptimisticOverrides((prev) => {
        const next = new Map(prev);
        next.set(tableId, {
          status: "red",
          reservation: {
            _id: "optimistic",
            userName: "Tú",
            isOwner: true,
          },
        });
        return next;
      });

      const errorMsg = await reserve(tableId, date, {
        onRollback: () => {
          setOptimisticOverrides((prev) => applyRollback(prev, tableId));
        },
      });

      if (errorMsg === null) {
        // AC-4: trigger refetch so server data replaces the optimistic state.
        refetch();
      } else {
        // Rollback already applied via onRollback; surface the error so the
        // panel renders it (OP-254).
        throw new Error(errorMsg);
      }
    },
    [reserve, refetch],
  );

  const handleCancel = useCallback(
    async (
      reservationId: string,
      tableId: string,
      tableType: TableAvailability["type"],
      date: string,
    ): Promise<void> => {
      // Apply optimistic update immediately: desk goes back to green/yellow
      // and loses its reservation (OP-253 AC-1, AC-2, AC-3).
      setOverrideDay(date);
      setOptimisticOverrides((prev) => {
        const next = new Map(prev);
        next.set(tableId, {
          status: statusAfterCancel(tableType),
          reservation: null,
        });
        return next;
      });

      const errorMsg = await cancelReservation(reservationId, {
        onRollback: () => {
          setOptimisticOverrides((prev) => applyRollback(prev, tableId));
        },
      });

      if (errorMsg === null) {
        // AC-5: trigger refetch so server data replaces the optimistic state.
        refetch();
      } else {
        // Rollback already applied via onRollback; surface the error so the
        // panel renders it (OP-254).
        throw new Error(errorMsg);
      }
    },
    [cancelReservation, refetch],
  );

  if (loading && !data) {
    return <LoadingOverlay />;
  }

  if (error && !data) {
    return <ErrorMessage message={USER_FACING_ERROR} onRetry={refetch} />;
  }

  const tables = applyOverrides(data ?? [], activeOverrides);
  const userHasReservationToday = tables.some(
    (t) => t.reservation?.isOwner === true,
  );

  return (
    <FloorPlanClient
      tables={tables}
      userHasReservationToday={userHasReservationToday}
      currentUserId={currentUserId}
      onReserve={handleReserve}
      onCancel={handleCancel}
      onReservationCreated={refetch}
      isReserving={isReserving}
      isCancelling={isCancelling}
    />
  );
}
