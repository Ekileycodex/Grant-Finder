# GrantFinder MVP

Production-minded MVP web app that ingests grants, extracts structured eligibility constraints, evaluates deterministic eligibility, and scores fit.

## Why Node API routes?
For MVP speed and maintainability, this repo uses Next.js API routes rather than a separate FastAPI service. This keeps one runtime, one type system, and shared logic for web + worker.

## Features
- Ingestion from grants.gov + sbir.gov every 6 hours
- Normalized Postgres schema (Prisma)
- Dedup by source IDs + fuzzy title match
- Bounded LLM extraction with strict JSON schema validation and one retry
- Deterministic eligibility verdict + checklist
- Explainable fit scoring breakdown
- Email/password auth
- Dashboard, grant detail, watchlist APIs, saved searches
- Daily email alerts for upcoming deadlines
- Unit tests for eligibility logic and extraction validation

## Setup
1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Start services:
   ```bash
   docker compose up --build
   ```
3. Run migrations + seed (from another terminal):
   ```bash
   docker compose exec web npm run prisma:migrate -- --name init
   docker compose exec web npm run prisma:seed
   ```
4. Open app: http://localhost:3000

Demo user: `demo@grantfinder.dev` / `password123`

## Local non-docker
```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```
Worker:
```bash
npm run worker
```

## Environment variables
See `.env.example` for full list.
Important:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `GRANTS_GOV_API_BASE`, `SBIR_API_BASE`
- `INGESTION_USER_AGENT`
- SMTP settings for alerts

## Testing
```bash
npm test
```

## Security notes
- Passwords are hashed with bcrypt.
- Secrets come from env vars and are never logged.
- API handlers validate basic input constraints.
