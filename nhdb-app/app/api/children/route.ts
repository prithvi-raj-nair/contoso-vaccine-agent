import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { Child, CreateChildInput, VaccinationVisit } from '@/types';
import { calculateVaccinationStatus } from '@/lib/vaccination-logic';

// POST /api/children - Create new child
export async function POST(request: NextRequest) {
  try {
    const body: CreateChildInput = await request.json();

    // Validate required fields
    if (!body.name || !body.dateOfBirth || !body.parentId || !body.villageId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, dateOfBirth, parentId, villageId' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(body.parentId)) {
      return NextResponse.json(
        { error: 'Invalid parent ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify parent exists
    const parent = await db.collection('parents').findOne({
      _id: new ObjectId(body.parentId),
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const child: Omit<Child, '_id'> = {
      name: body.name,
      dateOfBirth: new Date(body.dateOfBirth),
      parentId: new ObjectId(body.parentId),
      villageId: body.villageId,
      govtId: body.govtId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Child>('children').insertOne(child as Child);

    return NextResponse.json({
      success: true,
      child: {
        _id: result.insertedId,
        ...child,
      },
    });
  } catch (error) {
    console.error('Error creating child:', error);
    return NextResponse.json(
      { error: 'Failed to create child' },
      { status: 500 }
    );
  }
}

// GET /api/children?parentId=XXX - Get children of a parent
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json(
        { error: 'parentId query parameter is required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(parentId)) {
      return NextResponse.json(
        { error: 'Invalid parent ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const children = await db
      .collection<Child>('children')
      .find({ parentId: new ObjectId(parentId) })
      .toArray();

    // Get vaccination status for each child
    const childrenWithStatus = await Promise.all(
      children.map(async (child) => {
        const vaccinations = await db
          .collection<VaccinationVisit>('vaccination_visits')
          .find({ childId: child._id })
          .sort({ visitDate: 1 })
          .toArray();

        const vaccinationStatus = calculateVaccinationStatus(
          child.dateOfBirth,
          vaccinations
        );

        return {
          ...child,
          vaccinationStatus,
        };
      })
    );

    return NextResponse.json({ children: childrenWithStatus });
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}
