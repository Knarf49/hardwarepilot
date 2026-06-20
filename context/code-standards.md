# Code Standards

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend + API | Next.js 16 (App Router, RSC, server actions, route handlers) |
| Compute service | Python FastAPI (geometry, constraint solving, enclosure generation, SPICE simulation) |
| Simulation engine | ngspice / PySpice (runs in `apps/compute`, called via gRPC) |
| Database | PostgreSQL 17 (Docker) |
| ORM | Prisma v7 |
| Styling | Tailwind v4 + shadcn/ui |
| Client state | Zustand |
| Server cache | TanStack Query |
| Visualization | React Flow, Three.js, React Three Fiber |
| AI | AI SDK 6 |
| Validation | Zod (shared source of truth) |
| Testing (TS) | Vitest + React Testing Library + Playwright |
| Testing (Python) | Pytest |
| Lint / Format (TS) | Biome |
| Lint / Format (Python) | Ruff |
| Python package manager | uv |

---

# Project Structure

Turborepo + pnpm workspaces monorepo.

```
hardwarepilot/
├─ apps/
│  ├─ web/          # Next.js 16 (frontend + API)
│  └─ compute/      # Python FastAPI (in tree, not pnpm)
├─ packages/
│  ├─ ui/           # Shared React components — only when 2+ frontend apps exist (not in Phase 1)
│  ├─ db/           # Prisma schema + client
│  └─ agents/       # AI SDK 6 agent definitions
└─ proto/           # gRPC .proto definitions (shared contract)
```

`apps/compute` lives in the Turborepo tree for colocation but is not part of the pnpm workspace. It uses its own Python venv and `pyproject.toml` managed by Ruff.

`packages/ui/` is not created in Phase 1. All UI components live in `apps/web/components/`. Extract into `packages/ui/` only when a second frontend app exists and actually shares components.

Other shared TypeScript packages are created only when reuse is real. Do not pre-create empty packages.

---

# Naming Conventions

Follow Next.js App Router defaults.

## Files

- App Router special files: `page.tsx`, `route.ts`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- Components: PascalCase — `Button.tsx`, `ModuleCard.tsx`
- Utilities: camelCase — `formatDate.ts`, `parseGraph.ts`
- Hooks: `use` prefix — `useGraph.ts`, `useProject.ts`
- Constants: UPPER_SNAKE_CASE — `MAX_BOARD_WIDTH`, `DEFAULT_CLEARANCE`
- Types and interfaces: PascalCase — `Module`, `Constraint`, `Decision`

## Folders

- Feature folders: kebab-case — `module-graph/`, `enclosure-gen/`
- Route segments: per Next.js App Router convention (lowercase, kebab-case for multi-word)

---

# Server vs Client Components

Default to **server components**. Add `'use client'` only when required.

A component must be a client component if it uses:

- React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Browser APIs (`window`, `document`, `canvas`, `WebGL`)
- Event handlers (`onClick`, `onChange`, etc.)
- Three.js, React Three Fiber, or React Flow
- Zustand stores

Rules:

- Push interactivity to the leaves. Keep containers and layouts as server components.
- Data fetching stays in server components and server actions. Never fetch in client components when the data is available server-side.
- Client components import server-only data via props passed from server parents.

---

# Data Layer

## Reads

Server Components call Prisma directly in `async` components, or via a thin server-only library in `lib/services/<domain>.ts`.

Reads never go through server actions. Server actions are for mutations only.

## Mutations

All mutations go through **server actions** with Zod input validation.

Server actions:

- Validate input with Zod schema
- Perform Prisma mutation
- Return `{ data, error }` result shape (see Error Handling)
- Never throw across the server/client boundary

## JSONB Patterns

Graph node data that has nested structure (shape geometry, constraint rules, module
ports, decision metadata) uses PostgreSQL JSONB columns via Prisma's `Json` type.

Conventions:

- **Shape geometry**: `{ vertices: { x: number, y: number }[], edges?: { index: number, curve?: { type: "cubic" | "quadratic", cp1: { x, y }, cp2: { x, y } } }[] }`
- **Schema validation**: Zod schema validates the JSONB shape on write. Never
  store unvalidated JSON in graph nodes.
- **Partial updates**: Prefer Prisma's JSONB field-level update operators over
  read-modify-write cycles when touching a single field inside a JSONB column.
