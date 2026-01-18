import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Village, VaccinationVisit, Child } from '@/types';

// GET /api/reports/dropout-rate
// Calculate dropout rates over the last 3 months
export async function GET() {
  try {
    const db = await getDatabase();

    // Get all villages
    const villages = await db
      .collection<Village>('villages')
      .find({})
      .sort({ villageId: 1 })
      .toArray();

    const villageMap = new Map(villages.map(v => [v.villageId, v.name]));

    const now = new Date();

    // Calculate date boundaries for all 3 months
    const monthBoundaries: { monthStr: string; monthEnd: Date }[] = [];
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      const monthStr = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1
      ).padStart(2, '0')}`;
      monthBoundaries.push({ monthStr, monthEnd });
    }

    // Get the latest month end (covers all 3 months)
    const latestMonthEnd = monthBoundaries[monthBoundaries.length - 1].monthEnd;

    // Batch fetch: all children
    const allChildren = await db
      .collection<Child>('children')
      .find({})
      .toArray();

    // Create childId -> villageId map
    const childVillageMap = new Map<string, string>();
    for (const child of allChildren) {
      childVillageMap.set(child._id.toString(), child.villageId);
    }

    // Batch fetch: all vaccinations for A and C up to latest month
    const allVaccinations = await db
      .collection<VaccinationVisit>('vaccination_visits')
      .find({
        vaccineGiven: { $in: ['A', 'C'] },
        visitDate: { $lte: latestMonthEnd },
      })
      .toArray();

    // Group vaccinations by childId and vaccine type with their dates
    const vaccinationData = new Map<string, { A?: Date; C?: Date }>();
    for (const v of allVaccinations) {
      const childIdStr = v.childId.toString();
      if (!vaccinationData.has(childIdStr)) {
        vaccinationData.set(childIdStr, {});
      }
      const data = vaccinationData.get(childIdStr)!;
      const visitDate = new Date(v.visitDate);
      if (v.vaccineGiven === 'A' && (!data.A || visitDate < data.A)) {
        data.A = visitDate;
      }
      if (v.vaccineGiven === 'C' && (!data.C || visitDate < data.C)) {
        data.C = visitDate;
      }
    }

    // Calculate stats for each month
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

    for (const { monthStr, monthEnd } of monthBoundaries) {
      // Count per village for this month
      const villageStats = new Map<string, { started: number; completed: number }>();
      for (const v of villages) {
        villageStats.set(v.villageId, { started: 0, completed: 0 });
      }

      // Process each child's vaccination data
      for (const [childIdStr, data] of vaccinationData) {
        const villageId = childVillageMap.get(childIdStr);
        if (!villageId || !villageStats.has(villageId)) continue;

        const stats = villageStats.get(villageId)!;

        // Check if vaccine A was given by this month end
        if (data.A && data.A <= monthEnd) {
          stats.started++;
        }
        // Check if vaccine C was given by this month end
        if (data.C && data.C <= monthEnd) {
          stats.completed++;
        }
      }

      // Build result for this month
      const villageResults: {
        villageId: string;
        villageName: string;
        childrenStarted: number;
        childrenCompleted: number;
        dropoutRate: number;
      }[] = [];

      for (const village of villages) {
        const stats = villageStats.get(village.villageId)!;
        const dropoutRate =
          stats.started > 0
            ? Number(((stats.started - stats.completed) / stats.started).toFixed(4))
            : 0;

        villageResults.push({
          villageId: village.villageId,
          villageName: village.name,
          childrenStarted: stats.started,
          childrenCompleted: stats.completed,
          dropoutRate,
        });
      }

      months.push({
        month: monthStr,
        villages: villageResults,
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
