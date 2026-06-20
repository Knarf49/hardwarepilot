# Architecture

## Purpose

HardwarePilot is a Form-First Hardware Design Platform.

The system enables users to describe a product they want to build, define the desired physical form, and collaboratively work with AI to generate electronics architectures, enclosure designs, and manufacturing assets.

The architecture is designed around a Hardware Context Graph rather than PCB files or CAD files.

---

# Architectural Principle

HardwarePilot is not:

- A PCB editor
- A CAD replacement
- An AI chat wrapper

HardwarePilot is a Hardware Context Graph platform where form, electronics (including circuit-level simulation), and manufacturing constraints negotiate continuously, and all generated artifacts — from SPICE netlists to STL files — are derived from that graph.

---

# Core Invariants

## Invariant #1

The Hardware Context Graph is the source of truth.

The following are derived artifacts:

- SPICE netlists
- Simulation results
- PCB layouts
- STL files
- STEP files
- BOM exports
- Gerber files
- AI-generated outputs

The graph always remains authoritative.

---

## Invariant #2

Form, Electronics, and Manufacturing are equal domains.

The system must never assume:

- Form always wins
- Electronics always win
- Manufacturing always wins

The platform exists to negotiate tradeoffs between these domains.

---

## Invariant #3

Every AI decision must be explainable.

All AI-generated changes must include:

- Reasoning
- Constraints involved
- Alternatives considered

Example:

Battery moved because:
- USB accessibility conflict
- Internal clearance issue
- Better manufacturing feasibility

---

## Invariant #4

Users always own the design.

Users may:

- Override AI decisions
- Edit modules
- Edit constraints
- Modify generated layouts

AI assists but never becomes the source of truth.

---

## Invariant #5

Generated assets are disposable.

Generated assets can always be regenerated from the Hardware Context Graph.

No generated file should contain information that exists only inside that file.

---

# High-Level System Architecture

User Intent
↓
Hardware Context Graph
↓
Constraint Negotiation Engine
↓
Generation Services
↓
Manufacturing Assets

The Hardware Context Graph sits at the center of the system.

Everything reads from and writes to the graph.

---

# Project Structure

A workspace contains multiple projects.

Workspace
├─ Project A
├─ Project B
└─ Project C

Each project maintains:

- Form
- Modules
- Constraints
- Decisions
- Generated Assets
- AI Memory

---

# Domain Model

## Project

Top-level container for a hardware design.

Stores:

- Metadata (name, description)
- Ownership (workspaceId)
- Created/updated timestamps

Projects are organized under Workspaces. All domain entities (Form, Module,
Constraint, Decision, Artifact) belong to a single Project.

Enclosure is **not** a standalone entity. It is an Artifact of type `stl`,
generated from Form. See Artifacts section.

---

## Form

Represents the desired physical product.

Examples:

- Heart shape
- Smart ring
- Wearable sensor
- Toy
- Handheld device

Properties:

- Shape definition: polygon points + curve hint metadata
  Stored as JSONB. Closed polygon vertices as `{ x, y }[]`. Optional curve hints
  per edge: `{ type: "cubic" | "quadratic", cp1?: { x, y }, cp2?: { x, y } }`.
  Straight edges omit the curve hint (linear interpolation default). Bezier
  control points stored in absolute coordinates relative to the polygon origin.
  SVG path strings are derived render output, never the source of truth.
- Dimensions (bounding box W x H x D in mm)
- User interaction zones (sub-regions on the form surface: buttons, screens, ports)
- Mechanical requirements (mounting points, clearances, material constraints)

---

## Module

A functional electronics block composed of components and nets.

Examples:

- Power
- MCU
- Sensor Cluster
- Display
- Connectivity
- Battery

Modules contain:

- **Components**: discrete parts (resistors, capacitors, ICs, transistors, connectors)
  with values, tolerances, part numbers, and footprints
- **Nets**: wire connections between component pins, within the module and across
  module boundaries (via module ports)
- **Ports**: external connection points exposed by the module (I2C, SPI, power, GPIO)

