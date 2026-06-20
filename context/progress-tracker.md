# Progress Tracker

## Status Legend

- `[ ]` Not Started
- `[~]` In Progress
- `[x]` Done

Phase status: Not Started / In Progress / Done + percent complete.

---

# Phase 0 — Foundation & Context

**Status:** Done (100%)

## Tasks

- [x] project.md — vision, product category, target users, MVP scope
- [x] architecture.md — Hardware Context Graph, invariants, domain model, AI layer
- [x] ai-workflow-rules.md — 15 rules for AI behavior
- [x] ui-context.md — visual personality, surface model, interaction patterns
- [x] code-standards.md — tech stack, conventions, workflow
- [x] progress-tracker.md — this file

## Notes

Vision, architecture, AI rules, UI language, code standards, and tracker defined. Ready to scaffold.

---

# Phase 1 — Project CRUD + Form Input

**Status:** In Progress (60%)

## Tasks

- [x] Monorepo scaffold (Turborepo, `apps/web`, `apps/compute`, `packages`)
- [x] Next.js 16 + Prisma v7 + PostgreSQL setup (Docker)
- [x] Project model + Prisma schema + migrations
- [ ] Project list + create + detail pages
- [ ] Form input: draw outline / upload sketch / describe shape
  - Data format: polygon points + curve hint metadata (JSONB), see architecture.md Form properties

## Relevant Context

- project.md — Form-First Workflow Step 1
- architecture.md — Project and Form domain model

## Notes

- Turborepo + pnpm workspaces monorepo with `apps/web` (Next.js 16.2.9), `apps/compute` (Python placeholder, uv), `packages/db`, `packages/agents`, `proto/`
- Biome 2.5.0 for TS lint/format, Turbo 2.9.18 for task orchestration
- Tailwind v4 + shadcn/ui, App Router, Turbopack
- PostgreSQL 17 Alpine via Docker Compose (port 54322) with pgAdmin UI (port 5050)
- Prisma v7 (ESM) with `@prisma/adapter-pg` driver adapter, client generated to `prisma/generated/`
- Project model (id, name, description, createdAt, updatedAt) pushed to DB
- Python compute service (`apps/compute/src/app/main.py`) with Dockerfile, uv package manager
- `docker-compose.yml` manages PostgreSQL + pgAdmin + compute service

---

# Phase 2 — Hardware Context Engine + Module Graph

**Status:** Not Started (0%)

## Tasks

- [ ] Module, Constraint, Decision Prisma models (graph nodes + edges)
- [ ] React Flow module graph canvas
- [ ] Module CRUD UI (add, move, edit modules)
- [ ] Constraint definition UI
- [ ] Decision log panel

## Relevant Context

- architecture.md — Hardware Context Graph, Domain Model
- ai-workflow-rules.md — Rule 1 (respect the graph), Rule 6 (decision logging)

---

# Phase 3 — AI Hardware Assistant + Constraint Negotiation

**Status:** Not Started (0%)

## Tasks

- [ ] FastAPI compute service scaffold + gRPC contract
- [ ] AI SDK 6 integration: Intent Agent, Module Agent, Constraint Agent
- [ ] Constraint negotiation engine (Python)
- [ ] AI chat dock (free-form questions)
- [ ] Activity / Decisions feed + proposal Approve/Reject UI
- [ ] Risk-tier enforcement (low = auto, medium / high = proposal)

## Relevant Context

- project.md — AI Hardware Assistant
- architecture.md — AI Layer (Intent, Module, Constraint agents)
- ai-workflow-rules.md — Rule 3 (explain decisions), Rule 5 (risk tiers), Rule 8 (specialized agents)

---

# Phase 4 — AI Enclosure Generator + 3D

**Status:** Not Started (0%)

## Tasks

- [ ] Three.js + React Three Fiber 3D preview workspace
- [ ] Python enclosure generation (mesh from form + modules)
- [ ] Enclosure Agent implementation
- [ ] STL export
- [ ] Mounting, cutouts, internal supports generation

## Relevant Context

- project.md — AI Enclosure Generator
- architecture.md — Enclosure Agent, Output Strategy

---

# Phase 5 — Design Review

**Status:** Not Started (0%)

## Tasks

- [ ] Review Agent implementation
- [ ] Design review workspace (accessibility, clearance, manufacturing, assembly)
- [ ] Warning and report UI in activity feed
- [ ] Manufacturing safety wording enforcement (no "production-ready" unless validated)

## Relevant Context

- project.md — Design Review
- ai-workflow-rules.md — Rule 13 (manufacturing safety)

---

# Post-MVP — Future Extensions

**Status:** Not Started

Tracked as backlog, not phased. Revisit when MVP complete.

- [ ] KiCad import workflow
- [ ] STEP export
- [ ] BOM optimization
- [ ] Manufacturing cost estimation
- [ ] Flex PCB design
- [ ] Automated routing
- [ ] Supplier selection
- [ ] Simulation
- [ ] DFM validation

## Relevant Context

- architecture.md — Future Extensions, Output Strategy (experimental outputs)

---

# Update Protocol

Agent-owned.

After completing a task, the AI updates this file:

- Flip the checkbox (`[ ]` → `[~]` when starting, `[~]` → `[x]` when done)
- Recompute phase percent complete
- Update phase status header
- Commit the change with a `chore:` or `feat:` commit per code-standards.md

The user reviews tracker state at session boundaries. If the user disagrees with a status, the user corrects it directly.

Decisions and learnings discovered during a phase are noted inline under that phase's Notes section when they affect future work.
