'use client';

import { EventResponse } from '@/lib/types';
import EventCard from './EventCard';

interface DayColumnProps {
  date: Date;
  events: EventResponse[];
  isToday: boolean;
  onEventClick: (event: EventResponse) => void;
  onTimeSlotClick: (date: Date) => void;
}

export default function DayColumn({
  date,
  events,
  isToday,
  onEventClick,
  onTimeSlotClick,
}: DayColumnProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      if (event.isAllDay) return false;
      const eventStart = new Date(event.startTime);
      return eventStart.getHours() === hour;
    });
  };

  const getAllDayEvents = () => {
    return events.filter((event) => event.isAllDay);
  };

  const handleTimeSlotClick = (hour: number) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);
    onTimeSlotClick(clickedDate);
  };

  return (
    <div className="flex flex-col flex-1 border-r last:border-r-0">
      {/* All-day events section */}
      <div className="min-h-[40px] border-b bg-gray-50 p-1">
        {getAllDayEvents().map((event) => (
          <EventCard key={event._id} event={event} onClick={() => onEventClick(event)} />
        ))}
      </div>

      {/* Time slots */}
      <div className="flex-1 relative">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div
              key={hour}
              onClick={() => handleTimeSlotClick(hour)}
              className={`h-12 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                isToday ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="p-0.5">
                {hourEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
