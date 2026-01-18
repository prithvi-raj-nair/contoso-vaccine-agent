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

function generateGovtId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
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

async function seed() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI!);
  await client.connect();

  const db = client.db('nhdb');
  console.log('Connected to nhdb database');

  // Clear existing data
  console.log('Clearing existing data...');
  await db.collection('villages').deleteMany({});
  await db.collection('parents').deleteMany({});
  await db.collection('children').deleteMany({});
  await db.collection('vaccination_visits').deleteMany({});

  // Seed villages
  console.log('Seeding villages...');
  const villagesDocs = VILLAGES.map((v) => ({
    ...v,
    createdAt: new Date(),
  }));
  await db.collection('villages').insertMany(villagesDocs);
  console.log(`  Inserted ${villagesDocs.length} villages`);

  const now = new Date();
  const usedGovtIds = new Set<string>();

  // For each village, create parents and children
  for (const village of VILLAGES) {
    console.log(`\nSeeding data for ${village.name}...`);

    // Generate parents (100-150 per village)
    const numParents = randomInt(100, 150);
    const parents: {
      _id: ObjectId;
      govtId: string;
      name: string;
      dateOfBirth: Date;
      villageId: string;
      phoneNumber?: string;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    for (let i = 0; i < numParents; i++) {
      let govtId: string;
      do {
        govtId = generateGovtId();
      } while (usedGovtIds.has(govtId));
      usedGovtIds.add(govtId);

      const name = `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
      const dateOfBirth = randomDate(
        new Date(now.getFullYear() - 45, 0, 1),
        new Date(now.getFullYear() - 20, 0, 1)
      );

      parents.push({
        _id: new ObjectId(),
        govtId,
        name,
        dateOfBirth,
        villageId: village.villageId,
        phoneNumber: generatePhoneNumber(),
        createdAt: now,
        updatedAt: now,
      });
    }

    await db.collection('parents').insertMany(parents);
    console.log(`  Inserted ${parents.length} parents`);

    // Generate children (~100 per village)
    const numChildren = randomInt(90, 110);
    const children: {
      _id: ObjectId;
      name: string;
      dateOfBirth: Date;
      parentId: ObjectId;
      villageId: string;
      govtId?: string;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    // Distribute children ages: 0-16 weeks
    for (let i = 0; i < numChildren; i++) {
      const parent = randomElement(parents);
      const name = `${randomElement(FIRST_NAMES)} ${parent.name.split(' ')[1]}`;

      // Age in days: 0-112 days (16 weeks)
      const ageInDays = randomInt(0, 112);
      const dateOfBirth = addDays(now, -ageInDays);

      // 30% chance of having a birth certificate number
      const govtId = Math.random() < 0.3 ? `BC${generateGovtId()}` : undefined;

      children.push({
        _id: new ObjectId(),
        name,
        dateOfBirth,
        parentId: parent._id,
        villageId: village.villageId,
        govtId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db.collection('children').insertMany(children);
    console.log(`  Inserted ${children.length} children`);

    // Generate vaccination records based on child age
    const vaccinations: {
      childId: ObjectId;
      visitDate: Date;
      vaccineGiven: string;
      notes?: string;
      createdAt: Date;
    }[] = [];

    for (const child of children) {
      const ageInDays = Math.floor(
        (now.getTime() - child.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Vaccine A: Due 0-7 days
      // Determine if child should have Vaccine A
      if (ageInDays >= 0) {
        // Various scenarios for Vaccine A
        const scenario = Math.random();

        if (ageInDays <= 7) {
          // Child is in Vaccine A window
          if (scenario < 0.6) {
            // 60% got vaccine A
            const visitDate = addDays(child.dateOfBirth, randomInt(0, Math.min(7, ageInDays)));
            vaccinations.push({
              childId: child._id,
              visitDate,
              vaccineGiven: 'A',
              createdAt: visitDate,
            });
          } else if (scenario < 0.7) {
            // 10% recorded as not available
            const visitDate = addDays(child.dateOfBirth, randomInt(0, Math.min(7, ageInDays)));
            vaccinations.push({
              childId: child._id,
              visitDate,
              vaccineGiven: 'not_available',
              notes: 'Vaccine stock unavailable',
              createdAt: visitDate,
            });
          }
          // 30% no record yet
        } else if (ageInDays > 7) {
          // Child is past Vaccine A window
          if (scenario < 0.85) {
            // 85% got vaccine A (some late)
            const visitDate = addDays(child.dateOfBirth, randomInt(0, 10));
            vaccinations.push({
              childId: child._id,
              visitDate,
              vaccineGiven: 'A',
              createdAt: visitDate,
            });
          }
          // 15% missed Vaccine A
        }
      }

      // Vaccine B: Due 42-56 days
      if (ageInDays >= 42) {
        const hasVaccineA = vaccinations.some(
          (v) => v.childId.equals(child._id) && v.vaccineGiven === 'A'
        );

        if (hasVaccineA) {
          const scenario = Math.random();

          if (ageInDays <= 56) {
            // Child is in Vaccine B window
            if (scenario < 0.5) {
              const visitDate = addDays(child.dateOfBirth, randomInt(42, Math.min(56, ageInDays)));
              vaccinations.push({
                childId: child._id,
                visitDate,
                vaccineGiven: 'B',
                createdAt: visitDate,
              });
            }
          } else if (ageInDays > 56) {
            // Child is past Vaccine B window
            if (scenario < 0.75) {
              const visitDate = addDays(child.dateOfBirth, randomInt(42, 60));
              vaccinations.push({
                childId: child._id,
                visitDate,
                vaccineGiven: 'B',
                createdAt: visitDate,
              });
            }
          }
        }
      }

      // Vaccine C: Due 84-98 days
      if (ageInDays >= 84) {
        const hasVaccineA = vaccinations.some(
          (v) => v.childId.equals(child._id) && v.vaccineGiven === 'A'
        );
        const hasVaccineB = vaccinations.some(
          (v) => v.childId.equals(child._id) && v.vaccineGiven === 'B'
        );

        if (hasVaccineA && hasVaccineB) {
          const scenario = Math.random();

          if (ageInDays <= 98) {
            // Child is in Vaccine C window
            if (scenario < 0.4) {
              const visitDate = addDays(child.dateOfBirth, randomInt(84, Math.min(98, ageInDays)));
              vaccinations.push({
                childId: child._id,
                visitDate,
                vaccineGiven: 'C',
                createdAt: visitDate,
              });
            }
          } else if (ageInDays > 98) {
            // Child is past Vaccine C window
            if (scenario < 0.65) {
              const visitDate = addDays(child.dateOfBirth, randomInt(84, 105));
              vaccinations.push({
                childId: child._id,
                visitDate,
                vaccineGiven: 'C',
                createdAt: visitDate,
              });
            }
          }
        }
      }
    }

    if (vaccinations.length > 0) {
      await db.collection('vaccination_visits').insertMany(vaccinations);
      console.log(`  Inserted ${vaccinations.length} vaccination records`);
    }
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

  await client.close();
  console.log('\nSeeding completed successfully!');
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
