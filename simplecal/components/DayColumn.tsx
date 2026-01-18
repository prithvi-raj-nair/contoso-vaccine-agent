'use client';

import { EventResponse } from '@/lib/types';
import EventCard from './EventCard';

interface DayColumnProps {
  date: Date;
  events: EventResponse[]; // Only timed events (not all-day)
  isToday: boolean;
  onEventClick: (event: EventResponse) => void;
  onTimeSlotClick: (date: Date) => void;
}

const HOUR_HEIGHT = 48; // h-12 = 48px

export default function DayColumn({
  date,
  events,
  isToday,
  onEventClick,
  onTimeSlotClick,
}: DayColumnProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventPosition = (event: EventResponse) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    // Calculate top position based on start time
    const startHour = start.getHours();
    const startMinutes = start.getMinutes();
    const top = (startHour + startMinutes / 60) * HOUR_HEIGHT;

    // Calculate height based on duration (minimum 1 hour)
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.max(1, durationMs / (1000 * 60 * 60));
    const height = durationHours * HOUR_HEIGHT;

    return { top, height };
  };

  const handleTimeSlotClick = (hour: number) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);
    onTimeSlotClick(clickedDate);
  };

  return (
    <div className="flex flex-col flex-1 border-r last:border-r-0 min-w-0 h-full">
      {/* Time slots - fixed height for 24 hours (24 * 48px = 1152px) */}
      <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
        {/* Hour grid lines (clickable) */}
        {hours.map((hour) => (
          <div
            key={hour}
            onClick={() => handleTimeSlotClick(hour)}
            className={`h-12 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
              isToday ? 'bg-blue-50/30' : ''
            }`}
          />
        ))}

        {/* Events positioned absolutely */}
        {events.map((event) => {
          const { top, height } = getEventPosition(event);
          return (
            <div
              key={event._id}
              className="absolute left-0 right-0 px-0.5"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <EventCard
                event={event}
                onClick={() => onEventClick(event)}
                height={height}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
