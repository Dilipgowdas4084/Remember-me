# RememberMe - Alzheimer's Compassionate Care Platform

A full-stack Next.js 15 application designed to support Alzheimer's patients, caregivers, and doctors. The platform provides a low-cognitive-load, comforting, voice-assisted interface to keep patients anchored with daily routines, family connections, active medications, and doctors.

## Tech Stack
- **Frontend**: Next.js 15 (App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons)
- **Backend**: Next.js API Routes, Prisma v7 ORM (PostgreSQL Adapter)
- **Database**: PostgreSQL (Prisma adapter)
- **Authentication**: JWT Cookie Session Auth (Strict Role-Based Access Control)
- **Speech System**: Browser Web Speech API (Text-to-Speech & Speech-to-Text)
- **AI Engine**: Context-Aware OpenAI GPT companion with a rule-based offline fallback.

---

## Getting Started

### 1. Requirements & Setup
Make sure you have Node.js 18+ and Docker (or a local PostgreSQL server) installed.

1. **Environment Variables**: Clone or edit the `.env` file in the root:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/remembermedb?schema=public"
   JWT_SECRET="your-ultra-secure-jwt-secret-key"
   OPENAI_API_KEY="" # Optional: If left blank, a fallback clinical matcher will be used
   ```

### 2. Start PostgreSQL Database
Using the supplied `docker-compose.yml`, run:
```bash
docker compose up -d
```

### 3. Initialize Prisma Database & Mock Data Seeding
Sync your schema models and seed initial mock profiles (Doctors, Caregivers, Patients, memory items, routine timeline examples):
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Platform Features & Credentials

### User Roles
1. **Doctor**: Has clinical editing capabilities. Registers patients, manages family cards, schedules medication times, logs allergies, and sets routine timelines.
2. **Caregiver**: Monitors the patient's daily routine completions and medications, and logs stories in the Memory Journal.
3. **Patient**: Enters a zero-stress, read-only interface. Features:
   - Oversized controls and large-contrast fonts.
   - One-click Text-To-Speech (TTS) narration.
   - Full-screen "Memory Mode" for family photos.
   - Conversational AI memory assistant with microphone input (STT).
   - Instant "SOS Help Alert" button.

### Seeded Mock Accounts
Run `npx prisma db seed` to populate these credentials for testing:
- **Doctor Profile**:
  - Email: `doctor@rememberme.care`
  - Password: `Password123`
- **Patient Profile**:
  - Email: `robert@rememberme.care`
  - Password: `Password123`
- **Caregiver Profile**:
  - Email: `sarah@rememberme.care`
  - Password: `Password123`

---

## Production Build & Docker Setup

### Local Compilation Check
To verify strict compilation:
```bash
npm run build
```

### Containerized Deployment
Build and run via Docker:
```bash
docker build -t rememberme-app .
docker run -p 3000:3000 --env-file .env rememberme-app
```
