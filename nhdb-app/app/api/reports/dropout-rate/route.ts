import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Village, VaccinationVisit } from '@/types';

// GET /api/reports/dropout-rate
// Calculate dropout rates over the last 6 months
export async function GET() {
  try {
    const db = await getDatabase();

    // Get all villages
    const villages = await db
      .collection<Village>('villages')
      .find({})
      .sort({ villageId: 1 })
      .toArray();

    // Get last 6 months
    const months: {
      month: string;
      villages: {
        villageId: string;
        villageName: string;
        childrenStarted: number;
        childrenCompleted: number;
        dropoutRate: number;
      }[];
    }[] = [];

    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStr = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1
      ).padStart(2, '0')}`;

      const villageStats: {
        villageId: string;
        villageName: string;
        childrenStarted: number;
        childrenCompleted: number;
        dropoutRate: number;
      }[] = [];

      for (const village of villages) {
        // Get children who got Vaccine A in or before this month
        // (first dose - started vaccination)
        const childrenWithVaccineA = await db
          .collection<VaccinationVisit>('vaccination_visits')
          .aggregate([
            {
              $match: {
                vaccineGiven: 'A',
                visitDate: { $lte: monthEnd },
              },
            },
            {
              $lookup: {
                from: 'children',
                localField: 'childId',
                foreignField: '_id',
                as: 'child',
              },
            },
            { $unwind: '$child' },
            { $match: { 'child.villageId': village.villageId } },
            { $group: { _id: '$childId' } },
          ])
          .toArray();

        // Get children who got Vaccine C in or before this month
        // (last dose - completed vaccination)
        const childrenWithVaccineC = await db
          .collection<VaccinationVisit>('vaccination_visits')
          .aggregate([
            {
              $match: {
                vaccineGiven: 'C',
                visitDate: { $lte: monthEnd },
              },
            },
            {
              $lookup: {
                from: 'children',
                localField: 'childId',
                foreignField: '_id',
                as: 'child',
              },
            },
            { $unwind: '$child' },
            { $match: { 'child.villageId': village.villageId } },
            { $group: { _id: '$childId' } },
          ])
          .toArray();

        const childrenStarted = childrenWithVaccineA.length;
        const childrenCompleted = childrenWithVaccineC.length;

        // Dropout Rate = (Started - Completed) / Started
        const dropoutRate =
          childrenStarted > 0
            ? Number(
                ((childrenStarted - childrenCompleted) / childrenStarted).toFixed(
                  4
                )
              )
            : 0;

        villageStats.push({
          villageId: village.villageId,
          villageName: village.name,
          childrenStarted,
          childrenCompleted,
          dropoutRate,
        });
      }

      months.push({
        month: monthStr,
        villages: villageStats,
      });
    }

    return NextResponse.json({ months });
  } catch (error) {
    console.error('Error calculating dropout rate:', error);
    return NextResponse.json(
      { error: 'Failed to calculate dropout rate' },
      { status: 500 }
    );
  }
}
