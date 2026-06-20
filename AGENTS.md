# HardwarePilot — Agent Instructions

## Status

Phase 0 (Foundation & Context) Done. Phase 1 (Monorepo Scaffold + Project CRUD) In Progress (40%).

## Context Docs (read before building)

| File | Contains |
|------|----------|
| `context/project.md` | Vision, target users, MVP scope, form-first workflow |
| `context/architecture.md` | Hardware Context Graph, 5 core invariants, domain model, AI layer |
| `context/ai-workflow-rules.md` | 15 rules governing AI behavior, risk tiers, decision logging |
| `context/ui-context.md` | Visual personality, color system (electric violet `#7C5CFC`), motion, density |
| `context/code-standards.md` | Tech stack, conventions, git workflow |
| `context/progress-tracker.md` | Phase tracker, task checkboxes — **agent-owned, update after every task** |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend + API | Next.js 16 (App Router, RSC, Server Actions) |
| Compute service | Python FastAPI (`apps/compute/`) |
| Database | PostgreSQL 17 (Docker) |
| ORM | Prisma v7 |
| Styling | Tailwind v4 + shadcn/ui |
| Client state | Zustand |
| Server cache | TanStack Query |
| Visualization | React Flow, Three.js, React Three Fiber |
| AI | AI SDK 6 |
| Validation | Zod (authoritative), synced to Pydantic via JSON Schema |
| Lint/Format (TS) | Biome |
| Lint/Format (Python) | Ruff |
| Python pkg manager | uv |
| Monorepo | Turborepo + pnpm workspaces |
| Service protocol | gRPC + protobuf (`proto/` at root) |
| UI font | Inter (UI), Geist Mono (code/tech labels) |
| Icons | Lucide only, no mixing |
| Target | Desktop-only, min 1280px wide, no mobile |

## Project Structure (planned)

```
hardwarepilot/
├─ apps/
│  ├─ web/          # Next.js 16 (frontend + API)
│  └─ compute/      # Python FastAPI (in tree, not pnpm workspace)
├─ packages/
│  ├─ ui/           # Shared React components — only when 2+ frontend apps exist (not in Phase 1)
│  ├─ db/           # Prisma schema + client
│  └─ agents/       # AI SDK 6 agent definitions
└─ proto/           # gRPC .proto definitions
```

`apps/compute` lives in repo tree but uses own venv + `pyproject.toml`. Not part of pnpm workspace.

`packages/ui/` stays empty during Phase 1. All UI lives in `apps/web/components/`. Extract to shared package only when second frontend app exists.

## Local Dev Commands

```sh
# Start database + pgAdmin (Docker required, PostgreSQL on :54322, pgAdmin on :5050)
docker compose up -d

# Start Next.js dev server
pnpm dev

# Database (run from packages/db/)
pnpm db:generate    # regenerate Prisma client after schema change
pnpm db:push        # push schema to dev DB (no migrations)
pnpm db:migrate     # create + apply migration
pnpm db:studio      # open Prisma Studio

# Lint + format
pnpm biome check .
pnpm biome format . --write
```

## Server vs Client Components

Default to **server components**. Add `'use client'` only when needed (hooks, browser APIs, event handlers, Three.js/React Flow, Zustand stores). Push interactivity to leaf components. Data fetching stays server-side.

## Data Layer

- **Reads**: Server Components call Prisma directly or via `lib/services/<domain>.ts`. Never through server actions.
- **Mutations**: Server actions only, with Zod input validation. Return `ActionResult<T>` shape.
- Client components never touch Prisma.

## Error Handling

```ts
type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }
```

Server actions never throw to client. Client handles error branch explicitly.

## Validation

Zod is single source of truth. Sync direction: Zod → `zod-to-json-schema` → JSON Schema → Pydantic import. Python regenerates on build.

## gRPC Contract

`.proto` files in `proto/`. TypeScript client via `protoc`/connectrpc into `packages/proto`. Python server via `grpcio-tools` into `apps/compute`. REST acceptable only for health checks.

## Testing

- Colocated: `Component.tsx` → `Component.test.tsx`
- E2E: `apps/web/e2e/` via Playwright, critical flows only
- No coverage thresholds. No tests for impossible scenarios. No tests for framework internals.

## Git

- Git Flow: `main` / `develop` / `feature/<scope>-<desc>` / `release/<version>` / `hotfix/<desc>`
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- Never skip hooks. Never force-push. Stage specific files, not `git add -A`.

## Code Style

- No comments unless WHY is non-obvious (hidden constraint, subtle invariant, bug workaround)
- No features beyond task scope. No premature abstraction.
- No error handling for impossible scenarios. Validate only at system boundaries.
- No backwards-compatibility hacks for removed code.
- Prefer editing existing files over creating new ones.
- Never create documentation files unless explicitly asked.
- Never assume a library is available — check `package.json` or `pyproject.toml` first.
- Never expose or log secrets.

## Progress Tracker Protocol

After completing any task:
1. Flip checkbox (`[ ]` → `[~]` when starting, `[~]` → `[x]` when done)
2. Recompute phase percent complete
3. Update phase status header
4. Commit with `chore:` or `feat:` prefix

## Architecture Invariants (constrain all design decisions)

1. Hardware Context Graph is source of truth. PCB layouts, STLs, BOMs are derived artifacts.
2. Form, Electronics, Manufacturing are equal domains. Optimize none exclusively.
3. Every AI decision must include reasoning, constraints, alternatives considered.
4. Users own the design. AI assists, never becomes authoritative.
5. Generated assets are disposable — always regenerable from the graph.

## AI Interaction Model

- **Low-risk** (rename, organize, metadata): auto-apply + toast notification
- **Medium-risk** (move module, change placement, adjust dimensions): proposal → require approval
- **High-risk** (replace components, change architecture, split boards): proposal with full reasoning → require explicit approval, never auto-execute
- Chat dock = asking. Activity feed = deciding. Separate surfaces.
