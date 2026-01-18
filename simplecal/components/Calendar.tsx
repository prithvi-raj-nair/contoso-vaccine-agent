'use client';

import { EventResponse } from '@/lib/types';
import WeekNavigation from './WeekNavigation';
import WeekView from './WeekView';

interface CalendarProps {
  currentWeekStart: Date;
  events: EventResponse[];
  isLoading: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAddEvent: () => void;
  onEventClick: (event: EventResponse) => void;
  onTimeSlotClick: (date: Date) => void;
}

export default function Calendar({
  currentWeekStart,
  events,
  isLoading,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAddEvent,
  onEventClick,
  onTimeSlotClick,
}: CalendarProps) {
  return (
    <div className="flex flex-col h-screen bg-white">
      <WeekNavigation
        currentWeekStart={currentWeekStart}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onToday={onToday}
        onAddEvent={onAddEvent}
      />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading events...</div>
        </div>
      ) : (
        <WeekView
          weekStart={currentWeekStart}
          events={events}
          onEventClick={onEventClick}
          onTimeSlotClick={onTimeSlotClick}
        />
      )}
    </div>
  );
}
