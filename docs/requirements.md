# Contoso Vaccine Agent - Requirements Document

## 1. Project Overview

### 1.1 Purpose
Build a demo AI agent to assist healthcare workers in Contoso's national vaccination program. The agent will help:
- **Town Medical Officers**: Schedule village visits, order vaccines, generate reports
- **On-ground Workers (Nurses)**: Check schedules, fetch patient data, record vaccinations

### 1.2 Solution Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Custom GPT (ChatGPT)                      │
│                    (Conversational Interface)                    │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
                  ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│         SimpleCal           │   │          NHDB App           │
│    (Calendar Service)       │   │   (Health Database Service) │
│                             │   │                             │
│  • Schedule outreach visits │   │  • Patient records          │
│  • View upcoming visits     │   │  • Vaccination history      │
│  • Track visit history      │   │  • Vaccine demand forecast  │
│                             │   │  • Metrics & reports        │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                  │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas (Same Cluster)                  │
│  ┌─────────────────────┐         ┌─────────────────────────┐   │
│  │  simplecal database │         │    nhdb database        │   │
│  │  • events           │         │    • parents            │   │
│  └─────────────────────┘         │    • children           │   │
│                                  │    • vaccination_visits │   │
│                                  │    • villages           │   │
│                                  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Deployment
- **SimpleCal**: Deployed as separate Vercel app from `simplecal/` subfolder
- **NHDB App**: Deployed as separate Vercel app from `nhdb-app/` subfolder
- **Database**: MongoDB Atlas (same cluster, different databases)

---

## 2. Domain Context

### 2.1 Villages (Fixed List)
| Village ID | Village Name |
|------------|--------------|
| V001 | Rampur |
| V002 | Shivgaon |
| V003 | Lakshminagar |
| V004 | Chandpur |
| V005 | Govindpur |
| V006 | Surajkund |
| V007 | Motinagar |

### 2.2 Vaccination Schedule
| Vaccine | Due Period | Window |
|---------|------------|--------|
| Vaccine A | Within 1 week of birth | DOB to DOB + 7 days |
| Vaccine B | 6-8 weeks after birth | DOB + 42 days to DOB + 56 days |
| Vaccine C | 12-14 weeks after birth | DOB + 84 days to DOB + 98 days |

### 2.3 Key Metrics
- **Dropout Rate**: `(Children who got first dose - Children who got last dose) / Children who got first dose`
- **Vaccine Wastage**: `(Vaccines carried to village - Vaccines actually administered) / Vaccines carried`

---

## 3. SimpleCal - Calendar Application

### 3.1 Features

#### 3.1.1 UI Features
| Feature | Description |
|---------|-------------|
| Week View | Display 7-day calendar (Sunday to Saturday) |
| Week Navigation | Buttons to go to previous/next week, and "Today" button |
| All-day Events | Displayed at top of each day column |
| Timed Events | Displayed in time slots based on start/end time |
| Add Event | Modal/form to create new event |
| View Event | Click event to see full details |
| Delete Event | Delete button in event detail view |

#### 3.1.2 Event Data Model
```javascript
{
  _id: ObjectId,
  name: String,           // e.g., "Outreach Visit - Rampur"
  description: String,    // e.g., "Vaccine A: 5, Vaccine B: 3, Vaccine C: 2"
  startTime: Date,        // ISO datetime
  endTime: Date,          // ISO datetime
  isAllDay: Boolean,      // true for all-day events
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 API Endpoints

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/api/events` | Fetch events within date range | UI, Custom GPT |
| POST | `/api/events` | Create new event | UI, Custom GPT |
| GET | `/api/events/[id]` | Get single event details | UI, Custom GPT |
| DELETE | `/api/events/[id]` | Delete an event | UI, Custom GPT |

#### 3.2.1 GET /api/events
**Query Parameters:**
- `startDate` (required): ISO date string (e.g., "2025-01-13")
- `endDate` (required): ISO date string (e.g., "2025-01-19")

