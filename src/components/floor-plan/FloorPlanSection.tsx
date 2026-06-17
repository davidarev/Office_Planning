"use client";

import { useDateSelection } from "@/context/date-selection.context";
import { useAvailability } from "@/hooks/use-availability";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { FloorPlanClient } from "./FloorPlanClient";

interface FloorPlanSectionProps {
  currentUserId: string;
}

const USER_FACING_ERROR =
  "No se pudo cargar la disponibilidad. Inténtalo de nuevo.";

/**
 * Client Component that wires date selection to availability fetching and
 * passes real desk data to FloorPlanClient.
 *
 * Renders a loading overlay while data is in flight and an error banner
 * (with retry) when the fetch fails. The date selector remains interactive
 * in both states since it lives outside this component.
 *
 * Must be rendered inside a DateSelectionProvider so that useDateSelection()
 * has access to the selected day.
 *
 * @param currentUserId - ID of the authenticated user, used to derive userHasReservationToday.
 */
export function FloorPlanSection({ currentUserId }: FloorPlanSectionProps) {
  const { selectedDay } = useDateSelection();
  const { data, loading, error, refetch } = useAvailability(
    selectedDay.dateString,
  );

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return (
      <ErrorMessage message={USER_FACING_ERROR} onRetry={refetch} />
    );
  }

  const userHasReservationToday =
    data?.some((t) => t.reservation?.userId === currentUserId) ?? false;

  return (
    <FloorPlanClient
      tables={data ?? []}
      userHasReservationToday={userHasReservationToday}
      currentUserId={currentUserId}
      onReservationCreated={refetch}
    />
  );
}
