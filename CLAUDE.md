# Volunteer Matching HITL Prototype — Claude Code

## Build, Lint & Database Commands

```bash
npm install          # also runs prisma generate via postinstall
npm run dev          # dev server
npm run build        # prisma generate + next build
npm run lint         # ESLint 9 flat config

npx prisma generate  # after any schema.prisma change
npx prisma db push   # sync schema to prisma/dev.db (no migrations)
npx prisma studio    # DB browser UI
npx tsx prisma/seed.ts  # seed the database
```

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Database:** Prisma 6 + SQLite (`prisma/dev.db`) — NOT PostgreSQL
- **Styling:** Tailwind CSS 4 — use `@import "tailwindcss"` in CSS, NOT `@tailwind` directives
- **Language:** TypeScript 5, strict mode

## Project Structure

```
app/
  api/               # REST API routes (NextResponse.json only)
  components/        # Shared React components (named exports)
  context/           # AuthContext — localStorage-based auth
  coordinator/       # Coordinator pages
  volunteer/         # Volunteer pages
lib/
  enums.ts           # Single source of truth for all enum values
  matching.ts        # HITL scoring/matching logic
  prisma.ts          # Prisma singleton
prisma/
  schema.prisma
  seed.ts
  dev.db
```

## Code Style

- **Imports:** use `@/` alias for all absolute imports
- **Semicolons:** always
- **Indentation:** 2 spaces
- **Quotes:** double quotes for JSX attributes
- **Components:** named `function` declarations, named exports (NOT default exports — except `page.tsx`/`layout.tsx`)
- **Types:** never use `any`; use generated `@prisma/client` types for DB models
- **Enums:** stored as `String` in SQLite, cast at app layer; `UPPER_SNAKE_CASE` members
- **Files:** `kebab-case` for utilities/routes, `PascalCase` for React component files

## API Route Pattern

```ts
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },  // Next.js 16: params is a Promise
) {
  const params = await props.params;           // must await
  try {
    // ...
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    console.error("Context", error);
    return NextResponse.json({ error: "Message." }, { status: 500 });
  }
}
```

Status codes: 200 GET/PATCH, 201 POST, 400 bad input, 404 not found, 409 conflict, 500 server error.  
Use `prisma.$transaction([...])` for multi-write atomicity.

## React Patterns

- **Server components** (no directive): fetch directly via Prisma
- **Client components** (`"use client"`): fetch via `useEffect` + `fetch("/api/...")`
- Auth: `useAuth()` from `@/app/context/AuthContext` → `{ role, user, logout, isHydrated }`
- Guard coordinator routes with `CoordinatorAuthGuard`
- No external component libraries — build UI with Tailwind from scratch

## Matching Logic (HITL)

Core in `lib/matching.ts`. Pull-based: volunteer applies first, matching fires after.

**Three modes (`AutomationMode`):**
- `MANUAL` — coordinator manually accepts/declines
- `SEMI_AUTO` — system scores and ranks; coordinator confirms
- `AUTO` — system auto-accepts on application until capacity reached

**Score:** `(skillScore × 3) + (locationScore × 2) + priorityBoost`  
Skills and `requiredSkills` are JSON-stringified arrays — always `JSON.parse()` before comparison.

## Subagents

- **huang** — UI & Cognitive Load expert. Use for reviewing components against R1–R18 design rules.
  Invoke: type `/agents` and select `huang`, or ask to review a component against the CLT design rules.

## Git Protocol

- Run `npm run lint` before committing
- No Prisma migrations — use `npx prisma db push` for schema changes
- Do not commit `node_modules/`, `.next/`, `prisma/dev.db`, or `.env`
