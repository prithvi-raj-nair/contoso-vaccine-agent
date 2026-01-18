'use client';

import { useState, useRef, useEffect } from 'react';

interface WeekNavigationProps {
  currentWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAddEvent: () => void;
  onDemoAction: (action: 'deleteAll' | 'createPastOutreach' | 'createNextTwoWeeks') => void;
}

export default function WeekNavigation({
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAddEvent,
  onDemoAction,
}: WeekNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatYear = (date: Date) => {
    return date.getFullYear();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action: 'deleteAll' | 'createPastOutreach' | 'createNextTwoWeeks') => {
    setIsMenuOpen(false);
    onDemoAction(action);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900">SimpleCal</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors border"
            aria-label="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNextWeek}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors border"
            aria-label="Next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors border"
          >
            Today
          </button>
        </div>
        <span className="text-lg font-medium text-gray-700">
          {formatDate(currentWeekStart)} - {formatDate(weekEnd)}, {formatYear(currentWeekStart)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAddEvent}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Event
        </button>

        {/* Demo Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors border"
            aria-label="Demo menu"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  Demo Actions
                </div>
                <button
                  onClick={() => handleMenuAction('deleteAll')}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete all events
                </button>
                <button
                  onClick={() => handleMenuAction('createPastOutreach')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Create past outreach events
                </button>
                <button
                  onClick={() => handleMenuAction('createNextTwoWeeks')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Create next 2 weeks events
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
