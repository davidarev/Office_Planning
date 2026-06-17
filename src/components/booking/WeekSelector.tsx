"use client";

import type { WorkWeek } from "@/lib/week-selector";

interface WeekSelectorProps {
  weeks: [WorkWeek, WorkWeek];
  selectedWeekOffset: number;
  onWeekChange: (offset: number) => void;
}

/**
 * Renders two tab buttons for navigating between the current and next work week.
 * Controlled component — state lives in the parent.
 *
 * @param weeks - Tuple [currentWeek, nextWeek] from getWorkWeeks()
 * @param selectedWeekOffset - 0 for current week, 1 for next week
 * @param onWeekChange - Called with the new offset when an inactive tab is clicked
 */
export function WeekSelector({
  weeks,
  selectedWeekOffset,
  onWeekChange,
}: WeekSelectorProps) {
  return (
    <div role="tablist" className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {weeks.map((week) => {
        const isActive = week.weekOffset === selectedWeekOffset;
        return (
          <button
            key={week.weekOffset}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (!isActive) onWeekChange(week.weekOffset);
            }}
            className={[
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {week.label}
          </button>
        );
      })}
    </div>
  );
}
