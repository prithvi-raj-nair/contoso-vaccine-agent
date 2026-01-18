import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { Child, VaccinationVisit, Parent, Village } from '@/types';
import { calculateVaccinationStatus } from '@/lib/vaccination-logic';

// GET /api/children/[id] - Get child details with vaccination status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid child ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const child = await db.collection<Child>('children').findOne({
      _id: new ObjectId(id),
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Get vaccination history
    const vaccinations = await db
      .collection<VaccinationVisit>('vaccination_visits')
      .find({ childId: child._id })
      .sort({ visitDate: -1 })
      .toArray();

    // Calculate vaccination status
    const vaccinationStatus = calculateVaccinationStatus(
      child.dateOfBirth,
      vaccinations
    );

    // Get parent info
    const parent = await db.collection<Parent>('parents').findOne({
      _id: child.parentId,
    });

    // Get village name
    const village = await db.collection<Village>('villages').findOne({
      villageId: child.villageId,
    });

    return NextResponse.json({
      child: {
        ...child,
        parentName: parent?.name,
        villageName: village?.name || child.villageId,
      },
      vaccinationStatus,
      vaccinationHistory: vaccinations,
    });
  } catch (error) {
    console.error('Error fetching child:', error);
    return NextResponse.json(
      { error: 'Failed to fetch child' },
      { status: 500 }
    );
  }
}
