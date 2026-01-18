import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI environment variable');
  process.exit(1);
}

// Villages data
const VILLAGES = [
  { villageId: 'V001', name: 'Rampur' },
  { villageId: 'V002', name: 'Shivgaon' },
  { villageId: 'V003', name: 'Lakshminagar' },
  { villageId: 'V004', name: 'Chandpur' },
  { villageId: 'V005', name: 'Govindpur' },
  { villageId: 'V006', name: 'Surajkund' },
  { villageId: 'V007', name: 'Motinagar' },
];

// Indian first names
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Akash', 'Ananya', 'Arjun', 'Diya', 'Ishaan',
  'Kavya', 'Krishna', 'Lakshmi', 'Maya', 'Neha', 'Priya', 'Rahul', 'Riya',
  'Rohan', 'Sakshi', 'Sanjay', 'Shreya', 'Tanvi', 'Varun', 'Vihaan', 'Yash',
  'Amit', 'Anjali', 'Deepak', 'Divya', 'Gaurav', 'Harini', 'Karan', 'Meera',
  'Nisha', 'Pooja', 'Rajesh', 'Rekha', 'Sunita', 'Suresh', 'Uma', 'Vijay',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Verma', 'Gupta', 'Reddy', 'Rao',
  'Nair', 'Menon', 'Das', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Iyer',
  'Pillai', 'Choudhury', 'Joshi', 'Mehta', 'Agarwal', 'Mishra', 'Pandey',
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateGovtId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function randomDateInMonth(year: number, month: number, maxDay?: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const actualMaxDay = maxDay ? Math.min(maxDay, daysInMonth) : daysInMonth;
  const day = randomInt(1, actualMaxDay);
  return new Date(year, month, day, randomInt(0, 23), randomInt(0, 59));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generatePhoneNumber(): string | undefined {
  // 70% chance of having a phone number
  if (Math.random() > 0.7) return undefined;
  return `9${randomInt(100000000, 999999999)}`;
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Vaccination schedule (days from DOB)
const VACCINE_SCHEDULE = {
  A: { start: 0, end: 7 },
  B: { start: 42, end: 56 },
  C: { start: 84, end: 98 },
};

async function seed() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI!);
  await client.connect();

  const db = client.db('nhdb');
  console.log('Connected to nhdb database');

  // Clear existing data EXCEPT villages
  console.log('Clearing existing data (keeping villages)...');
  await db.collection('parents').deleteMany({});
  await db.collection('children').deleteMany({});
  await db.collection('vaccination_visits').deleteMany({});

  // Check if villages exist, if not seed them
  const existingVillages = await db.collection('villages').countDocuments();
  if (existingVillages === 0) {
    console.log('Seeding villages...');
    const villagesDocs = VILLAGES.map((v) => ({
      ...v,
      createdAt: new Date(),
    }));
    await db.collection('villages').insertMany(villagesDocs);
    console.log(`  Inserted ${villagesDocs.length} villages`);
  } else {
    console.log(`  Villages already exist (${existingVillages} villages)`);
  }

  // Current date (mid-January 2026)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  console.log(`\nCurrent date: ${now.toISOString().split('T')[0]}`);

  // Generate months for data: last 6 months + current month
  const months: { year: number; month: number; births: number }[] = [];

  // Last 6 months (100 births each)
  for (let i = 6; i >= 1; i--) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    if (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    months.push({ year: targetYear, month: targetMonth, births: 100 });
  }

  // Current month (50 births, since mid-month)
  months.push({ year: currentYear, month: currentMonth, births: 50 });

  console.log('\nBirth distribution plan:');
  months.forEach((m) => {
    const monthName = new Date(m.year, m.month, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    console.log(`  ${monthName}: ${m.births} births per village`);
  });

  const usedGovtIds = new Set<string>();
  let totalParents = 0;
  let totalChildren = 0;
  let totalVaccinations = 0;

  // For each village, create parents and children
  for (const village of VILLAGES) {
    console.log(`\n=== Seeding data for ${village.name} ===`);

    // Generate village-specific vaccination probabilities
    const vaccineAProbability = randomFloat(0.6, 0.7); // 60-70%
    const vaccineBProbability = randomFloat(0.7, 0.8); // 70-80% of A recipients
    const vaccineCProbability = randomFloat(0.8, 0.9); // 80-90% of B recipients

    console.log(`  Vaccination probabilities for ${village.name}:`);
    console.log(`    Vaccine A: ${(vaccineAProbability * 100).toFixed(1)}%`);
    console.log(`    Vaccine B (of A): ${(vaccineBProbability * 100).toFixed(1)}%`);
    console.log(`    Vaccine C (of B): ${(vaccineCProbability * 100).toFixed(1)}%`);

    const villageParents: {
      _id: ObjectId;
      govtId: string;
      name: string;
      dateOfBirth: Date;
      villageId: string;
      phoneNumber?: string;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    const villageChildren: {
      _id: ObjectId;
      name: string;
      dateOfBirth: Date;
      parentId: ObjectId;
      villageId: string;
      govtId?: string;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    const villageVaccinations: {
      childId: ObjectId;
      visitDate: Date;
      vaccineGiven: string;
      notes?: string;
      createdAt: Date;
    }[] = [];

    // Process each month
    for (const monthData of months) {
      const { year, month, births } = monthData;
      const maxDay = year === currentYear && month === currentMonth ? currentDay : undefined;

      for (let i = 0; i < births; i++) {
        // Create parent (one parent per child)
        let govtId: string;
        do {
          govtId = generateGovtId();
        } while (usedGovtIds.has(govtId));
        usedGovtIds.add(govtId);

        const lastName = randomElement(LAST_NAMES);
        const parentName = `${randomElement(FIRST_NAMES)} ${lastName}`;
        const parentDob = new Date(
          randomInt(now.getFullYear() - 45, now.getFullYear() - 20),
          randomInt(0, 11),
          randomInt(1, 28)
        );

        const parentId = new ObjectId();
        villageParents.push({
          _id: parentId,
          govtId,
          name: parentName,
          dateOfBirth: parentDob,
          villageId: village.villageId,
          phoneNumber: generatePhoneNumber(),
          createdAt: now,
          updatedAt: now,
        });

        // Create child with DOB in this month
        const childDob = randomDateInMonth(year, month, maxDay);
        const childName = `${randomElement(FIRST_NAMES)} ${lastName}`;
        const childGovtId = Math.random() < 0.3 ? `BC${generateGovtId()}` : undefined;

        const childId = new ObjectId();
        villageChildren.push({
          _id: childId,
          name: childName,
          dateOfBirth: childDob,
          parentId: parentId,
          villageId: village.villageId,
          govtId: childGovtId,
          createdAt: now,
          updatedAt: now,
        });

        // Calculate child's age in days
        const ageInDays = daysBetween(childDob, now);

        // Determine vaccination status based on probabilities and due dates
        let hasVaccineA = false;
        let hasVaccineB = false;

        // Vaccine A: Due 0-7 days from birth
        if (ageInDays >= VACCINE_SCHEDULE.A.end) {
          // Vaccine A window has passed, should have been given
          if (Math.random() < vaccineAProbability) {
            hasVaccineA = true;
            // Give vaccine within the window
            const visitDay = randomInt(VACCINE_SCHEDULE.A.start, VACCINE_SCHEDULE.A.end);
            const visitDate = addDays(childDob, visitDay);
            villageVaccinations.push({
              childId: childId,
              visitDate: visitDate,
              vaccineGiven: 'A',
              createdAt: visitDate,
            });
          }
        } else if (ageInDays >= VACCINE_SCHEDULE.A.start) {
          // Child is currently in Vaccine A window
          // Some may have gotten it, some may not yet
          if (Math.random() < vaccineAProbability * 0.7) {
            hasVaccineA = true;
            const visitDay = randomInt(VACCINE_SCHEDULE.A.start, Math.min(ageInDays, VACCINE_SCHEDULE.A.end));
            const visitDate = addDays(childDob, visitDay);
            villageVaccinations.push({
              childId: childId,
              visitDate: visitDate,
              vaccineGiven: 'A',
              createdAt: visitDate,
            });
          }
        }
        // Children younger than 0 days don't exist, so no else needed

        // Vaccine B: Due 42-56 days (6-8 weeks) from birth
        if (hasVaccineA && ageInDays >= VACCINE_SCHEDULE.B.end) {
          // Vaccine B window has passed
          if (Math.random() < vaccineBProbability) {
            hasVaccineB = true;
            const visitDay = randomInt(VACCINE_SCHEDULE.B.start, VACCINE_SCHEDULE.B.end);
            const visitDate = addDays(childDob, visitDay);
            villageVaccinations.push({
              childId: childId,
              visitDate: visitDate,
              vaccineGiven: 'B',
              createdAt: visitDate,
            });
          }
        } else if (hasVaccineA && ageInDays >= VACCINE_SCHEDULE.B.start) {
          // Child is currently in Vaccine B window
          if (Math.random() < vaccineBProbability * 0.6) {
            hasVaccineB = true;
            const visitDay = randomInt(VACCINE_SCHEDULE.B.start, Math.min(ageInDays, VACCINE_SCHEDULE.B.end));
            const visitDate = addDays(childDob, visitDay);
            villageVaccinations.push({
              childId: childId,
              visitDate: visitDate,
              vaccineGiven: 'B',
              createdAt: visitDate,
            });
          }
        }

        // Vaccine C: Due 84-98 days (12-14 weeks) from birth
        if (hasVaccineB && ageInDays >= VACCINE_SCHEDULE.C.end) {
          // Vaccine C window has passed
          if (Math.random() < vaccineCProbability) {
            const visitDay = randomInt(VACCINE_SCHEDULE.C.start, VACCINE_SCHEDULE.C.end);
            const visitDate = addDays(childDob, visitDay);
            villageVaccinations.push({
              childId: childId,
              visitDate: visitDate,
              vaccineGiven: 'C',
              createdAt: visitDate,
            });
          }
        } else if (hasVaccineB && ageInDays >= VACCINE_SCHEDULE.C.start) {
          // Child is currently in Vaccine C window
          if (Math.random() < vaccineCProbability * 0.5) {
            const visitDay = randomInt(VACCINE_SCHEDULE.C.start, Math.min(ageInDays, VACCINE_SCHEDULE.C.end));
            const visitDate = addDays(childDob, visitDay);
            villageVaccinations.push({
              childId: childId,
              visitDate: visitDate,
              vaccineGiven: 'C',
              createdAt: visitDate,
            });
          }
        }
      }
    }

    // Insert all data for this village
    if (villageParents.length > 0) {
      await db.collection('parents').insertMany(villageParents);
    }
    if (villageChildren.length > 0) {
      await db.collection('children').insertMany(villageChildren);
    }
    if (villageVaccinations.length > 0) {
      await db.collection('vaccination_visits').insertMany(villageVaccinations);
    }

    console.log(`  Inserted ${villageParents.length} parents`);
    console.log(`  Inserted ${villageChildren.length} children`);
    console.log(`  Inserted ${villageVaccinations.length} vaccination records`);

    totalParents += villageParents.length;
    totalChildren += villageChildren.length;
    totalVaccinations += villageVaccinations.length;
  }

  // Print summary
  console.log('\n=== Seed Summary ===');
  const villageCount = await db.collection('villages').countDocuments();
  const parentCount = await db.collection('parents').countDocuments();
  const childCount = await db.collection('children').countDocuments();
  const vaccinationCount = await db.collection('vaccination_visits').countDocuments();

  console.log(`Villages: ${villageCount}`);
  console.log(`Parents: ${parentCount}`);
  console.log(`Children: ${childCount}`);
  console.log(`Vaccination records: ${vaccinationCount}`);

  // Verify one-to-one parent-child relationship
  const childrenPerParent = await db.collection('children').aggregate([
    { $group: { _id: '$parentId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  if (childrenPerParent.length > 0) {
    console.log(`\nWarning: ${childrenPerParent.length} parents have more than one child!`);
  } else {
    console.log('\nVerified: Each parent has exactly one child');
  }

  await client.close();
  console.log('\nSeeding completed successfully!');
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
