'use client';

import { EventResponse } from '@/lib/types';

interface EventCardProps {
  event: EventResponse;
  onClick: () => void;
  height?: number;
}

export default function EventCard({ event, onClick, height }: EventCardProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  // For timed events with height, fill the container
  // For all-day events, use auto height
  const cardStyle = height ? { height: `${height - 2}px` } : {};

  return (
    <div
      onClick={handleClick}
      style={cardStyle}
      className="px-2 py-1 bg-blue-100 border-l-4 border-blue-600 rounded-r cursor-pointer hover:bg-blue-200 transition-colors overflow-hidden"
    >
      <div className="text-sm font-medium text-blue-900 truncate">{event.name}</div>
      {!event.isAllDay && (
        <div className="text-xs text-blue-700 truncate">
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
      )}
    </div>
  );
}
