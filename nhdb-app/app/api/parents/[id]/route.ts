import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { Parent } from '@/types';

// GET /api/parents/[id] - Get parent by MongoDB ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid parent ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const parent = await db.collection<Parent>('parents').findOne({
      _id: new ObjectId(id),
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Get children for this parent
    const children = await db
      .collection('children')
      .find({ parentId: parent._id })
      .toArray();

    // Get village name
    const village = await db.collection('villages').findOne({
      villageId: parent.villageId,
    });

    return NextResponse.json({
      parent: {
        ...parent,
        villageName: village?.name || parent.villageId,
      },
      children,
    });
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parent' },
      { status: 500 }
    );
  }
}
