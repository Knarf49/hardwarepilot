# Project Overview

## Project Name

**HardwarePilot** (working title)

---

## Vision

Enable creators to design electronics around the product they imagine, rather than forcing the product to adapt to a rectangular PCB.

HardwarePilot is a form-first hardware design platform that helps makers, hardware engineers, robotics developers, and students go from product idea to manufacturable hardware prototype.

Instead of starting with a PCB and designing a case afterward, users begin with the desired physical form, and the system helps generate an electronics architecture that fits the product.

---

## Product Category

**Generative Hardware Design Platform**

Not:

- PCB editor
- CAD replacement
- Enclosure generator only

HardwarePilot combines:

- Form-driven design
- AI hardware assistance
- PCB architecture planning
- Enclosure generation
- Circuit simulation (SPICE)
- Design validation

---

## Core Problem

Current electronics design tools force engineers to design around rectangular PCBs, even when the final product requires a completely different physical form.

Engineers must manually translate:

- Product shape
- Mechanical constraints
- User experience requirements

into:

- PCB layout
- Module placement
- Enclosure design

This translation process is slow, repetitive, and error-prone.

---

## Core Insight

A circuit is not a board.

A circuit is a collection of functional modules — each containing components
connected by nets. Functional modules reason at a high level (Power, MCU,
Sensor), while internal components (resistors, capacitors, ICs) and nets
enable circuit simulation and validation.

Example:

- Power
- MCU
- Sensor
- Display
- Battery
- Connectivity

AI should understand these modules independently and determine how they should be arranged to fit a desired form factor.

---

## Target Users

### Primary Users

#### Makers

Building:

- IoT devices
- Smart home products
- Custom keyboards
- Hobby electronics

Pain:

"I can build the electronics, but creating a product-ready enclosure takes too much time."

---

#### Engineering Students

Pain:

"I understand circuits but struggle with mechanical design and enclosure creation. I also need to validate my circuit before building — does this work?"

---

#### Indie Hardware Startups

Pain:

"We need to prototype products quickly without hiring separate electrical and mechanical engineers."

---

### Secondary Users

#### Embedded Engineers

Need rapid prototyping and early-stage product exploration.

#### Robotics Developers

Need hardware layouts that fit non-standard physical forms.

---

## Form-First Workflow

### Step 1 — Define Product Shape

User defines the desired physical form through one of three input methods:

- **Draw outline** → stored as polygon points + curve hints in the Form node (JSONB).
  User draws on canvas; system records closed polygon vertices with optional
  cubic/quadratic bezier hints per edge for organic shapes.
- **Upload sketch** → stored as image file reference (`storage/path`), with
  AI-derived outline (polygon points + curve hints) generated asynchronously
  and attached to the same Form node after processing.
- **Describe shape** → stored as natural language string. Intent Agent processes
  this in Step 2 to infer form constraints and suggest an initial outline.

All three inputs populate the Form node. The polygon points representation with
curve hints is the canonical shape format for downstream extrusion, validation,
and artifact generation.

Examples:

- Heart-shaped device
- Wearable sensor
- Smart toy
- Organic stone-like object

---

### Step 2 — AI Understands Electronics

The system breaks electronics into functional modules.

Example:

- Power subsystem
- MCU subsystem
- Sensor cluster
- Display subsystem
- Connectivity subsystem

---

### Step 3 — Generate Hardware Architectures

AI proposes multiple strategies.

#### Option A — Multi-Board Architecture

Several smaller boards connected through FPC or wiring.

Best for:

- Narrow shapes
- Highly organic designs

#### Option B — Organic Single PCB

One PCB with a custom outline matching the product shape.

Best for:

- Moderate complexity
- Lower manufacturing cost

#### Option C — Flex PCB Architecture

Flexible PCB folded around a three-dimensional structure.

Best for:

- Wearables
- Compact devices
- Complex forms

---

### Step 4 — Design & Simulate Electronics

Users define the internal schematic for each functional module:

