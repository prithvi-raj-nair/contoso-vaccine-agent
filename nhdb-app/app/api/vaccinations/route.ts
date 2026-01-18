import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { VaccinationVisit, CreateVaccinationInput } from '@/types';

// POST /api/vaccinations - Record a vaccination visit
export async function POST(request: NextRequest) {
  try {
    const body: CreateVaccinationInput = await request.json();

    // Validate required fields
    if (!body.childId || !body.visitDate || !body.vaccineGiven) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, visitDate, vaccineGiven' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(body.childId)) {
      return NextResponse.json(
        { error: 'Invalid child ID' },
        { status: 400 }
      );
    }

    const validVaccines = ['A', 'B', 'C', 'none_required', 'not_available'];
    if (!validVaccines.includes(body.vaccineGiven)) {
      return NextResponse.json(
        { error: 'Invalid vaccineGiven value. Must be one of: A, B, C, none_required, not_available' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify child exists
    const child = await db.collection('children').findOne({
      _id: new ObjectId(body.childId),
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Check if this vaccine was already given to this child
    if (['A', 'B', 'C'].includes(body.vaccineGiven)) {
      const existingVaccination = await db
        .collection<VaccinationVisit>('vaccination_visits')
        .findOne({
          childId: new ObjectId(body.childId),
          vaccineGiven: body.vaccineGiven,
        });

      if (existingVaccination) {
        return NextResponse.json(
          { error: `Vaccine ${body.vaccineGiven} has already been given to this child` },
          { status: 409 }
        );
      }
    }

    const now = new Date();
    const vaccination: Omit<VaccinationVisit, '_id'> = {
      childId: new ObjectId(body.childId),
      visitDate: new Date(body.visitDate),
      vaccineGiven: body.vaccineGiven,
      notes: body.notes,
      createdAt: now,
    };

    const result = await db
      .collection<VaccinationVisit>('vaccination_visits')
      .insertOne(vaccination as VaccinationVisit);

    return NextResponse.json({
      success: true,
      vaccination: {
        _id: result.insertedId,
        ...vaccination,
      },
    });
  } catch (error) {
    console.error('Error recording vaccination:', error);
    return NextResponse.json(
      { error: 'Failed to record vaccination' },
      { status: 500 }
    );
  }
}

// GET /api/vaccinations?childId=XXX - Get vaccination history for a child
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'childId query parameter is required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(childId)) {
      return NextResponse.json(
        { error: 'Invalid child ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const vaccinations = await db
      .collection<VaccinationVisit>('vaccination_visits')
      .find({ childId: new ObjectId(childId) })
      .sort({ visitDate: -1 })
      .toArray();

    return NextResponse.json({ vaccinations });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vaccinations' },
      { status: 500 }
    );
  }
}