Modules are independent from PCB layouts.

The system reasons about modules before boards, and components within modules
before traces.

### Database Schema

```
Module
├─ id            UUID PK
├─ projectId     UUID FK → Project
├─ formId        UUID FK → Form (nullable — module created before placement)
├─ name          VARCHAR        "Power", "MCU"
├─ type          VARCHAR        power | mcu | sensor | display | battery
│                               connectivity | storage | actuator | custom
├─ description   TEXT (nullable)
├─ ports         JSONB          [{ portId, name, direction, protocol?, voltage? }]
├─ position      JSONB (nullable)  { x, y, z }  mm from form origin
├─ rotation      JSONB (nullable)  { x, y, z }  degrees
├─ dimension     JSONB          { w, h, d }  mm
├─ spanning      JSONB (nullable)  [{ x, y }]  poly region on form surface
├─ status        VARCHAR        proposed | placed | validated | rejected
├─ createdAt     TIMESTAMP
└─ updatedAt     TIMESTAMP
```

Relationships:

- `components: Component[]` — one-to-many
- `nets: Net[]` — one-to-many
- `constraints: Constraint[]` — constraints targeting this module
- `connectionsFrom: ModuleConnection[]` — outgoing edges
- `connectionsTo: ModuleConnection[]` — incoming edges

JSONB examples:

```jsonc
// ports
[
  { "portId": "p1", "name": "I2C_SCL", "direction": "bidirectional", "protocol": "I2C" },
  { "portId": "p2", "name": "I2C_SDA", "direction": "bidirectional", "protocol": "I2C" },
  { "portId": "p3", "name": "3V3_OUT", "direction": "out", "protocol": "power", "voltage": 3.3 },
  { "portId": "p4", "name": "GND", "direction": "bidirectional", "protocol": "power" },
  { "portId": "p5", "name": "GPIO0", "direction": "bidirectional", "protocol": "gpio" }
]
// position
{ "x": 100, "y": 50, "z": 0 }
// rotation
{ "x": 0, "y": 0, "z": 45 }
// dimension
{ "w": 30, "h": 20, "d": 5 }
// spanning
[{ "x": 0, "y": 0 }, { "x": 30, "y": 0 }, { "x": 30, "y": 20 }, { "x": 0, "y": 20 }]
```

---

## Constraints

Represents design requirements.

Examples:

- Battery must fit
- USB must remain accessible
- OLED must be visible
- Buttons must be reachable
- Voltage rail must stay within 5% tolerance
- MCU I/O pins must not exceed rated current
- Power dissipation must stay within thermal budget

Constraints are evaluated continuously.

---

## Decisions

Stores architectural decisions.

Example:

Decision:
Use multi-board architecture

Reason:
Battery size conflicts with enclosure shape

Alternatives:
- Larger enclosure
- Smaller battery
- Flex PCB

Decisions become long-term project memory.

---

## Component

A discrete electronic part within a Module.

Examples:

- R1 (10kΩ resistor, 0805)
- C3 (100nF capacitor, 0603)
- U1 (ESP32-WROOM-32E IC, QFN-48)
- Q1 (2N2222 NPN transistor, TO-92)
- J1 (USB-C connector, through-hole)

Components contain pins (stored as JSONB), values, tolerances, part numbers,
and footprints. Components are wired together via Nets.

---

## Net

A named electrical connection between component pins.

A Net connects one or more component pins within a module, and may cross module
boundaries via module ports (referenced in the connections array alongside
component pin references).

Examples:

- NET_VCC (connects R1.pin1, U1.VCC, J1.VCC)
- I2C_SCL (connects U1.pin12, J1.pin5, modulePort "p1")

Nets are the primary input for SPICE netlist generation.

---

## ModuleConnection

An edge in the Hardware Context Graph connecting two module ports.

Represents the relationship between functional modules:

- **electrical**: I2C bus, SPI bus, power rail
- **mechanical**: physical adjacency or shared mounting
- **placement**: co-location requirement
- **manufacturing**: shared assembly step

