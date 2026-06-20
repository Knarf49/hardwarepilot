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

Top-level container.

Stores:

- Metadata
- Ownership
- Project settings
- Version history

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

## Artifacts

Generated outputs.

Examples:

- STL
- STEP
- BOM
- PCB Drafts
- Manufacturing Reports
- SPICE Netlist (derived from component + net graph, always regenerable)
- Simulation Results (waveform data, operating point tables)

Artifacts are derived from the graph.

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
- OpenAI APIs

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
