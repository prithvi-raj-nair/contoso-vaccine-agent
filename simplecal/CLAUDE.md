# SimpleCal

Week-view calendar for scheduling vaccination outreach visits.

## Development

- Dev server runs on port **3001**: `npm run dev` (configured in package.json)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events?startDate=&endDate=` | List events in date range |
| POST | `/api/events` | Create event |
| GET | `/api/events/[id]` | Get single event |
| DELETE | `/api/events/[id]` | Delete event |

## Data Model

```typescript
{
  _id: ObjectId,
  name: string,           // "Outreach Visit - Rampur"
  description: string,    // "Vaccine A: 5, Vaccine B: 3"
  startTime: Date,
  endTime: Date,
  isAllDay: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Database

- Database: `simplecal`
- Collection: `events`
- Index: `startTime_1` - ascending index for date range queries

## Key Files

- `lib/mongodb.ts` - Connection pooling (lazy initialization)
- `lib/types.ts` - TypeScript interfaces
- `public/openapi.json` - OpenAPI spec for Custom GPT Actions
