"use client";

import { useState, useMemo } from "react";
import {
  getWorkWeeks,
  getDefaultWorkDay,
  type WorkDay,
} from "@/lib/week-selector";
import { WeekSelector } from "@/components/booking/WeekSelector";
import { DaySelector } from "@/components/booking/DaySelector";
import { DateSelectionContext } from "@/context/date-selection.context";

/**
 * Manages week and day selection state and exposes the selected day
 * to descendant components via DateSelectionContext.
 *
 * State is initialized once on mount:
 * - selectedDay: getDefaultWorkDay() (today if workday, else next Monday)
 * - selectedWeekOffset: derived from which week contains the default day
 *
 * Changing weeks resets selectedDay to the first day of the new week.
 * Changing days updates selectedDay directly.
 */
export function DateSelectionProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  // Computed once at mount — does not change during the session.
  const weeks = useMemo(() => getWorkWeeks(), []);
  const defaultDay = useMemo(() => getDefaultWorkDay(), []);

  // Derive initial week offset: find which week contains the default day.
  const initialOffset = useMemo(() => {
    const inCurrent = weeks[0].days.some(
      (d) => d.dateString === defaultDay.dateString
    );
    return inCurrent ? 0 : 1;
  }, [weeks, defaultDay]);

  const [selectedWeekOffset, setSelectedWeekOffset] = useState(initialOffset);
  const [selectedDay, setSelectedDay] = useState<WorkDay>(defaultDay);

  function handleWeekChange(offset: number) {
    setSelectedWeekOffset(offset);
    setSelectedDay(weeks[offset].days[0]);
  }

  function handleDayChange(day: WorkDay) {
    setSelectedDay(day);
  }

  return (
    <DateSelectionContext.Provider value={{ selectedDay }}>
      <div className="flex flex-col gap-3">
        <WeekSelector
          weeks={weeks}
          selectedWeekOffset={selectedWeekOffset}
          onWeekChange={handleWeekChange}
        />
        <DaySelector
          days={weeks[selectedWeekOffset].days}
          selectedDateString={selectedDay.dateString}
          onDayChange={handleDayChange}
        />
      </div>
      {children}
    </DateSelectionContext.Provider>
  );
}
