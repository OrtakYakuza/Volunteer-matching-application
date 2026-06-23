# Volunteer Matching Application

A web-based **Human-in-the-Loop (HITL)** prototype for coordinating spontaneous volunteers during crisis situations. It lets volunteers self-register and apply for tasks, and gives coordinators a low-cognitive-load dashboard to publish tasks and review, score, and confirm volunteer–task assignments.

This prototype was built as the practical artifact for a bachelor's thesis on reducing coordinator cognitive load in volunteer coordination systems. Its design is grounded in a structured requirements catalogue (derived from academic literature and practitioner interviews) and in Cognitive Load Theory–based HCI design rules.

> The full requirements catalogue — Functional (FR), Non-Functional (NFR), Information (IR), and Design (DR) requirements with their MoSCoW priorities and source citations — lives in [`requirements.md`](./requirements.md).

---

## Key Concepts

### Pull-based matching with three automation modes

Matching is **pull-based**: a volunteer always applies for an open task first, and matching only fires after that initial act of self-selection. This preserves volunteer agency (FR-11) regardless of how much automation a coordinator enables.

Each task runs in one of three automation modes (`AutomationMode`):

| Mode | Behaviour |
| --- | --- |
| `MANUAL` | Coordinator manually accepts or declines each applicant. |
| `SEMI_AUTO` | System scores and ranks applicants; coordinator reviews and confirms the proposal. |
| `AUTO` | System auto-accepts applicants until the task's capacity is reached. |

### Scoring

When the system ranks an applicant, it computes:

```
score = (skillScore × 3) + (locationScore × 2) + priorityBoost
```

- **skillScore** — number of a task's required skills the volunteer possesses.
- **locationScore** — `2` for an exact postal-code match, `1` for a nearby prefix match, `0` otherwise.
- **priorityBoost** — `LOW` → 0 … `CRITICAL` → 3.

Each proposal also carries a short, human-readable `explanation` (e.g. *"Skills match score: 2; Same or nearby postal code"*) so coordinators can see *why* a volunteer was matched (NFR-10). Core logic lives in [`lib/matching.ts`](./lib/matching.ts).

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5 (strict mode)
- **Database:** Prisma 6 + SQLite (`prisma/dev.db`) — no migrations, schema synced via `db push`
- **Styling:** Tailwind CSS 4
- **Auth:** lightweight `localStorage`-based auth context (prototype-only)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Create / sync the SQLite database from the schema
npx prisma db push

# 3. Seed demo data (coordinators, volunteers, tasks, assignments)
npx tsx prisma/seed.ts

# 4. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Useful commands

```bash
npm run dev          # start the dev server
npm run build        # prisma generate + next build
npm run lint         # ESLint 9 (flat config)

npx prisma studio    # browse the database in a UI
npx prisma generate  # regenerate the client after a schema change
npx prisma db push   # sync schema.prisma -> dev.db
```

---

## Project Structure

```
app/
  api/               # REST API routes (NextResponse.json)
  components/        # Shared React components
  context/           # AuthContext (localStorage-based auth)
  coordinator/       # Coordinator pages (dashboard, tasks, events)
  volunteer/         # Volunteer pages (register, dashboard, task detail)
lib/
  enums.ts           # Single source of truth for all enum values
  matching.ts        # HITL scoring / matching logic
  task-filter.ts     # Task filtering helpers
  prisma.ts          # Prisma client singleton
prisma/
  schema.prisma      # Data model
  seed.ts            # Demo data seeder
  dev.db             # SQLite database (generated)
  ERD.svg            # Auto-generated entity-relationship diagram
requirements.md      # Full requirements catalogue (FR / NFR / IR / DR)
```

---

## Data Model

The schema (see [`prisma/schema.prisma`](./prisma/schema.prisma)) follows a data-minimisation principle (NFR-07) and centres on five models:

- **Volunteer** — identity, contact, skills, optional location. Skills are stored as a JSON-stringified array of the `Skill` enum.
- **Coordinator** — the user who publishes and manages tasks.
- **Task** — a unit of work with category, schedule, location, required skills, capacity, priority, status, automation mode, optional screening flags, and optional recurrence.
- **Assignment** — the volunteer↔task link, carrying status, the assignment's automation mode, referral payload, and the match explanation. A unique `(volunteerId, taskId)` constraint prevents duplicate pairs (FR-14).
- **EventLog** — an append-only audit/event history (NFR-04, IR-14).

> SQLite does not support native enums or arrays. Enums are stored as `String` and cast at the application layer (see [`lib/enums.ts`](./lib/enums.ts)); list fields (skills, required skills) are stored as JSON strings and must be `JSON.parse()`d before comparison.

---

## Requirements Traceability

The prototype is built directly against the catalogue in [`requirements.md`](./requirements.md). Requirement IDs are referenced throughout the code (e.g. `// FR-28`, `// IR-06` in the schema) so each implemented feature can be traced back to its source requirement and citation. The catalogue is organised into:

- **FR** — Functional Requirements
- **NFR** — Non-Functional Requirements
- **IR** — Information Requirements
- **DR** — Design Requirements (Cognitive Load Theory / HCI design rules)

---

## License

Released under the [MIT License](./LICENSE).
