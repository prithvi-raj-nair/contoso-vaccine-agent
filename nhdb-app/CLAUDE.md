# NHDB App

National Health Database for patient records and vaccination tracking.

## Database (MongoDB: `nhdb`)

| Collection | Purpose |
|------------|---------|
| `villages` | 7 villages (V001-V007) |
| `parents` | Parent records with govtId, name, DOB, villageId |
| `children` | Child records linked to parent via parentId |
| `vaccination_visits` | Vaccination records with vaccineGiven: A, B, C, none_required, not_available |

## Vaccination Schedule (from DOB)

| Vaccine | Due Window |
|---------|------------|
| A | 0-7 days |
| B | 42-56 days (6-8 weeks) |
| C | 84-98 days (12-14 weeks) |

All date calculations use IST (UTC+5:30). See `lib/vaccination-logic.ts`.

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/villages` | List all villages |
| `POST /api/parents` | Create parent |
| `GET /api/parents?govtId=XXX` | Search parent by govt ID (returns children with vaccination status) |
| `POST /api/children` | Create child |
| `GET /api/children/[id]` | Get child with vaccination status |
| `POST /api/vaccinations` | Record vaccination visit |
| `GET /api/reports/vaccine-demand?villageId=V001&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Vaccine demand for village |
| `GET /api/reports/dropout-rate` | 6-month dropout rates by village |
| `GET /api/reports/wastage` | 6-month wastage stats by vaccine |

## Key Files

- `lib/mongodb.ts` - Database connection with pooling
- `lib/vaccination-logic.ts` - Status calculation and due window logic
- `types/index.ts` - TypeScript interfaces
- `scripts/seed.ts` - Seed data script (~800 parents, ~700 children)
- `openapi.json` - OpenAPI 3.1 spec for Custom GPT Actions
