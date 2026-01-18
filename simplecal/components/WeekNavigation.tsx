'use client';

interface WeekNavigationProps {
  currentWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

export default function WeekNavigation({
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAddEvent,
}: WeekNavigationProps) {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatYear = (date: Date) => {
    return date.getFullYear();
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900">SimpleCal</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNextWeek}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
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
      <button
        onClick={onAddEvent}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        + Add Event
      </button>
    </div>
  );
}
