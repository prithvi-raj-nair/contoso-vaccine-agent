import { NextRequest, NextResponse } from 'next/server';
import getClientPromise from '@/lib/mongodb';
import { CalendarEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DB_NAME = 'simplecal';
const COLLECTION_NAME = 'events';

// List of 7 villages (matching NHDB database)
const VILLAGES = [
  'Rampur',
  'Shivgaon',
  'Lakshminagar',
  'Chandpur',
  'Govindpur',
  'Surajkund',
  'Motinagar',
];

// Helper to get random items from array
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper to get random weekdays in a date range
function getRandomWeekdays(startDate: Date, endDate: Date, count: number): Date[] {
  const weekdays: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getUTCDay();
    if (day >= 1 && day <= 5) { // Monday to Friday
      weekdays.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return getRandomItems(weekdays, Math.min(count, weekdays.length));
}

// Helper to set time in IST (UTC+5:30) - converts IST hours to UTC
// IST is 5 hours 30 minutes ahead of UTC
function setTimeIST(date: Date, hours: number, minutes: number = 0): Date {
  const result = new Date(date);
  // Convert IST to UTC: subtract 5 hours 30 minutes
  let utcHours = hours - 5;
  let utcMinutes = minutes - 30;

  if (utcMinutes < 0) {
    utcMinutes += 60;
    utcHours -= 1;
  }
  if (utcHours < 0) {
    utcHours += 24;
    result.setUTCDate(result.getUTCDate() - 1);
  }

  result.setUTCHours(utcHours, utcMinutes, 0, 0);
  return result;
}

// POST /api/demo - Execute demo actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const collection = db.collection<CalendarEvent>(COLLECTION_NAME);

    switch (action) {
      case 'deleteAll': {
        await collection.deleteMany({});
        return NextResponse.json({ message: 'All events deleted', count: 0 });
      }

      case 'createPastOutreach': {
        // Select 5 random villages
        const selectedVillages = getRandomItems(VILLAGES, 5);

        // Get date range for last 2 weeks
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setUTCDate(twoWeeksAgo.getUTCDate() - 14);

        // Get random weekdays for each village
        const weekdays = getRandomWeekdays(twoWeeksAgo, new Date(today.getTime() - 86400000), 5);

        const events = selectedVillages.map((village, index) => {
          const eventDate = weekdays[index];
          // Outreach events: 9:00 AM to 5:00 PM IST
          const startTime = setTimeIST(eventDate, 9, 0);
          const endTime = setTimeIST(eventDate, 17, 0);

          return {
            name: `Vaccine Outreach - ${village}`,
            description: `Vaccination drive at ${village} village. Vaccines administered: DPT, Polio, BCG.`,
            startTime,
            endTime,
            isAllDay: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        await collection.insertMany(events as CalendarEvent[]);
        return NextResponse.json({
          message: 'Past outreach events created',
          count: events.length
        });
      }

      case 'createNextTwoWeeks': {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Get the start of current week (Sunday)
        const currentWeekStart = new Date(today);
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - currentWeekStart.getUTCDay());

        // Get the start of next week
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);

        // Helper to get ALL weekdays (Mon-Fri) in a week starting from a Sunday
        const getWeekdaysInWeek = (weekStart: Date): Date[] => {
          const weekdays: Date[] = [];
          for (let i = 1; i <= 5; i++) { // Monday (1) to Friday (5)
            const day = new Date(weekStart);
            day.setUTCDate(day.getUTCDate() + i);
            weekdays.push(day);
          }
          return weekdays;
        };

        // Get all weekdays from current week and next week
        const currentWeekDays = getWeekdaysInWeek(currentWeekStart);
        const nextWeekDays = getWeekdaysInWeek(nextWeekStart);

        // Pick one random holiday from each week (guaranteed one per week)
        const holidayDates: Date[] = [];
        const currentWeekHoliday = getRandomItems(currentWeekDays, 1)[0];
        const nextWeekHoliday = getRandomItems(nextWeekDays, 1)[0];
        holidayDates.push(currentWeekHoliday, nextWeekHoliday);

        // Get all weekdays excluding holidays for other events
        const allWeekdays = [...currentWeekDays, ...nextWeekDays];
        const remainingWeekdays = allWeekdays.filter(
          d => !holidayDates.some(h => h.getTime() === d.getTime())
        );
        const otherEventDates = getRandomItems(remainingWeekdays, 3);

        const events: Partial<CalendarEvent>[] = [];

        // Add holiday events (all day) - use IST midnight to end of day
        holidayDates.forEach(date => {
          const startTime = setTimeIST(date, 0, 0);
          const endTime = setTimeIST(date, 23, 59);

          events.push({
            name: 'Holiday',
            description: 'Public holiday - office closed',
            startTime,
            endTime,
            isAllDay: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });

        // Other events with specific times (in IST)
        const otherEvents = [
          { name: 'Health minister visit', startHour: 9, endHour: 17, description: 'Official visit from the Health Minister' },
          { name: 'Wellness seminar', startHour: 10, endHour: 14, description: 'Staff wellness and health awareness seminar' },
          { name: 'School health visit', startHour: 10, endHour: 16, description: 'Health checkup at local government school' },
        ];

        otherEventDates.forEach((date, index) => {
          if (index < otherEvents.length) {
            const eventInfo = otherEvents[index];
            // Use IST times
            const startTime = setTimeIST(date, eventInfo.startHour, 0);
            const endTime = setTimeIST(date, eventInfo.endHour, 0);

            events.push({
              name: eventInfo.name,
              description: eventInfo.description,
              startTime,
              endTime,
              isAllDay: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });

        if (events.length > 0) {
          await collection.insertMany(events as CalendarEvent[]);
        }

        return NextResponse.json({
          message: 'Next two weeks events created',
          count: events.length,
          holidays: holidayDates.length,
          otherEvents: otherEventDates.length
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error executing demo action:', error);
    return NextResponse.json(
      { error: 'Failed to execute demo action' },
      { status: 500 }
    );
  }
}