**Response:**
```json
{
  "events": [
    {
      "_id": "...",
      "name": "Outreach Visit - Rampur",
      "description": "Vaccine A: 5, Vaccine B: 3, Vaccine C: 2",
      "startTime": "2025-01-15T09:00:00Z",
      "endTime": "2025-01-15T14:00:00Z",
      "isAllDay": false
    }
  ]
}
```

#### 3.2.2 POST /api/events
**Request Body:**
```json
{
  "name": "Outreach Visit - Rampur",
  "description": "Vaccine A: 5, Vaccine B: 3, Vaccine C: 2",
  "startTime": "2025-01-15T09:00:00Z",
  "endTime": "2025-01-15T14:00:00Z",
  "isAllDay": false
}
```

**Response:**
```json
{
  "success": true,
  "event": { ... }
}
```

### 3.3 Custom GPT Usage Scenarios

1. **Schedule visits for the week**
   - GPT fetches events from last 2 weeks
   - Identifies villages not visited recently
   - Creates new events for unvisited villages
   - Includes vaccine requirements in event description

2. **Check upcoming visits**
   - GPT fetches events for current/next week
   - Returns schedule summary

---

## 4. NHDB App - National Health Database Application

### 4.1 Data Models

#### 4.1.1 Villages Collection
```javascript
{
  _id: ObjectId,
  villageId: String,      // "V001"
  name: String,           // "Rampur"
  createdAt: Date
}
```

#### 4.1.2 Parents Collection
```javascript
{
  _id: ObjectId,
  govtId: String,         // Unique government ID number
  name: String,
  dateOfBirth: Date,
  villageId: String,      // Reference to village
  phoneNumber: String,    // Optional
  createdAt: Date,
  updatedAt: Date
}
```

#### 4.1.3 Children Collection
```javascript
{
  _id: ObjectId,
  govtId: String,         // Optional - birth certificate number
  name: String,
  dateOfBirth: Date,
  parentId: ObjectId,     // Reference to parent
  villageId: String,      // Reference to village (denormalized for easier queries)
  createdAt: Date,
  updatedAt: Date
}
```

#### 4.1.4 Vaccination Visits Collection
```javascript
{
  _id: ObjectId,
  childId: ObjectId,      // Reference to child
  visitDate: Date,
  vaccineGiven: String,   // "A", "B", "C", "none_required", "not_available"
  notes: String,          // Optional notes
  createdAt: Date
}
```

### 4.2 Vaccination Status Logic

For any child, the system calculates:

```
Current Date: today
Child DOB: dob
Existing vaccinations: [list of vaccines already given]

Next Vaccine Due:
├── If "A" not given:
│   ├── Due window: dob to dob + 7 days
│   └── Status: "overdue" if today > dob + 7 days, else "due"
├── Else if "B" not given:
│   ├── Due window: dob + 42 days to dob + 56 days
│   └── Status: "upcoming" if today < dob + 42 days
│   └── Status: "due" if dob + 42 <= today <= dob + 56
│   └── Status: "overdue" if today > dob + 56 days
├── Else if "C" not given:
│   ├── Due window: dob + 84 days to dob + 98 days
│   └── Status: (same logic as above)
└── Else: "complete" - all vaccines given
```

### 4.3 Features

#### 4.3.1 UI Features
| Feature | Description |
|---------|-------------|
| Add Parent | Form to register new parent with govt ID, name, DOB, village |
| Add Child | Form to register new child linked to parent |
| Search by Parent ID | Enter govt ID to find parent and their children |
| View Child Details | See child info, vaccination history, next vaccine due |
| Record Vaccination | Record a vaccination visit for a child |

#### 4.3.2 UI Flow
```
Home Page
├── [Add Parent] → Parent Registration Form
├── [Add Child] → Child Registration Form (select parent)
└── [Search] → Enter Parent Govt ID
                └── Parent Details + List of Children
                    └── Click Child → Child Details
                        ├── Basic Info (name, DOB, village)
                        ├── Vaccination History (table)
                        ├── Next Vaccine Due (highlighted)
                        └── [Record Vaccination Visit] → Form
                            ├── Date picker
                            ├── Dropdown: A, B, C, None Required, Not Available
                            └── Notes (optional)
```

