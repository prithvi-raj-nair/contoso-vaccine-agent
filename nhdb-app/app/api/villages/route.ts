import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Village } from '@/types';

// GET /api/villages - Return list of all villages
export async function GET() {
  try {
    const db = await getDatabase();
    const villages = await db
      .collection<Village>('villages')
      .find({})
      .sort({ villageId: 1 })
      .toArray();

    return NextResponse.json({ villages });
  } catch (error) {
    console.error('Error fetching villages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch villages' },
      { status: 500 }
    );
  }
}
