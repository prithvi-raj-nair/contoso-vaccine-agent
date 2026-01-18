import { ObjectId } from 'mongodb';

export interface CalendarEvent {
  _id: ObjectId;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventInput {
  name: string;
  description?: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  isAllDay?: boolean;
}

export interface EventResponse {
  _id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toEventResponse(event: CalendarEvent): EventResponse {
  return {
    _id: event._id.toString(),
    name: event.name,
    description: event.description,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    isAllDay: event.isAllDay,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
