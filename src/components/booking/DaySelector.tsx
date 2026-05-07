"use client";

import type { WorkDay } from "@/lib/week-selector";

interface DaySelectorProps {
  days: WorkDay[];
  selectedDateString: string;
  onDayChange: (day: WorkDay) => void;
}

/**
 * Renders a button for each working day in the active week.
 * Controlled component — state lives in the parent.
 *
 * @param days - The 5 working days (Mon–Fri) of the selected week
 * @param selectedDateString - "YYYY-MM-DD" of the currently active day
 * @param onDayChange - Called with the WorkDay when an inactive day is clicked
 */
export function DaySelector({
  days,
  selectedDateString,
  onDayChange,
}: DaySelectorProps) {
  return (
    <div className="flex gap-1">
      {days.map((day) => {
        const isActive = day.dateString === selectedDateString;
        return (
          <button
            key={day.dateString}
            onClick={() => {
              if (!isActive) onDayChange(day);
            }}
            aria-pressed={isActive}
            className={[
              "flex flex-col items-center rounded-lg px-3 py-2 text-sm transition-colors min-w-[3rem]",
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            <span className="font-medium">{day.label}</span>
            <span className="text-xs">{day.dayNumber}</span>
          </button>
        );
      })}
    </div>
  );
}
