import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Child, VaccinationVisit, Village } from '@/types';
import { getVaccineDueInRange } from '@/lib/vaccination-logic';

// GET /api/reports/vaccine-demand?villageId=V001&startDate=2025-01-13&endDate=2025-01-19
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const villageId = searchParams.get('villageId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!villageId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: villageId, startDate, endDate' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get village info
    const village = await db.collection<Village>('villages').findOne({
      villageId,
    });

    if (!village) {
      return NextResponse.json(
        { error: 'Village not found' },
        { status: 404 }
      );
    }

    // Get all children in the village
    const children = await db
      .collection<Child>('children')
      .find({ villageId })
      .toArray();

    const demand = { A: 0, B: 0, C: 0 };
    let childrenNeedingVaccines = 0;

    // For each child, check if they need a vaccine in the date range
    for (const child of children) {
      // Get vaccination history for this child
      const vaccinations = await db
        .collection<VaccinationVisit>('vaccination_visits')
        .find({ childId: child._id })
        .toArray();

      const vaccineDue = getVaccineDueInRange(
        child.dateOfBirth,
        vaccinations,
        startDate,
        endDate
      );

      if (vaccineDue) {
        demand[vaccineDue]++;
        childrenNeedingVaccines++;
      }
    }

    return NextResponse.json({
      villageId,
      villageName: village.name,
      startDate: startDateStr,
      endDate: endDateStr,
      demand,
      totalChildren: children.length,
      childrenNeedingVaccines,
    });
  } catch (error) {
    console.error('Error calculating vaccine demand:', error);
    return NextResponse.json(
      { error: 'Failed to calculate vaccine demand' },
      { status: 500 }
    );
  }
}
