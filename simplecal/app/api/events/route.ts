import { NextRequest, NextResponse } from 'next/server';
import getClientPromise from '@/lib/mongodb';
import { CalendarEvent, CreateEventInput, toEventResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB_NAME = 'simplecal';
const COLLECTION_NAME = 'events';

// GET /api/events - List events by date range
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const collection = db.collection<CalendarEvent>(COLLECTION_NAME);

    let query = {};
    if (startDate && endDate) {
      query = {
        startTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z'),
        },
      };
    }

    const events = await collection.find(query).sort({ startTime: 1 }).toArray();
    const response = events.map(toEventResponse);

    return NextResponse.json({ events: response });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body: CreateEventInput = await request.json();

    if (!body.name || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startTime, endTime' },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const collection = db.collection<CalendarEvent>(COLLECTION_NAME);

    const now = new Date();
    const newEvent = {
      name: body.name,
      description: body.description || '',
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      isAllDay: body.isAllDay || false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newEvent as CalendarEvent);

    const insertedEvent = await collection.findOne({ _id: result.insertedId });
    if (!insertedEvent) {
      return NextResponse.json(
        { error: 'Failed to retrieve created event' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { event: toEventResponse(insertedEvent) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
