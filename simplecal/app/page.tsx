'use client';

import { useState, useEffect, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';
import { EventResponse, CreateEventInput } from '@/lib/types';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function Home() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startDate = formatDateForAPI(currentWeekStart);
      const endDate = formatDateForAPI(weekEnd);

      const response = await fetch(`/api/events?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events);
      } else {
        console.error('Failed to fetch events:', data.error);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setIsModalOpen(true);
  };

  const handleEventClick = (event: EventResponse) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleCreateEvent = async (input: CreateEventInput) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchEvents();
        handleCloseModal();
      } else {
        console.error('Failed to create event:', data.error);
        alert('Failed to create event: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEvents();
        handleCloseModal();
      } else {
        const data = await response.json();
        console.error('Failed to delete event:', data.error);
        alert('Failed to delete event: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
    }
  };

  return (
    <main>
      <Calendar
        currentWeekStart={currentWeekStart}
        events={events}
        isLoading={isLoading}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        onAddEvent={handleAddEvent}
        onEventClick={handleEventClick}
        onTimeSlotClick={handleTimeSlotClick}
      />
      <EventModal
        isOpen={isModalOpen}
        event={selectedEvent}
        selectedDate={selectedDate}
        onClose={handleCloseModal}
        onCreate={handleCreateEvent}
        onDelete={handleDeleteEvent}
      />
    </main>
  );
}
