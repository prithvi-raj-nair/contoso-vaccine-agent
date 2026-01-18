import { VaccinationStatus, VaccinationVisit } from '@/types';

// Vaccine schedule constants (in days from DOB)
const VACCINE_SCHEDULE = {
  A: { start: 0, end: 7 },      // DOB to DOB + 7 days
  B: { start: 42, end: 56 },    // DOB + 42 to DOB + 56 days (6-8 weeks)
  C: { start: 84, end: 98 },    // DOB + 84 to DOB + 98 days (12-14 weeks)
};

// IST offset in milliseconds (5 hours 30 minutes)
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

/**
 * Convert a Date to IST midnight (start of day in IST)
 */
export function toISTDate(date: Date): Date {
  // Get UTC time
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  // Add IST offset
  const istTime = utcTime + IST_OFFSET;
  // Create new date and set to midnight
  const istDate = new Date(istTime);
  istDate.setHours(0, 0, 0, 0);
  return istDate;
}

/**
 * Get current date in IST
 */
export function getCurrentISTDate(): Date {
  return toISTDate(new Date());
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate vaccination status for a child based on their DOB and vaccination history
 */
export function calculateVaccinationStatus(
  childDOB: Date,
  vaccinations: VaccinationVisit[]
): VaccinationStatus {
  // Normalize DOB to IST midnight
  const dob = toISTDate(childDOB);
  const today = getCurrentISTDate();

  // Get list of vaccines already given (only actual vaccines, not "none_required" or "not_available")
  const vaccinesGiven = vaccinations
    .filter(v => ['A', 'B', 'C'].includes(v.vaccineGiven))
    .map(v => v.vaccineGiven);

  // Remove duplicates
  const uniqueVaccinesGiven = [...new Set(vaccinesGiven)];

  // Check which vaccine is due next
  const vaccineOrder: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  for (const vaccine of vaccineOrder) {
    if (!uniqueVaccinesGiven.includes(vaccine)) {
      // This vaccine is due next
      const schedule = VACCINE_SCHEDULE[vaccine];
      const windowStart = addDays(dob, schedule.start);
      const windowEnd = addDays(dob, schedule.end);

      let dueStatus: 'overdue' | 'due' | 'upcoming';

      if (today.getTime() > windowEnd.getTime()) {
        dueStatus = 'overdue';
      } else if (today.getTime() >= windowStart.getTime()) {
        dueStatus = 'due';
      } else {
        dueStatus = 'upcoming';
      }

      return {
        vaccinesGiven: uniqueVaccinesGiven,
        nextVaccineDue: vaccine,
        dueStatus,
        dueWindow: { start: windowStart, end: windowEnd },
      };
    }
  }

  // All vaccines given
  return {
    vaccinesGiven: uniqueVaccinesGiven,
    nextVaccineDue: null,
    dueStatus: 'complete',
  };
}

/**
 * Check if a vaccine is due for a child within a given date range
 * Returns the vaccine type if due, null otherwise
 */
export function getVaccineDueInRange(
  childDOB: Date,
  vaccinations: VaccinationVisit[],
  rangeStart: Date,
  rangeEnd: Date
): 'A' | 'B' | 'C' | null {
  const dob = toISTDate(childDOB);
  const start = toISTDate(rangeStart);
  const end = toISTDate(rangeEnd);

  // Get vaccines already given
  const vaccinesGiven = vaccinations
    .filter(v => ['A', 'B', 'C'].includes(v.vaccineGiven))
    .map(v => v.vaccineGiven);

  const uniqueVaccinesGiven = [...new Set(vaccinesGiven)];

  const vaccineOrder: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  for (const vaccine of vaccineOrder) {
    if (!uniqueVaccinesGiven.includes(vaccine)) {
      // Check if this vaccine's due window overlaps with the given range
      const schedule = VACCINE_SCHEDULE[vaccine];
      const windowStart = addDays(dob, schedule.start);
      const windowEnd = addDays(dob, schedule.end);

      // Check for overlap: vaccine window overlaps with query range
      // or vaccine is overdue and range is after the window
      const windowOverlaps = windowStart.getTime() <= end.getTime() &&
                            windowEnd.getTime() >= start.getTime();
      const isOverdueInRange = windowEnd.getTime() < start.getTime();

      if (windowOverlaps || isOverdueInRange) {
        return vaccine;
      }

      // If this vaccine is upcoming (window starts after range), no vaccine is due in range
      if (windowStart.getTime() > end.getTime()) {
        return null;
      }
    }
  }

  return null;
}

/**
 * Format a date for display (IST)
 */
export function formatDateIST(date: Date): string {
  const istDate = toISTDate(date);
  return istDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const d = toISTDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
