# FDW eService SUS Survey

A System Usability Scale (SUS) survey application for MOM's Work Permit transactions for domestic helpers and confinement nannies.

## Overview

This repository contains a **handoff bundle** from Claude Design (claude.ai/design), refactored to use a **Neon PostgreSQL database** for production deployment.

### Components

- **`project/index.html`** — Participant survey (10 SUS items + 3 screener questions)
- **`project/dashboard.html`** — Researcher dashboard (analytics, filters, CSV export)
- **`api/responses.js`** — Vercel serverless function (GET/POST/DELETE)
- **`schema.sql`** — Neon database schema

## Database Setup

### 1. Create Neon Database

1. Sign up at [neon.tech](https://neon.tech) (or use existing account)
2. Create a new project
3. Copy the connection string (starts with `postgresql://`)

### 2. Initialize Schema

Run the schema script in your Neon SQL editor:

```bash
cat schema.sql | pbcopy  # Copy to clipboard
# Then paste and run in Neon Console SQL Editor
```

Or using `psql`:

```bash
psql "$DATABASE_URL" -f schema.sql
```

### 3. Configure Vercel

Add environment variable in Vercel dashboard:

```
DATABASE_URL = postgresql://user:password@host/database?sslmode=require
```

## Local Development

### Prerequisites

- Node.js 18+ (for Vercel CLI)
- Neon database with schema initialized

### Setup

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm install -g vercel

# Link to Vercel project (first time only)
vercel link

# Pull environment variables
vercel env pull .env.local

# Start development server
vercel dev
```

Visit:
- **Survey**: http://localhost:3000/
- **Dashboard**: http://localhost:3000/dashboard

### Dashboard Access

- **Email**: Any `@mom.gov.sg` address
- **Passphrase**: `research`

## Deployment

```bash
vercel --prod
```

## API Endpoints

### `GET /api/responses`
Fetch all survey responses (for dashboard).

**Response**:
```json
[
  {
    "id": "r_1234567890_abc123",
    "timestamp": "2026-04-27T12:00:00.000Z",
    "contact_info": { "full_name": "...", "email": "...", "contact": "..." },
    "screener": { "residency_status": "...", "application_scheme": "...", "ea_usage": "..." },
    "sus_responses": { "sus1": 5, "sus2": 1, ..., "sus10": 4 },
    "sus_score": 87.5,
    "flagged": false
  }
]
```

### `POST /api/responses`
Submit a new survey response.

**Request body**:
```json
{
  "contact_info": { "full_name": "...", "email": "...", "contact": "..." },
  "screener": { "residency_status": "...", "application_scheme": "...", "ea_usage": "..." },
  "sus_responses": { "sus1": 5, "sus2": 1, ..., "sus10": 4 }
}
```

**Response**:
```json
{ "ok": true, "id": "r_1234567890_abc123" }
```

### `DELETE /api/responses`
Clear all responses (researcher action).

**Response**:
```json
{ "ok": true }
```

## Features

### Survey (Participant View)
- SGDS official government banner (masthead)
- 3 screener questions (residency, scheme, EA usage)
- 10 SUS items (5-point Likert scale)
- Progress tracking
- One-time submission per browser (localStorage lockout)
- Mobile-friendly responsive design

### Dashboard (Researcher View)
- **Authentication**: Email (`@mom.gov.sg`) + passphrase (`research`)
- **Summary stats**: Mean, median, std dev, range, grade distribution
- **Per-item analysis**: Average scores with visual bars
- **Filters**: Residency, scheme, EA usage, validity (exclude EA-completed)
- **Individual responses table**: Sortable, paginated
- **Export**: CSV download of filtered responses
- **Print/PDF**: Formatted report generation
- **Clear data**: Delete all responses (with confirmation)

## Design System

This application uses the Singapore Government Design System (SGDS):

- **Masthead**: `@govtechsg/sgds-web-component@3.17.0`
- **Footer**: Custom SGDS-styled footer
- **Colors**: SGDS-compliant palette

## Technical Notes

- **SUS Scoring**: Odd items contribute `(response - 1)`, even items contribute `(5 - response)`, sum × 2.5 = score (0-100)
- **Grading**: A (80.3+), B (74+), C (68+), D (51+), F (<51) — Bangor/Sauro thresholds
- **Validity flagging**: Responses where EA usage = "Yes (EA did it for me)" are flagged for separate analysis

## Original Design

This is a refactored production implementation of designs created in Claude Design (claude.ai/design). See `chats/chat1.md` for the original design conversation.

## License

MIT
