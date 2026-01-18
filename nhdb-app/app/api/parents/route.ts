import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Parent, CreateParentInput, Child, VaccinationVisit } from '@/types';
import { calculateVaccinationStatus } from '@/lib/vaccination-logic';

// POST /api/parents - Create new parent
export async function POST(request: NextRequest) {
  try {
    const body: CreateParentInput = await request.json();

    // Validate required fields
    if (!body.govtId || !body.name || !body.dateOfBirth || !body.villageId) {
      return NextResponse.json(
        { error: 'Missing required fields: govtId, name, dateOfBirth, villageId' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if parent with same govtId already exists
    const existingParent = await db.collection<Parent>('parents').findOne({
      govtId: body.govtId,
    });

    if (existingParent) {
      return NextResponse.json(
        { error: 'A parent with this government ID already exists' },
        { status: 409 }
      );
    }

    const now = new Date();
    const parent: Omit<Parent, '_id'> = {
      govtId: body.govtId,
      name: body.name,
      dateOfBirth: new Date(body.dateOfBirth),
      villageId: body.villageId,
      phoneNumber: body.phoneNumber,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Parent>('parents').insertOne(parent as Parent);

    return NextResponse.json({
      success: true,
      parent: {
        _id: result.insertedId,
        ...parent,
      },
    });
  } catch (error) {
    console.error('Error creating parent:', error);
    return NextResponse.json(
      { error: 'Failed to create parent' },
      { status: 500 }
    );
  }
}

// GET /api/parents?govtId=XXX - Search parent by govt ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const govtId = searchParams.get('govtId');

    if (!govtId) {
      return NextResponse.json(
        { error: 'govtId query parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Find parent by govt ID (case-insensitive)
    const parent = await db.collection<Parent>('parents').findOne({
      govtId: { $regex: new RegExp(`^${govtId}$`, 'i') },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Get children for this parent
    const children = await db
      .collection<Child>('children')
      .find({ parentId: parent._id })
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

    // Get village name
    const village = await db.collection('villages').findOne({
      villageId: parent.villageId,
    });

    return NextResponse.json({
      parent: {
        ...parent,
        villageName: village?.name || parent.villageId,
      },
      children: childrenWithStatus,
    });
  } catch (error) {
    console.error('Error searching parent:', error);
    return NextResponse.json(
      { error: 'Failed to search parent' },
      { status: 500 }
    );
  }
}
