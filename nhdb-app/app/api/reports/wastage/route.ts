import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Child, VaccinationVisit } from '@/types';
import { ObjectId } from 'mongodb';

// Vaccination schedule (days from DOB)
const VACCINE_SCHEDULE = {
  A: { start: 0, end: 7 },
  B: { start: 42, end: 56 },
  C: { start: 84, end: 98 },
};

// GET /api/reports/wastage
// Calculate vaccine wastage over last 3 months
// Wastage = vaccines that were due but not administered
export async function GET() {
  try {
    const db = await getDatabase();

    const months: {
      month: string;
      wastage: {
        A: { expected: number; actual: number; wasted: number; rate: number };
        B: { expected: number; actual: number; wasted: number; rate: number };
        C: { expected: number; actual: number; wasted: number; rate: number };
      };
    }[] = [];

    const now = new Date();

    // Last 3 months only
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthStr = `${monthStart.getFullYear()}-${String(
        monthStart.getMonth() + 1
      ).padStart(2, '0')}`;

      // For each vaccine, calculate:
      // Expected: children whose vaccine window falls within this month
      // Actual: vaccines actually given this month

      const wastageData: {
        A: { expected: number; actual: number; wasted: number; rate: number };
        B: { expected: number; actual: number; wasted: number; rate: number };
        C: { expected: number; actual: number; wasted: number; rate: number };
      } = {
        A: { expected: 0, actual: 0, wasted: 0, rate: 0 },
        B: { expected: 0, actual: 0, wasted: 0, rate: 0 },
        C: { expected: 0, actual: 0, wasted: 0, rate: 0 },
      };

      // Get all children
      const children = await db
        .collection<Child>('children')
        .find({})
        .toArray();

      // Get all vaccination visits up to end of this month
      const allVaccinations = await db
        .collection<VaccinationVisit>('vaccination_visits')
        .find({
          visitDate: { $lte: monthEnd },
          vaccineGiven: { $in: ['A', 'B', 'C'] },
        })
        .toArray();

      // Create a map of childId -> vaccines received before this month
      const vaccinesBeforeMonth: Map<string, Set<string>> = new Map();
      const vaccinesInMonth: Map<string, Set<string>> = new Map();

      allVaccinations.forEach((v) => {
        const childIdStr = v.childId.toString();
        const visitDate = new Date(v.visitDate);

        if (visitDate < monthStart) {
          if (!vaccinesBeforeMonth.has(childIdStr)) {
            vaccinesBeforeMonth.set(childIdStr, new Set());
          }
          vaccinesBeforeMonth.get(childIdStr)!.add(v.vaccineGiven);
        } else if (visitDate <= monthEnd) {
          if (!vaccinesInMonth.has(childIdStr)) {
            vaccinesInMonth.set(childIdStr, new Set());
          }
          vaccinesInMonth.get(childIdStr)!.add(v.vaccineGiven);
        }
      });

      // For each child, check if each vaccine was due this month
      for (const child of children) {
        const dob = new Date(child.dateOfBirth);
        const childIdStr = (child._id as ObjectId).toString();
        const vaccinesBefore = vaccinesBeforeMonth.get(childIdStr) || new Set();
        const vaccinesThis = vaccinesInMonth.get(childIdStr) || new Set();

        for (const [vaccine, schedule] of Object.entries(VACCINE_SCHEDULE)) {
          // Calculate the due window for this vaccine
          const dueStart = new Date(dob);
          dueStart.setDate(dueStart.getDate() + schedule.start);
          const dueEnd = new Date(dob);
          dueEnd.setDate(dueEnd.getDate() + schedule.end);

          // Check if the due window overlaps with this month
          const windowOverlapsMonth =
            dueStart <= monthEnd && dueEnd >= monthStart;

          if (windowOverlapsMonth) {
            // Check if child already had this vaccine before this month
            const alreadyHadVaccine = vaccinesBefore.has(vaccine);

            if (!alreadyHadVaccine) {
              // This vaccine was expected/due this month
              wastageData[vaccine as 'A' | 'B' | 'C'].expected++;

              // Check if they got it this month
              if (vaccinesThis.has(vaccine)) {
                wastageData[vaccine as 'A' | 'B' | 'C'].actual++;
              }
            }
          }
        }
      }

      // Calculate wasted and rate
      for (const vaccine of ['A', 'B', 'C'] as const) {
        const data = wastageData[vaccine];
        data.wasted = data.expected - data.actual;
        data.rate =
          data.expected > 0
            ? Number((data.wasted / data.expected).toFixed(4))
            : 0;
      }

      months.push({
        month: monthStr,
        wastage: wastageData,
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
