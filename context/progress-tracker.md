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

**Status:** Done (100%)

## Tasks

- [x] Monorepo scaffold (Turborepo, `apps/web`, `apps/compute`, `packages`)
- [x] Next.js 16 + Prisma v7 + PostgreSQL setup (Docker)
- [x] Project model + Prisma schema + migrations
- [x] Project list + create + detail pages
  - shadcn/ui installed (button, input, card, label, dialog)
  - Workspace CRUD: list (/), create dialog, navigation
  - Project CRUD: list (/workspace/[id]), create dialog, detail (/projects/[id])
  - Server components for reads, server actions (Zod) for mutations
- [x] Form input: draw outline / upload sketch / describe shape
  - `/projects/[projectId]/form` — 3-tab workspace (Draw / Upload / Describe)
  - SVG polygon drawing canvas: click to add vertices, drag to move, close shape
  - Dimension inputs (W, H, D in mm)
  - Sketch upload placeholder (image preview, AI processing TBD)
  - Shape description textarea (Intent Agent integration TBD)
  - Server actions: createForm, updateForm with Zod validation
  - Data format: polygon points + curve hint metadata (JSONB), see architecture.md Form properties
  - Complete DB schema finalized (11 tables) and pushed to PostgreSQL
- [x] AI agents: OpenCode Go provider via @ai-sdk/openai-compatible (deepseek-v4-pro + flash)
- [x] AI SDK 6 agent skeletons (Intent, Module, Constraint, Circuit, Review) in packages/agents

## Relevant Context

- project.md — Form-First Workflow Step 1
- architecture.md — Project and Form domain model

## Notes

- Turborepo + pnpm workspaces monorepo with `apps/web` (Next.js 16.2.9), `apps/compute` (Python placeholder, uv), `packages/db`, `packages/agents`, `proto/`
- Biome 2.5.0 for TS lint/format, Turbo 2.9.18 for task orchestration
- Tailwind v4 + shadcn/ui, App Router, Turbopack
- PostgreSQL 17 Alpine via Docker Compose (port 54322) with pgAdmin UI (port 5050)
- Prisma v7 (ESM) with `@prisma/adapter-pg` driver adapter, client generated to `prisma/generated/`
- Prisma schema: 11 models (Workspace, Project, Form, Module, Component, Net, ModuleConnection, Constraint, Decision, AIProposal, Artifact) — pushed to DB, client regenerated
- AI agents defined in `packages/agents/`: Intent (pro), Module (flash), Constraint (pro), Circuit (pro), Review (flash) — AI SDK 6 ToolLoopAgent + Zod schemas
- OpenCode Go provider via @ai-sdk/openai-compatible: deepseek-v4-pro + deepseek-v4-flash
- Python compute service (`apps/compute/src/app/main.py`) with Dockerfile, uv package manager
- `docker-compose.yml` manages PostgreSQL + pgAdmin + compute service

---

# Phase 2 — Hardware Context Engine + Module Graph + Schematic

**Status:** Done (100%)

## Tasks

- [x] Module, Component, Net, Constraint, Decision Prisma models (graph nodes + edges)
- [x] Component schema: type (R, C, L, diode, transistor, IC, connector, source), value, tolerance, part number, footprint, pin definitions
- [x] Net schema: connections between component pins (within module) and module ports (across modules)
- [x] Module CRUD UI (add, move, edit modules)
  - `/projects/[projectId]/modules` — module list + React Flow graph canvas
  - CreateModuleDialog: name, type, ports (JSON), description
  - ModuleCard: display name, type, ports with direction, delete action
- [x] React Flow interactive graph — drag nodes to position (auto-save), edge connections
- [x] Component-level schematic — `/projects/[projectId]/components` — add components per module
  - Module selector (tab bar), component form (name, type, value, footprint, pins)
  - Component list with delete, per-module view
- [x] Constraint definition UI — `/projects/[projectId]/constraints`
  - Add constraint: domain (mechanical/electrical/manufacturing/assembly), priority, rule text
  - Constraint list with domain badges, delete
- [x] Decision log panel — shown on project detail page (conditional, when decisions exist)
  - Actor badge (ai/user), timestamp, decision text, reason
- [x] Project detail hub — links to Form, Modules, Components, Constraints + Decision Log preview

## Relevant Context

- project.md — Form-First Workflow Step 2, Step 4
- architecture.md — Hardware Context Graph (now includes Components, Nets), Domain Model (Module expanded)
- ai-workflow-rules.md — Rule 1 (respect the graph), Rule 6 (decision logging)

---

# Phase 3 — AI Assistant + Constraint Negotiation + Circuit Simulation

**Status:** In Progress (30%)

## Tasks

- [x] FastAPI compute service scaffold + gRPC contract
- [ ] ngspice / PySpice integration in `apps/compute`
- [ ] SPICE netlist generation from component + net graph
- [ ] Simulation gRPC service (submit job, stream progress, return results)
- [x] AI SDK 6 integration: Intent Agent, Module Agent, Constraint Agent, Circuit Agent
- [ ] Constraint negotiation engine (Python) — mechanical + electrical
- [ ] Waveform viewer UI (plot simulation results: voltage, current, power)
- [x] AI chat dock (free-form questions)
- [ ] Activity / Decisions feed + proposal Approve/Reject UI
- [ ] Risk-tier enforcement (low = auto, medium / high = proposal)

## Relevant Context

- project.md — AI Hardware Assistant, Circuit Simulator
- architecture.md — AI Layer (Intent, Module, Constraint, Circuit agents), Constraint Negotiation Engine
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
