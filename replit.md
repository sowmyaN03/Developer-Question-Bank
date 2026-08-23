# DevBank

DevBank turns a large, mixed-format developer interview PDF into a searchable, deduplicated study workspace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/developer-question-bank/src/App.tsx` — app shell, routes, quiz flows, local progress, and export.
- `artifacts/developer-question-bank/src/questions.json` — generated question bank with verified and review queues.
- `.agents/scripts/extract_questions.py` — repeatable PDF extraction and deduplication script.

## Architecture decisions

- Complete answerable multiple-choice records are the library source of truth; malformed and single-answer records remain in Needs review.
- Quiz state and attempt history are local-first so the workspace works without an account or network.
- Subject-wise PDF export is generated as a separate print document to include every verified question and its exact keyed answer.

## Product

Search, filter, practice, generate capped 30-question exams, review repeated and incomplete source items, track progress, and export subject-wise study PDFs.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