- **No arbitrary JSON**: Every JSONB column has a known Zod schema. If a column
  grows too many optional fields, split into a dedicated table.

## Prisma Access

Client components never touch Prisma. Prisma access is server-only. Any client-needed data flows through props from a server parent or through TanStack Query hitting a route handler that itself uses the server-only service layer.

---

# Validation

**Zod is the single source of truth for schemas.**

## Where Zod Schemas Live

Shared schemas live in `packages/db` or a dedicated `packages/schemas` package when reuse spans web and compute.

## Usage

- Server action input validation
- Route handler request body validation
- AI SDK 6 tool definitions (derived from the same Zod schemas)
- Python service contract (Zod schemas exported to JSON Schema, imported by Pydantic)

## Python Sync

Zod → `zod-to-json-schema` → JSON Schema → Pydantic model import.

One-direction sync. Zod is authoritative. Python service regenerates Pydantic models from the shared JSON Schema on build.

---

# Error Handling

## Layered Model

Transport errors are handled explicitly. Render errors are caught by boundaries.

### Python Service

FastAPI raises typed `HTTPException` with a stable error code and message.

### Next.js Server Actions

Server actions catch FastAPI errors and any internal errors, then return a result object:

```ts
type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }
```

Server actions never throw to the client.

### Client

Client components receive `{ data, error }` from server actions and handle the error branch explicitly (toast, inline message, or feed entry).

React error boundaries (`error.tsx` in App Router) catch render errors only — not transport or mutation errors.

---

# Python Service Contract

## Protocol

**gRPC + protobuf.**

`.proto` files live in `proto/` at the monorepo root. Both Next.js and FastAPI generate stubs from the same definitions.

## Why gRPC

- Typed contract on both sides
- Efficient for mesh, geometry, and simulation payloads (binary protobuf vs JSON)
- Codegen eliminates hand-written API client drift
- Streaming support for long-running enclosure generation and simulation jobs

## Codegen

- TypeScript client: generated via `protoc` or `connectrpc` tooling into `packages/proto`
- Python server: generated via `grpcio-tools` into `apps/compute`

## When REST Acceptable

Internal health checks and simple status endpoints may use REST. Anything carrying domain data uses gRPC.

---

# Testing

## Philosophy

Quality over coverage numbers. No coverage threshold enforced. Tests exist to catch real regressions, not to hit a metric.

## Colocated Unit and Component Tests

- Test file lives next to source: `Component.tsx` → `Component.test.tsx`
- Vitest + React Testing Library for component and unit tests
- Pytest for Python service tests, colocated in `apps/compute`

## End-to-End Tests

Playwright E2E covers critical user flows only:

- Create project
- Define form
- Generate enclosure
- Approve AI proposal

E2E tests live in `apps/web/e2e/` and run against a real environment.

## What Not To Do

- Do not write tests for impossible scenarios
- Do not test framework internals (Next.js, Prisma, React Flow)
- Do not add tests that duplicate type checking

---

# Git Workflow

## Git Flow

- `main` — production-ready, tagged releases
- `develop` — integration branch
- `feature/<scope>-<desc>` — feature work, merged to `develop`
- `release/<version>` — release prep, merged to `main` and `develop`
- `hotfix/<desc>` — emergency fixes off `main`

## Conventional Commits

Commit prefixes:

- `feat:` new feature
- `fix:` bug fix
- `chore:` tooling, deps, config
- `refactor:` code change that neither fixes a bug nor adds a feature
- `docs:` documentation only
- `test:` adding or correcting tests

Example: `feat: add module graph canvas`

## Branch Naming

`feature/<scope>-<desc>` — e.g. `feature/enclosure-gen-stl-export`

---

# Code Style Principles

- No comments unless the WHY is non-obvious (hidden constraint, subtle invariant, workaround for a specific bug). Never comment WHAT the code does.
- No features beyond what the task requires. No premature abstraction.
- No error handling for impossible scenarios. Trust framework guarantees. Validate only at system boundaries.
- No backwards-compatibility hacks for removed code.
- Prefer editing existing files over creating new ones.
- Never create documentation files unless explicitly asked.
- Follow existing patterns in the codebase. Mimic style, libraries, and conventions of neighboring code.
- Never assume a library is available. Check `package.json`, `pyproject.toml`, or neighboring files before importing.
- Never introduce code that exposes or logs secrets.
