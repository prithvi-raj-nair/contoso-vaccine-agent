import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { VaccinationVisit } from '@/types';

// GET /api/reports/wastage
// Calculate vaccine wastage over last 6 months
export async function GET() {
  try {
    const db = await getDatabase();

    // Get last 6 months
    const months: {
      month: string;
      wastage: {
        A: { expected: number; actual: number; wasted: number; rate: number };
        B: { expected: number; actual: number; wasted: number; rate: number };
        C: { expected: number; actual: number; wasted: number; rate: number };
      };
    }[] = [];

    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStr = `${monthStart.getFullYear()}-${String(
        monthStart.getMonth() + 1
      ).padStart(2, '0')}`;

      // Count actual vaccinations given in this month
      const actualVaccinations = await db
        .collection<VaccinationVisit>('vaccination_visits')
        .aggregate([
          {
            $match: {
              visitDate: { $gte: monthStart, $lte: monthEnd },
              vaccineGiven: { $in: ['A', 'B', 'C'] },
            },
          },
          {
            $group: {
              _id: '$vaccineGiven',
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      // Count visits where vaccine was not available (potential wastage scenario)
      const notAvailableVisits = await db
        .collection<VaccinationVisit>('vaccination_visits')
        .aggregate([
          {
            $match: {
              visitDate: { $gte: monthStart, $lte: monthEnd },
              vaccineGiven: 'not_available',
            },
          },
          {
            $count: 'count',
          },
        ])
        .toArray();

      const notAvailableCount = notAvailableVisits[0]?.count || 0;

      // Convert to map for easier access
      const actualMap: Record<string, number> = {};
      actualVaccinations.forEach((v) => {
        actualMap[v._id as string] = v.count;
      });

      const actualA = actualMap['A'] || 0;
      const actualB = actualMap['B'] || 0;
      const actualC = actualMap['C'] || 0;

      // Expected = actual + estimated wasted (based on not_available visits)
      // Distribute not_available counts proportionally among vaccines
      const totalActual = actualA + actualB + actualC;
      const wastedA =
        totalActual > 0
          ? Math.round((notAvailableCount * actualA) / totalActual)
          : Math.round(notAvailableCount / 3);
      const wastedB =
        totalActual > 0
          ? Math.round((notAvailableCount * actualB) / totalActual)
          : Math.round(notAvailableCount / 3);
      const wastedC =
        totalActual > 0
          ? notAvailableCount - wastedA - wastedB
          : notAvailableCount - wastedA - wastedB;

      const expectedA = actualA + wastedA;
      const expectedB = actualB + wastedB;
      const expectedC = actualC + wastedC;

      const rateA = expectedA > 0 ? Number((wastedA / expectedA).toFixed(4)) : 0;
      const rateB = expectedB > 0 ? Number((wastedB / expectedB).toFixed(4)) : 0;
      const rateC = expectedC > 0 ? Number((wastedC / expectedC).toFixed(4)) : 0;

      months.push({
        month: monthStr,
        wastage: {
          A: { expected: expectedA, actual: actualA, wasted: wastedA, rate: rateA },
          B: { expected: expectedB, actual: actualB, wasted: wastedB, rate: rateB },
          C: { expected: expectedC, actual: actualC, wasted: wastedC, rate: rateC },
        },
      });
    }

    return NextResponse.json({ months });
  } catch (error) {
    console.error('Error calculating wastage:', error);
    return NextResponse.json(
      { error: 'Failed to calculate wastage' },
      { status: 500 }
    );
  }
}
