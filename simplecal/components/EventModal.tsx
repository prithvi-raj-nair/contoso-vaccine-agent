'use client';

import { useState, useEffect, useMemo } from 'react';
import { EventResponse, CreateEventInput } from '@/lib/types';

interface EventModalProps {
  isOpen: boolean;
  event: EventResponse | null;
  selectedDate: Date | null;
  onClose: () => void;
  onCreate: (event: CreateEventInput) => void;
  onDelete: (id: string) => void;
}

export default function EventModal({
  isOpen,
  event,
  selectedDate,
  onClose,
  onCreate,
  onDelete,
}: EventModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);

  // Validate that start datetime is before end datetime
  const dateTimeError = useMemo(() => {
    if (!startDate || !endDate) return null;

    if (isAllDay) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      if (start > end) {
        return 'End date must be on or after start date';
      }
    } else {
      if (!startTime || !endTime) return null;
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(`${endDate}T${endTime}:00`);
      if (start >= end) {
        return 'End date/time must be after start date/time';
      }
    }
    return null;
  }, [startDate, startTime, endDate, endTime, isAllDay]);

  useEffect(() => {
    // Helper to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper to format time as HH:MM in local timezone
    const formatLocalTime = (date: Date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    if (event) {
      // View/Edit mode - use local timezone
      setName(event.name);
      setDescription(event.description);
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      setStartDate(formatLocalDate(start));
      setStartTime(formatLocalTime(start));
      setEndDate(formatLocalDate(end));
      setEndTime(formatLocalTime(end));
      setIsAllDay(event.isAllDay);
    } else if (selectedDate) {
      // Create mode with selected date - use local timezone
      setStartDate(formatLocalDate(selectedDate));
      setEndDate(formatLocalDate(selectedDate));
      setName('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setIsAllDay(false);
    }
  }, [event, selectedDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if there's a validation error
    if (dateTimeError) return;

    let startDateTimeObj: Date;
    let endDateTimeObj: Date;

    if (isAllDay) {
      // For all-day events, use local midnight
      startDateTimeObj = new Date(`${startDate}T00:00:00`);
      endDateTimeObj = new Date(`${endDate}T23:59:59.999`);
    } else {
      // Create Date objects in local timezone
      startDateTimeObj = new Date(`${startDate}T${startTime}:00`);
      endDateTimeObj = new Date(`${endDate}T${endTime}:00`);
    }

    onCreate({
      name,
      description,
      startTime: startDateTimeObj.toISOString(),
      endTime: endDateTimeObj.toISOString(),
      isAllDay,
    });
  };

  const handleDelete = () => {
    if (event && confirm('Are you sure you want to delete this event?')) {
      onDelete(event._id);
    }
  };

  if (!isOpen) return null;

  const isViewMode = !!event;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isViewMode ? 'Event Details' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-700 hover:bg-gray-100 rounded transition-colors border"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isViewMode ? (
          <div className="px-6 py-4">
            <h3 className="text-xl font-medium text-gray-900 mb-2">{event.name}</h3>
            {event.description && (
              <p className="text-gray-600 mb-4">{event.description}</p>
            )}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(event.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {!event.isAllDay && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {new Date(event.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                    {' - '}
                    {new Date(event.endTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              )}
              {event.isAllDay && (
                <div className="text-blue-600 font-medium">All day</div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete Event
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Outreach Visit - Rampur"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Vaccine A: 5, Vaccine B: 3"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAllDay"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isAllDay" className="text-sm text-gray-700">
                All day event
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {!isAllDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {!isAllDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {dateTimeError && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
                {dateTimeError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!dateTimeError}
                className={`px-4 py-2 font-medium rounded-md transition-colors ${
                  dateTimeError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Create Event
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