### 4.4 API Endpoints

#### 4.4.1 Parent APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/parents` | Create new parent |
| GET | `/api/parents?govtId=XXX` | Find parent by govt ID |
| GET | `/api/parents/[id]` | Get parent details |

#### 4.4.2 Child APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/children` | Create new child |
| GET | `/api/children?parentId=XXX` | Get children of a parent |
| GET | `/api/children/[id]` | Get child details with vaccination status |

#### 4.4.3 Vaccination APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vaccinations` | Record a vaccination visit |
| GET | `/api/vaccinations?childId=XXX` | Get vaccination history for a child |

#### 4.4.4 Reporting APIs (Custom GPT Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/vaccine-demand` | Get vaccine counts needed for a village in a date range |
| GET | `/api/reports/dropout-rate` | Get monthly dropout rates by village |
| GET | `/api/reports/wastage` | Get vaccine wastage trends |

### 4.5 Detailed API Specifications

#### GET /api/reports/vaccine-demand
**Purpose:** Calculate how many of each vaccine type are needed for a village in a given week.

**Query Parameters:**
- `villageId` (required): Village ID (e.g., "V001")
- `startDate` (required): Start of the week
- `endDate` (required): End of the week

**Logic:**
1. Find all children in the village
2. For each child, determine what vaccine is due in the given date range
3. Count vaccines by type

**Response:**
```json
{
  "villageId": "V001",
  "villageName": "Rampur",
  "startDate": "2025-01-13",
  "endDate": "2025-01-19",
  "demand": {
    "A": 5,
    "B": 3,
    "C": 2
  },
  "totalChildren": 100,
  "childrenNeedingVaccines": 10
}
```

#### GET /api/reports/dropout-rate
**Purpose:** Calculate dropout rates over the last 6 months.

**Response:**
```json
{
  "months": [
    {
      "month": "2024-08",
      "villages": [
        {
          "villageId": "V001",
          "villageName": "Rampur",
          "childrenStarted": 50,
          "childrenCompleted": 45,
          "dropoutRate": 0.10
        }
      ]
    }
  ]
}
```

#### GET /api/reports/wastage
**Purpose:** Calculate vaccine wastage over last 6 months.

**Logic:**
- Compare expected vaccinations (based on scheduled visits) vs actual vaccinations
- Wastage = doses that should have been given but weren't (child missed, not available, etc.)

**Response:**
```json
{
  "months": [
    {
      "month": "2024-08",
      "wastage": {
        "A": { "expected": 100, "actual": 95, "wasted": 5, "rate": 0.05 },
        "B": { "expected": 80, "actual": 75, "wasted": 5, "rate": 0.0625 },
        "C": { "expected": 60, "actual": 58, "wasted": 2, "rate": 0.033 }
      }
    }
  ]
}
```

### 4.6 Custom GPT Usage Scenarios

1. **Fetch child details from ID card photo**
   - User sends photo of parent's ID card
   - GPT extracts govt ID using vision
   - GPT calls `/api/parents?govtId=XXX`
   - Returns parent info and children with vaccination status

2. **Update vaccination record**
   - User says "I just gave Vaccine B to [child name]"
   - GPT calls POST `/api/vaccinations`

3. **Order vaccines for the week**
   - GPT calls `/api/reports/vaccine-demand` for each scheduled village
   - Summarizes total vaccines needed

4. **Generate dropout report**
   - GPT calls `/api/reports/dropout-rate`
   - Formats and presents the data

---

## 5. Seed Data Requirements

### 5.1 Villages
- 7 villages as listed in section 2.1

### 5.2 Parents
- ~100-150 parents per village
- Total: ~700-1000 parents

### 5.3 Children
- ~100 children per village
- Total: ~700 children
- Age distribution: 0-16 weeks (to show various vaccination stages)
- Some children should have:
  - No vaccinations yet
  - Only Vaccine A
  - Vaccines A and B
  - All vaccines complete

### 5.4 Vaccination History
- Generate realistic vaccination records
- Include some "not_available" and "none_required" entries for realism

