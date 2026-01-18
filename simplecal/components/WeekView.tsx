'use client';

import { useRef, useEffect } from 'react';
import { EventResponse } from '@/lib/types';
import DayColumn from './DayColumn';
import EventCard from './EventCard';

interface WeekViewProps {
  weekStart: Date;
  events: EventResponse[];
  onEventClick: (event: EventResponse) => void;
  onTimeSlotClick: (date: Date) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // h-12 = 48px
const DEFAULT_SCROLL_HOUR = 6; // Scroll to 6 AM by default

export default function WeekView({
  weekStart,
  events,
  onEventClick,
  onTimeSlotClick,
}: WeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Scroll to 6 AM on initial mount
  useEffect(() => {
    if (scrollContainerRef.current && !hasScrolledRef.current) {
      // Subtract 8px to account for the hour label's -top-2 positioning
      const scrollPosition = (DEFAULT_SCROLL_HOUR * HOUR_HEIGHT) - 8;
      scrollContainerRef.current.scrollTop = scrollPosition;
      hasScrolledRef.current = true;
    }
  }, []);

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

  const getAllDayEventsForDay = (date: Date) => {
    return getEventsForDay(date).filter((event) => event.isAllDay);
  };

  const getTimedEventsForDay = (date: Date) => {
    return getEventsForDay(date).filter((event) => !event.isAllDay);
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
      {/* Day headers - fixed */}
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

      {/* All-day events row - fixed */}
      <div className="flex border-b bg-white">
        <div className="w-16 flex-shrink-0 flex items-center justify-center border-r">
          <span className="text-xs text-gray-500">All day</span>
        </div>
        {daysOfWeek.map((date, index) => {
          const allDayEvents = getAllDayEventsForDay(date);
          return (
            <div
              key={index}
              className={`flex-1 min-h-[40px] p-1 border-r last:border-r-0 overflow-hidden ${
                isToday(date) ? 'bg-blue-50/30' : 'bg-gray-50'
              }`}
            >
              {allDayEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid - scrollable */}
      <div ref={scrollContainerRef} className="flex flex-1 overflow-auto">
        {/* Time labels column */}
        <div className="w-16 flex-shrink-0 bg-white">
          {/* Hour labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-12 border-b border-gray-100 text-xs text-gray-500 text-right pr-2 relative"
            >
              <span className="absolute -top-2 right-2">{formatHour(hour)}</span>
            </div>
          ))}
        </div>

        {/* Day columns - explicit height to match time labels */}
        <div className="flex flex-1" style={{ minHeight: `${24 * HOUR_HEIGHT}px` }}>
          {daysOfWeek.map((date, index) => (
            <DayColumn
              key={index}
              date={date}
              events={getTimedEventsForDay(date)}
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
