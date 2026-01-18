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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
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
      if (!silent) setIsLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Poll for updates every 10 seconds to catch agent-added events
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchEvents(true); // Silent refresh - no loading spinner
    }, 10000);

    return () => clearInterval(pollInterval);
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

  const handleDemoAction = async (action: 'deleteAll' | 'createPastOutreach' | 'createNextTwoWeeks') => {
    const actionMessages = {
      deleteAll: 'Are you sure you want to delete ALL events?',
      createPastOutreach: 'Create 5 past vaccine outreach events?',
      createNextTwoWeeks: 'Create demo events for the next 2 weeks?',
    };

    if (!confirm(actionMessages[action])) return;

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchEvents();
        alert(data.message);
      } else {
        console.error('Demo action failed:', data.error);
        alert('Demo action failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error executing demo action:', error);
      alert('Error executing demo action');
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
        onDemoAction={handleDemoAction}
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