- Add components (resistors, capacitors, ICs, transistors, connectors) inside modules
- Wire nets between component pins within and across modules
- Assign component values and part numbers
- Run SPICE simulation (transient, AC, DC sweep) on the full circuit
- View waveform results, probe voltages and currents at any net

AI validates:

- Clearance and routing feasibility
- Assembly and manufacturing constraints
- Electrical constraints (voltage range, current limits, power integrity)
- Circuit topology warnings (floating inputs, missing pull-ups, etc.)

---

### Step 5 — Interactive Refinement

Users can:

- Move modules
- Rotate modules
- Resize placement regions
- Adjust component placement within modules
- Re-run simulation after changes

AI validates:

- Clearance
- Routing feasibility
- Assembly constraints
- Manufacturing constraints

---

### Step 6 — Generate Product Assets

HardwarePilot synchronizes:

- PCB architecture
- Enclosure design
- Mounting systems
- BOM recommendations

Outputs:

- PCB concepts
- Enclosure concepts
- Manufacturing-ready assets

---

## MVP Scope

### Hardware Context Engine

Extract and maintain:

- Functional modules
- Mechanical constraints
- Physical dimensions
- Connectivity relationships

This becomes the foundation for all AI capabilities.

---

### AI Hardware Assistant

Users can ask:

- Can this fit in a wearable enclosure?
- Where should the battery go?
- Which architecture is best for this shape?
- Are there manufacturing risks?

---

### AI Enclosure Generator

Generate:

- Mounting points
- Cutouts
- Internal supports
- Battery compartments
- Ventilation features

Export:

- STL

Future:

- STEP

---

### Circuit Simulator

Component-level schematic within each functional module:

- Add/remove components: resistors, capacitors, inductors, diodes, transistors, ICs, connectors, voltage sources
- Wire nets between component pins (within module and across module boundaries)
- Assign component values, tolerances, part numbers, footprints
- Simulation types: DC operating point, DC sweep, AC small-signal, transient
- Waveform viewer: plot voltages and currents, probe any net or component pin
- Simulation engine: ngspice / PySpice running in `apps/compute`

AI assistance for circuit design:

- Suggest component values based on module requirements
- Detect circuit topology issues (floating nodes, missing pull-ups, backward diodes)
- Validate against module constraints (voltage range, current budget, power dissipation)
- Auto-generate netlist for simulation from graph state

Outputs:

- SPICE netlist (derived from graph, always regenerable)
- Simulation results (waveform data, operating point tables)
- Circuit validation report (warnings, errors, suggestions)

---

### Design Review

Detect:

- Accessibility issues
- Clearance problems
- Enclosure collisions
- Manufacturing concerns

---

## Out of Scope (MVP)

- Full schematic editor (hierarchical sheets, ERC, net classes, bus routing — MVP has component-level schematic within modules only)
- Full PCB editor (trace routing, copper pours, DRC)
- Full CAD replacement (parametric modeling, assemblies, drawings)
- Firmware IDE
- Manufacturing marketplace

---

## Success Metrics

### User Value

- Reduced prototype iteration time (simulate before building)
- Faster enclosure creation
- Better hardware design decisions
- Fewer design errors caught after manufacturing (catch in simulation first)
- Validated circuits that work on first prototype

### Product Metrics

- Weekly active projects
- Generated hardware architectures
- Generated enclosures
- Simulation runs per project
- AI interactions per project

### Business Metrics

- Free-to-paid conversion
- Monthly recurring revenue
- User retention

---

## Long-Term Vision

HardwarePilot becomes the AI-native operating system for hardware product creation.

Users describe:

- What they want to build
- What shape it should take

The platform determines:

- Electronics architecture
- Component selection and circuit topology
- PCB strategy
- Enclosure design
- Manufacturing considerations

The platform validates:

- Circuit behavior through SPICE simulation
- Mechanical fit through 3D analysis
- Manufacturability through DFM rules

allowing creators to focus on product ideas rather than toolchain complexity.
