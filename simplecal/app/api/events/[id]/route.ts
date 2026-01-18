import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import getClientPromise from '@/lib/mongodb';
import { CalendarEvent, toEventResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB_NAME = 'simplecal';
const COLLECTION_NAME = 'events';

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const collection = db.collection<CalendarEvent>(COLLECTION_NAME);

    const event = await collection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event: toEventResponse(event) });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const collection = db.collection<CalendarEvent>(COLLECTION_NAME);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
