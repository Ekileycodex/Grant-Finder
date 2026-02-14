# Architecture Notes

## Stack choice
GrantFinder uses **Next.js App Router + Node API routes + Prisma** so we can share TypeScript types and business logic across UI, APIs, and worker without cross-service overhead for MVP.

## Ingestion
- Worker runs every 6 hours via `node-cron` in UTC.
- `ingestGrantsGov` and `ingestSbir` call public APIs first.
- Requests use explicit user-agent and retry/backoff on 429/5xx.
- If grants.gov API fails, a conservative fallback HTML fetch inserts a placeholder opportunity.
- Dedup strategy: source+stable sourceIdentifier unique key, then fuzzy title jaccard fallback.

## Extraction
- OpenAI is used only for extracting structured fields from `eligibilityTextRaw`.
- Output is validated with strict Zod schema.
- On schema failure, retries once with tighter prompt.
- If still invalid: mark extraction failed and keep raw text.

## Eligibility logic
- Deterministic and conservative only.
- Uses extracted structured fields with missing-field handling.
- Returns one of `Eligible`, `Likely Eligible`, `Requires Clarification`, `Not Eligible` with explanation + checklist.

## Scoring
Explainable weighted model (0–100):
- keyword match (40)
- TRL proximity (20)
- funding overlap (20)
- geography match (10)
- agency preference (10)

## Alerts
- Daily digest email includes watchlist grants with deadlines within next 7 days.
- Uses SMTP transport (MailHog in local compose).