Example:

MCU.I2C_SCL → Sensor.I2C_SCL (electrical, bidirectional, I2C)

---

## AIProposal

A suggestion from the AI layer requiring user action.

Tracks the lifecycle of AI-initiated changes:

- `pending`: awaiting user decision
- `approved`: user accepted, pending application
- `rejected`: user declined
- `applied`: change has been committed to the graph

Each proposal records which agent generated it, the risk tier (low/medium/high),
and which graph nodes would be affected. Low-risk proposals may auto-apply
(skip pending state) per Rule 5.

---

## Artifacts

Generated outputs — all derived from the Hardware Context Graph, all disposable
(Invariant #5).

Unified under a single Artifact table with a `type` discriminator:

| Type | Description | FK |
|------|-------------|----|
| `stl` | Enclosure mesh (3D printable) | formId |
| `step` | Enclosure CAD (future) | formId |
| `bom` | Bill of materials | projectId |
| `spice_netlist` | Generated SPICE netlist | moduleId |
| `sim_result` | Waveform data, operating point tables | moduleId |
| `pcb_draft` | PCB layout draft | formId |
| `manufacturing_report` | DFM/DFA report | projectId |

Enclosure is `type: "stl"` with `formId` FK — generated from Form polygon data,
always regenerable. No separate Enclosure table.

Each Artifact is versioned (`version` field, integer, starts at 1). Previous
versions are never overwritten (Rule 11).

---

# Database Schema

Complete PostgreSQL schema for the Hardware Context Graph. All tables use
UUID primary keys and Prisma v7 conventions (camelCase, `@id @default(uuid())`).

## Tables

```
Table Workspace {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime
  updatedAt DateTime
}

Table Project {
  id          String   @id @default(uuid())
  workspaceId String
  name        String
  description String?
  createdAt   DateTime
  updatedAt   DateTime
}

Table Form {
  id               String   @id @default(uuid())
  projectId        String
  polygon          Json     // { vertices: {x,y}[], edges?: [{index, curve?:{type,cp1,cp2}}] }
  dimension        Json     // { w, h, d }  mm
  interactionZones Json?    // [{ name, type, vertices: {x,y}[] }]
  requirements     String?  // mechanical requirements text
  createdAt        DateTime
  updatedAt        DateTime
}

Table Module {
  id          String   @id @default(uuid())
  projectId   String
  formId      String?  // null until placed on form
  name        String
  type        String   // power | mcu | sensor | display | battery | connectivity | storage | actuator | custom
  description String?
  ports       Json     // [{ portId, name, direction: "in"|"out"|"bidirectional", protocol?, voltage? }]
  position    Json?    // { x, y, z }  mm from form origin
  rotation    Json?    // { x, y, z }  degrees
  dimension   Json     // { w, h, d }  mm
  spanning    Json?    // [{ x, y }]  poly region on form surface
  status      String   // proposed | placed | validated | rejected
  createdAt   DateTime
  updatedAt   DateTime
}

Table Component {
  id        String   @id @default(uuid())
  moduleId  String
  type      String   // resistor | capacitor | inductor | diode | transistor | ic | connector | voltage_source | current_source | custom
  name      String   // "R1", "C3", "U1", "J2"
  value     String?  // "10k", "100nF", "ESP32-WROOM"
  tolerance String?  // "5%", "±10%"
  partNumber String?
  footprint String?  // "0805", "SOIC-8"
  pins      Json     // [{ pinId, name, number? }]
  position  Json?    // { x, y }  within module canvas
  rotation  Json?    // { z }  degrees
  createdAt DateTime
  updatedAt DateTime
}

Table Net {
  id          String   @id @default(uuid())
  moduleId    String
  projectId   String
  name        String   // "NET_VCC", "I2C_SCL"
  connections Json     // [{ componentId, pinId } | { modulePort: "portId" }]
  createdAt   DateTime
  updatedAt   DateTime
}

Table ModuleConnection {
  id              String   @id @default(uuid())
  projectId       String
  sourceModuleId  String
  targetModuleId  String
  sourcePortId    String
  targetPortId    String
  type            String   // electrical | mechanical | placement | manufacturing
  createdAt       DateTime
  updatedAt       DateTime
}

Table Constraint {
  id        String   @id @default(uuid())
  projectId String
  moduleId  String?  // null = project-level constraint
  domain    String   // mechanical | electrical | manufacturing | assembly
  rule      String   // "Battery must fit within enclosure"
  expression Json?   // { op, left, right }  machine-readable
  priority  String   // must | should | may
  createdAt DateTime
  updatedAt DateTime
}

Table Decision {
  id               String   @id @default(uuid())
  projectId        String
  actor            String   // ai | user
  decision         String
  reason           String
  tradeoffs        String?
  alternatives     Json?    // ["option A", "option B"]
  affectedNodeType String?  // module | form | component
  affectedNodeId   String?
  createdAt        DateTime
}

Table AIProposal {
  id            String   @id @default(uuid())
  projectId     String
  agentType     String   // intent | module | constraint | circuit | enclosure | review
  riskTier      String   // low | medium | high
  title         String
  description   String
  reason        String
  tradeoffs     String?
  alternatives  Json?
  affectedNodes Json?    // [{ type: "module", id: "..." }, ...]
  status        String   // pending | approved | rejected | applied
  createdAt     DateTime
  updatedAt     DateTime
}

Table Artifact {
  id        String   @id @default(uuid())
  projectId String
  formId    String?  // null unless type in (stl, step, pcb_draft)
  moduleId  String?  // null unless type in (spice_netlist, sim_result)
  type      String   // stl | step | bom | spice_netlist | sim_result | pcb_draft | manufacturing_report
  name      String   // "Enclosure v1", "SPICE Netlist Rev 2"
  filePath  String?  // storage path
  metadata  Json?    // per-type extra data
  version   Int      @default(1)
  createdAt DateTime
  updatedAt DateTime
}
```

## Relationships

```
Workspace  1──N  Project
Project   1──N  Form
Project   1──N  Module
Project   1──N  ModuleConnection
Project   1──N  Constraint
Project   1──N  Decision
Project   1──N  AIProposal
Project   1──N  Artifact
Module    1──N  Component
Module    1──N  Net
Form      1──N  Artifact   (via formId — stl, step, pcb_draft)
Module    1──N  Artifact   (via moduleId — spice_netlist, sim_result)
```

## Key Design Decisions

1. **No Enclosure table** — Enclosure is an Artifact (`type: "stl"`, `formId` FK).
   Generated from Form polygon data, always regenerable (Invariant #5).
2. **JSONB for nested structures** — ports, position, rotation, dimension,
   spanning, pins, connections, polygon — all use PostgreSQL JSONB via
   Prisma `Json` type. Validated by Zod on write (code-standards.md).
3. **Artifact discriminator** — single table for all generated outputs with
   `type` enum. Adding a new output type = new enum value, not new table.
4. **Nullable FKs in Artifact** — `formId` and `moduleId` populated
   conditionally based on artifact type. Enforced at application level.
5. **Module.fromId nullable** — modules are defined before placement.
   Module can exist without being assigned to a form region.
6. **Net spans modules** — `connections` array can reference both component
   pins and module ports, enabling cross-module net definitions for SPICE.

---

# Hardware Context Graph

The Hardware Context Graph is the system's primary data model.

Nodes:

- Form
- Modules (containing Components and Nets)
- Components (resistors, capacitors, ICs, transistors — sub-nodes within Modules)
- Constraints
- Decisions
- Manufacturing Rules

Edges:

- Electrical relationships (module port connections, net-to-pin connections)
- Mechanical relationships
- Placement relationships
- Manufacturing dependencies

The graph must remain editable by both users and AI.

---

# Constraint Negotiation Engine

The Constraint Negotiation Engine is the core business logic.

Inputs:

- Form
- Modules (with component and net data)
- Constraints (mechanical + electrical)
- Manufacturing Rules

Outputs:

- Recommendations
- Warnings
- Tradeoffs
- Layout strategies

Example:

User requests:
Heart-shaped enclosure

System detects:
Battery too large

Options:
1. Increase enclosure size
2. Reduce battery size
3. Split architecture into multiple boards

The engine presents options instead of silently choosing.

---

# AI Layer

The AI system is composed of specialized responsibilities.

## Intent Agent

Converts user goals into structured requirements.

Example:

"Build a heart-shaped ESP32 gift"

becomes:

- ESP32
- Battery powered
- Handheld
- Heart-shaped enclosure

---

## Module Agent

Identifies and organizes functional modules.

Example:

- Power
- MCU
- Display
- Sensor

---

## Constraint Agent

Evaluates conflicts between:

- Form
- Electronics
- Manufacturing

---

## Enclosure Agent

Generates:

- STL
- STEP
- Mounting systems
- Cutouts
- Internal structures

---

## Review Agent

Detects:

- Accessibility issues
- Clearance issues
- Manufacturing risks
- Assembly risks

---

## Circuit Agent

Responsible for:

- Suggesting component values based on module requirements
- Detecting circuit topology issues (floating nodes, missing pull-ups, reversed diodes)
- Validating electrical constraints (voltage range, current budget, power dissipation)
- Auto-generating SPICE netlist from component + net graph state
- Interpreting simulation results and surfacing warnings

Output:

- Component recommendations
- Topology warnings
- Simulation-ready netlist
- Post-simulation validation report

---

# Browser Editor

HardwarePilot is not a full CAD environment.

The browser editor focuses on:

- Modules and their internal components
- Component placement within modules
- Net wiring between component pins
- Regions and placement on form
- Constraints (mechanical + electrical)
- Relationships (module port connections, net-to-pin connections)

Users interact with design intent rather than geometry.

Example:

Move Battery Module

instead of

Edit Mesh Vertices

---

# Input Sources

## Idea-First Workflow

User starts with:

- Natural language
- Sketch
- Shape definition

AI creates the initial graph.

---

## Import Workflow

User imports:

- KiCad projects
- PCB files
- BOM data

HardwarePilot converts imported data into the Hardware Context Graph.

Imported files never become the source of truth.

---

# Output Strategy

Supported Outputs:

- STL
- STEP
- BOM
- SPICE Netlist
- Simulation Results (waveform plots, operating point data)
- Architecture Reports
- Design Reviews

Experimental Outputs:

- KiCad Drafts
- PCB Layout Drafts
- Gerber Drafts

Generated electronics should never be represented as manufacturing-ready unless validated.

---

# Storage Architecture

Frontend:
- Next.js
- TypeScript
- React

Backend:
- Next.js API Routes

Database:
- PostgreSQL
- PostgreSQL (Docker)

Graph Storage:
- Hardware Context Graph tables

File Storage:
- Generated assets
- User uploads

AI:
- AI SDK 6 (ToolLoopAgent)
- OpenCode Go provider via @ai-sdk/openai-compatible
  - Base URL: https://opencode.ai/zen/go/v1
  - Pro model: deepseek-v4-pro (Intent, Constraint, Circuit agents)
  - Flash model: deepseek-v4-flash (Module, Review agents)
  - API key: OPENCODE_API_KEY

Simulation:
- ngspice / PySpice (runs in apps/compute)

Visualization:
- React Flow
- Three.js
- React Three Fiber

---

# Future Extensions

Future capabilities should build on the Hardware Context Graph.

Examples:

- BOM Optimization
- Manufacturing Cost Estimation
- Flex PCB Design
- Automated Routing
- Supplier Selection
- DFM Validation

No feature should bypass the Hardware Context Graph.

---

# Architectural North Star

The Hardware Context Graph is the permanent representation of user intent — from
product shape down to component pin connections.

Everything else — STL, BOM, SPICE netlist, simulation results, PCB drafts —
is generated from it.
