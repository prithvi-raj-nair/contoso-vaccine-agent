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
    const day = current.getDay();
    if (day >= 1 && day <= 5) { // Monday to Friday
      weekdays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return getRandomItems(weekdays, Math.min(count, weekdays.length));
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
        today.setHours(0, 0, 0, 0);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Get random weekdays for each village
        const weekdays = getRandomWeekdays(twoWeeksAgo, new Date(today.getTime() - 86400000), 5);

        const events = selectedVillages.map((village, index) => {
          const eventDate = weekdays[index];
          const startTime = new Date(eventDate);
          startTime.setHours(9, 0, 0, 0);
          const endTime = new Date(eventDate);
          endTime.setHours(16, 0, 0, 0);

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
        today.setHours(0, 0, 0, 0);

        // Get the start of current week (Sunday)
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

        // Get the start of next week
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        // Helper to get ALL weekdays (Mon-Fri) in a week starting from a Sunday
        const getWeekdaysInWeek = (weekStart: Date): Date[] => {
          const weekdays: Date[] = [];
          for (let i = 1; i <= 5; i++) { // Monday (1) to Friday (5)
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
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

        // Add holiday events (all day)
        holidayDates.forEach(date => {
          const startTime = new Date(date);
          startTime.setHours(0, 0, 0, 0);
          const endTime = new Date(date);
          endTime.setHours(23, 59, 59, 999);

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

        // Other events with specific times
        const otherEvents = [
          { name: 'Health minister visit', startHour: 9, endHour: 17, description: 'Official visit from the Health Minister' },
          { name: 'Wellness seminar', startHour: 10, endHour: 14, description: 'Staff wellness and health awareness seminar' },
          { name: 'School health visit', startHour: 10, endHour: 16, description: 'Health checkup at local government school' },
        ];

        otherEventDates.forEach((date, index) => {
          if (index < otherEvents.length) {
            const eventInfo = otherEvents[index];
            const startTime = new Date(date);
            startTime.setHours(eventInfo.startHour, 0, 0, 0);
            const endTime = new Date(date);
            endTime.setHours(eventInfo.endHour, 0, 0, 0);

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
