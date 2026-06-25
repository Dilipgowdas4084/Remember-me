# RememberMe - Alzheimer's Compassionate Care Platform

A full-stack Next.js application designed to support Alzheimer's patients, caregivers, and doctors. The platform provides a low-cognitive-load, comforting, voice-assisted interface to keep patients anchored with daily routines, family connections, active medications, and doctors.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons)
- **Backend**: Next.js API Routes, Prisma ORM (PostgreSQL Adapter)
- **Database**: Neon PostgreSQL (Cloud-hosted)
- **Authentication**: JWT Cookie Session Auth with strict Role-Based Access Control
- **Speech System**: Browser Web Speech API (Text-to-Speech and Speech-to-Text)
- **AI Engine**: Context-aware OpenAI GPT companion with a rule-based offline fallback

---

## Getting Started

### 1. Requirements and Setup

Make sure you have Node.js 18+ installed.

Create a `.env` file in the root of the project with the following:

```env
DATABASE_URL="your-neon-postgresql-connection-string"
JWT_SECRET="your-secure-jwt-secret"
OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Install Dependencies and Generate Prisma Client

```bash
npm install
npx prisma generate
```

### 3. Initialize Database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Platform Features

### User Roles

1. **Doctor** — Has clinical editing capabilities. Registers patients, manages family memory cards, schedules medication times, logs allergies, and sets routine timelines.
2. **Caregiver** — Monitors the patient's daily routine completions and medications, and logs stories in the Memory Journal.
3. **Patient** — Enters a zero-stress, read-only interface featuring:
   - Oversized controls and large-contrast fonts
   - One-click Text-To-Speech (TTS) narration
   - Full-screen Memory Mode for family photos
   - Conversational AI memory assistant with microphone input
   - Instant SOS Help Alert button
4. **Supervisor** — Read-only admin view with access to all doctors, patients, and live platform statistics.

### Seeded Test Accounts

Run `npx prisma db seed` to populate the following credentials for testing:

| Role      | Email                       | Password    |
|-----------|-----------------------------|-------------|
| Doctor    | doctor@rememberme.care      | Password123 |
| Patient   | robert@rememberme.care      | Password123 |
| Caregiver | sarah@rememberme.care       | Password123 |

---

## Production Deployment

### Build Command
```bash
npx prisma generate && npm run build
```

### Start Command
```bash
npm run start
```

### Docker (Optional)
```bash
docker build -t rememberme-app .
docker run -p 3000:3000 --env-file .env rememberme-app
```

---

## Development Timeline

### 25 May 2026
- Project started — Initial setup with Next.js 14, Prisma ORM, Neon PostgreSQL

### 02 Jun 2026
- Landing page built — gradient background, feature cards, FAQ section, contact form
- Supervisor Mode added — read-only admin dashboard with all patient details and live stats
- Live location tracking added — location columns in database, visible on supervisor dashboard
- AI Chat route built — `/api/ai/chat` endpoint powered by OpenAI for the patient memory assistant
- All dashboards made mobile responsive — doctor, patient, caregiver, and supervisor
- Netlify deployment configured — `netlify.toml`, environment setup, serverless-ready build

### 04 Jun 2026
- Pro mobile redesign — doctor dashboard native-app layout, compact patient header, slide-up modals

### 07 Jun 2026
- Google OAuth added — login with Google via NextAuth, database user upsert on first login

### 13 Jun 2026
- OAuth fix — proper JWT cookie handoff after Google login

### 20 Jun 2026
- Build fix — removed broken stub route files causing deployment failures
- OAuth rework — replaced NextAuth with direct Google OAuth flow

### 25 Jun 2026
- Google OAuth fully removed — reverted to clean email/password login only for reliability
- Dark mode removed — app now enforces light theme only across all pages
