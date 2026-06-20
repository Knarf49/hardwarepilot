# UI Context

## Visual Personality

HardwarePilot is a **creative studio** tool, not a CAD tool and not a toy.

The interface should feel calm, spacious, and tasteful. Smooth motion. Subtle gradients. A design tool for creative people who also do hardware.

This personality matches the form-first ethos: users start with imagination and shape, not constraint and grid.

---

# Platform Target

Desktop-only web.

Optimize for large screens, minimum 1280px wide.

No mobile. No touch editing. No responsive down-scaling.

The editor assumes a pointer, a keyboard, and screen real estate for canvas + panels.

---

# Surface Model

HardwarePilot uses **workspace tabs**. Each primary surface is a full-screen workspace. Users switch via top navigation.

## Workspaces

- **Form** — Define product shape (draw outline, upload sketch, describe shape)
- **Module Graph** — React Flow canvas of functional modules and their relationships
- **3D Preview** — Three.js viewport of generated enclosure and module placement
- **Review** — Design review surface (accessibility, clearance, manufacturing, assembly)

## AI Chat Dock

AI chat is a **floating dock** available across all workspaces.

The dock is summonable (not always visible) so it never competes with the active workspace for focus. When open, it overlays the current workspace without navigating away.

---

# Color System

## Theme

Dual theme support. **Dark is the default.** Users can toggle to light.

## Dark Theme

- Background: deep neutral charcoal, near-black but not pure `#000000`
- Surface: slightly lifted neutral for panels and cards
- Text: muted scale (primary high-contrast, secondary lower-contrast, tertiary faint)
- Border: subtle, low-contrast

## Light Theme

- Background: off-white warm gray
- Surface: pure white or near-white lifted
- Text: dark neutral scale
- Border: subtle warm gray

## Accent

Single accent color: **electric violet**, approximately `#7C5CFC` range.

The accent is reserved for:

- Primary actions (buttons, confirm)
- AI signals (agent activity, proposal highlights)
- Selection and focus states
- Active workspace tab indicator

The accent must **never** be used for decoration, generic styling, or large filled areas.

Implementation should define a full scale (50 through 900) for hover, active, and disabled states. Exact values picked at implementation time, not locked here.

---

# Typography

## Typeface

- **Inter** for all UI, body, and headings
- **Geist Mono** for code, coordinates, module IDs, numeric values, technical labels

## Scale

Type scale defined by ratio, not exhaustive pixel list.

- Display: large workspace titles, empty-state headlines
- Heading: panel titles, section labels
- Body: default reading size
- Small: metadata, secondary info
- Mono: technical values at body or small size

Line height generous to preserve the calm, spacious feel.

---

# Iconography

**Lucide** icon set.

Consistent stroke weight across the UI. Lucide selected for breadth (1000+ icons), neutral style, and easy shadcn/ui integration.

## Module Icons

Functional modules use Lucide's hardware-relevant glyphs:

- Power → `power`
- MCU → `cpu`
- Sensor → `sensor` or `radar`
- Display → `monitor` or `tablet`
- Battery → `battery`
- Connectivity → `wifi` or `radio`

If Lucide lacks a needed glyph, fall back to a generic module icon and document the gap. Do not mix icon sets.

---

# Motion

**Polished** motion tier.

Motion is functional plus subtle micro-interactions that signal craft without distracting from engineering work.

## Range

- State transitions: 150 to 200ms
- Panel slides and entrances: 200 to 350ms
- Easing: custom curves, not linear

## Uses

- Hover lifts on interactive cards
- Panel slide-in / slide-out
- Agent message entrance
- Toggle and expand animations
- Loading and streaming states for AI responses

## Forbidden

- No parallax
- No decorative animation
- No motion that delays interaction
- No motion on the canvas that interferes with direct manipulation

---

# Density

**Comfortable** density.

Generous spacing. Larger touch targets. Fewer items visible per screen.

This baseline serves the primary audience (makers, students, indie startups) and preserves the creative-studio feel. The interface should breathe.

No density toggle for MVP. If power users request it later, revisit.

---

# AI Interaction Model

HardwarePilot AI communicates through a **notification + activity feed** model, not a single chat thread and not inline popovers.

This model maps directly to ai-workflow-rules.md Rule 5 (risk tiers) and Rule 6 (decision logging).

## Low-Risk Changes → Toast Notifications

When AI auto-applies a low-risk change (rename module, organize graph, improve description, create metadata):

- Show a transient toast at the bottom of the screen
- Toast states what changed and which agent acted
- Toast auto-dismisses
- Activity log entry created silently

## Medium and High-Risk Proposals → Activity Feed

When AI proposes a medium or high-risk change (move module, change placement, replace component, change architecture, split boards, introduce flex PCB, remove module):

- Proposal appears in a dedicated **Activity / Decisions panel**
- Proposal includes: decision, reason, tradeoffs, alternatives (per ai-workflow-rules Rule 3)
- User action required: Approve or Reject
- High-risk proposals cannot auto-execute under any condition
- Approved proposals apply to the graph and log a decision entry

## Free-Form Questions → Chat Dock

When users want to ask the AI a question (not act on a proposal):

- Use the floating chat dock
- Intent Agent handles open-ended questions
- Responses may include inline suggestions that, if accepted, generate proposals in the activity feed

## Separation Principle

The chat dock is for **asking**. The activity feed is for **deciding**. These are separate surfaces with separate purposes. Do not merge them.

---

# Interaction Patterns

## Canvas Direct Manipulation

On the Form and Module Graph workspaces:

- Move modules by drag
- Rotate via handle or keyboard
- Resize placement regions by drag handle
- Selection highlights in accent color
- AI validation runs on drop (clearance, routing feasibility, assembly, manufacturing)

## Graph Connections

On the Module Graph workspace:

- Drag from one module port to another to create a relationship
- Edges label with relationship type (electrical, mechanical, placement, manufacturing)
- Invalid connections show inline warning, do not complete

## 3D Orbit

On the 3D Preview workspace:

- Orbit, pan, zoom via pointer
- Click a module in 3D to highlight its node in the graph workspace
- Cross-workspace highlighting binds the surfaces together through the graph

## Proposal-to-Canvas Link

When a proposal in the activity feed affects specific modules:

- Click the proposal → affected modules highlight on the active canvas
- User sees exactly what would change before approving

---

# Alignment With Architecture

This UI context follows the invariants in architecture.md:

- The graph is the source of truth — the UI always reflects graph state, never holds hidden UI-only state
- Form, Electronics, and Manufacturing are equal — no workspace dominates by default; each is a full workspace
- Every AI decision is explainable — proposals in the feed include reason, tradeoffs, alternatives
- Users own the design — Approve/Reject gates every medium and high-risk change
- Generated assets are disposable — 3D preview and STL are derived, never authoritative
