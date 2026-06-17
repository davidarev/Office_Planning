"use client";

import { useDateSelection } from "@/context/date-selection.context";
import { useAvailability } from "@/hooks/use-availability";
import { FloorPlanClient } from "./FloorPlanClient";

interface FloorPlanSectionProps {
  currentUserId: string;
}

/**
 * Client Component that wires date selection to availability fetching and
 * passes real desk data to FloorPlanClient.
 *
 * Must be rendered inside a DateSelectionProvider so that useDateSelection()
 * has access to the selected day.
 *
 * @param currentUserId - ID of the authenticated user, used to derive userHasReservationToday.
 */
export function FloorPlanSection({ currentUserId }: FloorPlanSectionProps) {
  const { selectedDay } = useDateSelection();
  const { data, refetch } = useAvailability(selectedDay.dateString);

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
