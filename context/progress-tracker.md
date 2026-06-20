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

**Status:** Done (100%)

## Tasks

- [x] FastAPI compute service scaffold + gRPC contract
- [x] SPICE netlist generation from component + net graph (Python + TypeScript)
- [x] Circuit simulation engine — numpy MNA DC solver (Python) + TS port (chat tools)
- [x] Simulation gRPC service (submit job, stream progress, return results)
- [x] AI SDK 6 integration: Intent Agent, Module Agent, Constraint Agent, Circuit Agent
- [x] Constraint negotiation engine (Python) — mechanical + electrical + manufacturing
- [x] Waveform viewer UI (plot simulation results: voltage, current, power)
- [x] AI chat dock (free-form questions)
- [x] Activity / Decisions feed + proposal Approve/Reject UI
- [x] Risk-tier enforcement (low = auto, medium / high = proposal)

## Relevant Context

- project.md — AI Hardware Assistant, Circuit Simulator
- architecture.md — AI Layer (Intent, Module, Constraint, Circuit agents), Constraint Negotiation Engine
- ai-workflow-rules.md — Rule 3 (explain decisions), Rule 5 (risk tiers), Rule 8 (specialized agents)

## Notes

- Chat route migrated LangChain → AI SDK 6 native tool calling (`streamText` + `tool()` + `convertToModelMessages` + `toUIMessageStreamResponse`). Dropped `@langchain/core`, `@langchain/openai`, `langchain` deps (-24 pkgs). Eliminated XML regex tag hack that caused `<getProjectState>` leak in user-facing responses.
- 5 chat tools verified end-to-end against real DB + real project UUID: `getProjectState`, `createModule`, `createComponent`, `addConstraint`, `generateNetlist`.
- `ChatDock` reads `projectId` from URL via `usePathname` (`/projects/<uuid>/...` regex extract) — root layout renders one dock, project context auto-detected.
- Fix: `stopWhen: stepCountIs(5)` on `streamText` — AI SDK 6 default `stepCountIs(1)` stopped loop after tool call, no text summary step, empty assistant bubble.
- Fix: `justLoadedRef` guard in ChatDock save effect — `setMessages(loadedMsgs)` triggered re-save of loaded assistant messages → duplicate rows in DB. Cleaned 12 existing dup rows via throwaway script.
- `DATABASE_URL` documented in `AGENTS.md`: lives in `apps/web/.env.local` (dev) + hardcoded in `apps/web/vitest.config.ts` `test.env` (Vitest doesn't load `.env.local`). Update both if DB port/password changes.
- SPICE netlist generator (`apps/compute/src/app/netlist.py`): maps Component + Net proto messages to valid SPICE syntax. Node assignment from net connections, component type → prefix mapping (R/C/L/D/Q/V/I/X), model hints for diodes/transistors.
- numpy MNA DC solver (`apps/compute/src/app/simulator.py`): Modified Nodal Analysis for linear circuits (resistors, independent V/I sources). Solves conductance matrix + source vector via `numpy.linalg.solve`. Returns node voltages + branch currents. AC/TRAN stubbed (needs ngspice).
- Constraint checker (`apps/compute/src/app/constraints.py`): mechanical overlap detection, enclosure boundary fit, electrical voltage mismatch, manufacturing clearance, power budget estimation. Returns structured Conflict objects with severity/recommendation/alternatives.
- gRPC service wired: `RunSimulation` (streaming DC results), `GenerateNetlist` (real SPICE), `CheckConstraints` (conflict detection). All 17 tests pass (unit + integration).
- REST bridge endpoints (`apps/compute/src/app/main.py`): `/simulate`, `/netlist`, `/check-constraints` — JSON wrappers around gRPC logic. Web app optionally calls compute service if `COMPUTE_SERVICE_URL` env var set.
- chat-tools.ts extended: `generateNetlist` now generates proper SPICE with node mapping from Net connections. New tools: `createNet`, `simulateCircuit` (local MNA solver with compute service fallback). SimulateCircuit includes Gaussian elimination MNA solver in TypeScript (no external deps).
- Simulation page UI (`/projects/[projectId]/simulation`): DC op-point bar chart + SPICE netlist display. WaveformViewer component (`waveform-viewer.tsx`): SVG line chart for transient/AC, bar chart for DC. Added simulation link to project detail hub.

---

# Phase 4 — AI Enclosure Generator + 3D

**Status:** Done (100%)

## Tasks

- [x] Three.js + React Three Fiber 3D preview workspace
- [x] Python enclosure generation (mesh from form + modules)
- [x] Enclosure Agent implementation
- [x] STL export (binary STL via numpy)
- [x] Mounting, cutouts, internal supports generation

## Relevant Context

- project.md — AI Enclosure Generator
- architecture.md — Enclosure Agent, Output Strategy

## Notes

- Three.js + @react-three/fiber + @react-three/drei installed in apps/web
- Enclosure3D component: R3F Canvas with OrbitControls, enclosure walls extrusion from form polygon, module placement blocks with name labels, grid helper
- Enclosure page at `/projects/[id]/enclosure`: 3D viewer + stats panel + STL download (when compute service available)
- Python enclosure module (`apps/compute/src/app/enclosure.py`): CCW-ordered polygon extrusion with wall thickness, convex hull mounting holes, binary STL export with face normals
- REST endpoint `/enclosure/generate` returns mesh + base64 STL
- Enclosure Agent (`packages/agents/src/agents/enclosure.ts`): ToolLoopAgent with pro model, determines strategy (single/multi/flex), mounting points, cutouts

---

# Phase 5 — Design Review

**Status:** Done (100%)

## Tasks

- [x] Review Agent exists (from Phase 3), now wired via review-engine.ts
- [x] Design review page at `/projects/[id]/review` — AI-powered accessibility, clearance, manufacturing
- [x] ReviewReport component: overall score badge, categorized issue blocks with severity icons
- [x] Manufacturing safety wording enforcement in risk-enforcement.ts (Rule 13)

## Relevant Context

- project.md — Design Review
- ai-workflow-rules.md — Rule 13 (manufacturing safety)

## Notes

- review-engine.ts: calls `generateObject` with ReviewSchema, project context (form/modules/components/constraints/decisions) → structured review. Uses flash model for speed. Post-processes output to enforce Rule 13 (replaces "production-ready" → "ready for prototyping review", etc.)
- risk-enforcement.ts: `sanitizeManufacturingText()` scans for 9 disallowed phrases, replaces with conservative alternatives. Returns warnings for transparency.
- ReviewReport component: score banner with pass/pass_with_warnings/fail, collapsible issue categories (Eye/Ruler/Wrench icons), severity-colored borders (red/amber/blue), actionable recommendations

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