### 5.5 Calendar Events
- Create some past outreach visits (last 2-3 weeks)
- Leave gaps for the agent to schedule

---

## 6. OpenAPI Specifications

Both apps need OpenAPI specs for Custom GPT Actions:
- `simplecal/openapi.json`
- `nhdb-app/openapi.json`

These will define:
- Server URLs (Vercel deployment URLs)
- All endpoints with request/response schemas
- Authentication (none for this demo)

---

## 7. Tech Stack

### 7.1 SimpleCal
- **Frontend**: Next.js (App Router) with React
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: MongoDB Atlas (`simplecal` database)
- **Deployment**: Vercel

### 7.2 NHDB App
- **Frontend**: Next.js (App Router) with React
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: MongoDB Atlas (`nhdb` database)
- **Deployment**: Vercel

---

## 8. Project Structure

```
contoso-vaccine-agent/
├── docs/
│   ├── task-context.md
│   ├── requirements.md (this file)
│   └── ...
├── simplecal/
│   ├── app/
│   │   ├── page.tsx (calendar UI)
│   │   └── api/
│   │       └── events/
│   │           ├── route.ts (GET, POST)
│   │           └── [id]/route.ts (GET, DELETE)
│   ├── lib/
│   │   └── mongodb.ts
│   ├── openapi.json
│   ├── package.json
│   └── vercel.json
├── nhdb-app/
│   ├── app/
│   │   ├── page.tsx (home/search)
│   │   ├── parents/
│   │   ├── children/
│   │   └── api/
│   │       ├── parents/
│   │       ├── children/
│   │       ├── vaccinations/
│   │       ├── villages/
│   │       └── reports/
│   ├── lib/
│   │   └── mongodb.ts
│   ├── scripts/
│   │   └── seed.ts (seed data script)
│   ├── openapi.json
│   ├── package.json
│   └── vercel.json
└── CLAUDE.md
```

---

## 9. Implementation Phases

### Phase 1: SimpleCal
1. Set up Next.js project structure
2. Implement MongoDB connection
3. Build API endpoints
4. Build calendar UI
5. Create OpenAPI spec
6. Deploy to Vercel

### Phase 2: NHDB App
1. Set up Next.js project structure
2. Implement MongoDB connection
3. Create database schema and models
4. Build core APIs (parents, children, vaccinations)
5. Build reporting APIs
6. Build UI screens
7. Create seed data script
8. Create OpenAPI spec
9. Deploy to Vercel

### Phase 3: Custom GPT Configuration
1. Create Custom GPT in ChatGPT
2. Add system instructions with context about Contoso
3. Configure Actions with both OpenAPI specs
4. Test all scenarios

---

## 10. Open Questions / Decisions Needed

1. **Time zone handling**: Should we assume a specific timezone (e.g., IST) or use UTC everywhere?

2. **ID format for parents**: Should govt IDs follow a pattern (e.g., "AADHAAR-XXXX-XXXX-XXXX") or be random strings?

3. **Event description format**: For outreach visits, should the description follow a structured format that the GPT can parse?
   - Option A: Free text - "Vaccine A: 5, Vaccine B: 3, Vaccine C: 2"
   - Option B: JSON in description - `{"vaccineA": 5, "vaccineB": 3, "vaccineC": 2, "village": "Rampur"}`

4. **Calendar event metadata**: Should we add a `villageId` field to events for easier querying, or rely on parsing the event name?

---

## 11. Success Criteria

The demo is successful when:

1. **Medical Officer can:**
   - Ask GPT to "schedule visits for this week" and see events created in SimpleCal
   - Ask "how many vaccines do I need to order for this week" and get accurate counts
   - Ask for dropout and wastage reports

2. **On-ground Worker can:**
   - Ask GPT "what are my visits this week" and see schedule
   - Send a photo of an ID card and get patient details
   - Tell GPT "I gave Vaccine B to [child]" and have it recorded

3. **Both apps:**
   - Have functional UIs for manual operations
   - Have APIs that Custom GPT can call reliably
