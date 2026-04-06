# Lumen — Frontend

Next.js PWA for the Lumen cognitive mastery engine. Handles auth, document library, the reading experience, and synthesis submission.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** — Auth (Google OAuth) + session JWT
- **Tailwind CSS 4**
- **Deployed on Vercel**

## How it works

- Sign in with Google via Supabase Auth
- Upload a PDF or EPUB from the library (EPUBs show a section picker so you can skip front matter)
- Read a sector — after 30 seconds the synthesis textarea unlocks (velocity governor)
- Write a synthesis covering the core argument, causal mechanism, and an implication
- Submit — the backend grades it and returns a score, rubric breakdown, and feedback
- Score ≥ 6 masters the sector and unlocks the next one

## Local setup

```bash
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `https://lumen-backend.onrender.com`) |

## Pages

| Path | Description |
|---|---|
| `/login` | Google OAuth sign-in |
| `/library` | Document list, upload dropzone |
| `/read/[docId]` | Reader with sector navigation, velocity governor, synthesis submission |
