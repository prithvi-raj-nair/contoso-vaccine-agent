'use client';

import { EventResponse } from '@/lib/types';
import DayColumn from './DayColumn';

interface WeekViewProps {
  weekStart: Date;
  events: EventResponse[];
  onEventClick: (event: EventResponse) => void;
  onTimeSlotClick: (date: Date) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function WeekView({
  weekStart,
  events,
  onEventClick,
  onTimeSlotClick,
}: WeekViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysOfWeek = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  const daysOfWeek = getDaysOfWeek();

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.startTime);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  const isToday = (date: Date) => {
    return date.getTime() === today.getTime();
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b bg-white">
        <div className="w-16 flex-shrink-0" />
        {daysOfWeek.map((date, index) => (
          <div
            key={index}
            className={`flex-1 text-center py-2 border-r last:border-r-0 ${
              isToday(date) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-sm text-gray-500">{DAYS[date.getDay()]}</div>
            <div
              className={`text-xl font-semibold ${
                isToday(date)
                  ? 'bg-blue-600 text-white w-8 h-8 rounded-full mx-auto flex items-center justify-center'
                  : 'text-gray-900'
              }`}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row label + Time grid */}
      <div className="flex flex-1 overflow-auto">
        {/* Time labels column */}
        <div className="w-16 flex-shrink-0 bg-white">
          {/* All-day label */}
          <div className="h-[40px] border-b flex items-center justify-center">
            <span className="text-xs text-gray-500">All day</span>
          </div>
          {/* Hour labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-12 border-b border-gray-100 text-xs text-gray-500 text-right pr-2 -mt-2"
            >
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1">
          {daysOfWeek.map((date, index) => (
            <DayColumn
              key={index}
              date={date}
              events={getEventsForDay(date)}
              isToday={isToday(date)}
              onEventClick={onEventClick}
              onTimeSlotClick={onTimeSlotClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
